/**
 * ProcessManager - Handles Claude process lifecycle and I/O
 *
 * Manages spawning, communication, and termination of the Claude CLI process.
 * Includes heartbeat monitoring for zombie detection and graceful shutdown.
 */

import * as cp from 'child_process';
import * as util from 'util';
import { Mutex } from 'async-mutex';

// Import types from centralized type definitions
import type { ProcessConfig, ProcessManagerCallbacks, HeartbeatConfig } from '../types/process';
import { DEFAULT_HEARTBEAT_CONFIG } from '../types/process';

// Re-export types for backward compatibility
export type { ProcessConfig, ProcessManagerCallbacks, HeartbeatConfig };
export { DEFAULT_HEARTBEAT_CONFIG };

const exec = util.promisify(cp.exec);

/**
 * Escapes a string for safe use in a bash shell command.
 */
function shellEscape(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * Validates that a path doesn't contain dangerous shell characters.
 */
function isValidShellPath(pathStr: string): boolean {
  const dangerousChars = /[;&|`$(){}[\]<>!#*?~]/;
  return !dangerousChars.test(pathStr);
}

// =============================================================================
// WSL Path Utilities
// =============================================================================

/**
 * Check if a path is already a WSL/Unix path
 */
function isWSLPath(path: string): boolean {
  return path.startsWith('/');
}

/**
 * Check if a path is a UNC path (network share)
 */
function isUNCPath(path: string): boolean {
  return path.startsWith('\\\\') || path.startsWith('//');
}

/**
 * Convert a Windows path to WSL path format
 * Handles edge cases: UNC paths, already-converted paths, special characters
 */
function convertToWSLPath(windowsPath: string): string {
  // Already a WSL/Unix path - don't double-convert
  if (isWSLPath(windowsPath)) {
    return windowsPath;
  }

  // UNC paths are not supported in WSL mount
  if (isUNCPath(windowsPath)) {
    console.warn('UNC paths not fully supported in WSL:', windowsPath);
    // Try to handle \\wsl$\distro\... paths specially
    if (windowsPath.toLowerCase().startsWith('\\\\wsl$\\') || windowsPath.toLowerCase().startsWith('//wsl$/')) {
      // Extract the path after the distro name
      const match = windowsPath.match(/^[\\\/]{2}wsl\$[\\\/]([^\\\/]+)[\\\/](.*)$/i);
      if (match) {
        return '/' + match[2].replace(/\\/g, '/');
      }
    }
    return windowsPath;
  }

  // Standard Windows path (e.g., C:\Users\...)
  const driveMatch = windowsPath.match(/^([a-zA-Z]):/);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const rest = windowsPath.slice(2).replace(/\\/g, '/');
    return `/mnt/${drive}${rest}`;
  }

  // Relative path or other format - normalize separators
  return windowsPath.replace(/\\/g, '/');
}

export class ProcessManager {
  private _currentProcess: cp.ChildProcess | undefined;
  private _abortController: AbortController | undefined;

  // Mutex for process operations to prevent race conditions
  private _operationMutex = new Mutex();
  private _isWslProcess: boolean = false;
  private _wslDistro: string = 'Ubuntu';
  private _callbacks: ProcessManagerCallbacks;
  private _errorOutput: string = '';

  // Heartbeat monitoring
  private _heartbeatInterval: NodeJS.Timeout | undefined;
  private _heartbeatTimeout: NodeJS.Timeout | undefined;
  private _lastActivityTime: number = 0;
  private _heartbeatConfig: HeartbeatConfig;

  constructor(callbacks: ProcessManagerCallbacks, heartbeatConfig?: Partial<HeartbeatConfig>) {
    this._callbacks = callbacks;
    this._heartbeatConfig = { ...DEFAULT_HEARTBEAT_CONFIG, ...heartbeatConfig };
  }

  /**
   * Spawn a new Claude process
   * Protected by mutex to prevent race conditions with concurrent spawn/kill
   */
  spawn(config: ProcessConfig): cp.ChildProcess {
    // Synchronous wrapper - actual spawn is synchronous
    // Mutex is acquired/released synchronously to protect the critical section
    const release = this._operationMutex.acquire();

    try {
      // Create new AbortController for this process
      this._abortController = new AbortController();
      this._errorOutput = '';
      this._lastActivityTime = Date.now();

      let claudeProcess: cp.ChildProcess;

      if (config.wslEnabled) {
        claudeProcess = this._spawnWSL(config);
      } else {
        claudeProcess = this._spawnNative(config);
      }

      this._currentProcess = claudeProcess;
      this._setupEventHandlers(claudeProcess);
      this._startHeartbeat(claudeProcess);

      return claudeProcess;
    } finally {
      // Release mutex after spawn completes (async release is fine here)
      release.then(r => r());
    }
  }

  /**
   * Spawn a new Claude process (async version with proper mutex handling)
   * Use this when you need to ensure spawn completes before proceeding
   */
  async spawnAsync(config: ProcessConfig): Promise<cp.ChildProcess> {
    const release = await this._operationMutex.acquire();

    try {
      // Create new AbortController for this process
      this._abortController = new AbortController();
      this._errorOutput = '';
      this._lastActivityTime = Date.now();

      let claudeProcess: cp.ChildProcess;

      if (config.wslEnabled) {
        claudeProcess = this._spawnWSL(config);
      } else {
        claudeProcess = this._spawnNative(config);
      }

      this._currentProcess = claudeProcess;
      this._setupEventHandlers(claudeProcess);
      this._startHeartbeat(claudeProcess);

      return claudeProcess;
    } finally {
      release();
    }
  }

  private _spawnWSL(config: ProcessConfig): cp.ChildProcess {
    const { cwd, args, wslDistro, nodePath, claudePath } = config;

    // Convert Windows cwd to WSL path format
    const wslCwd = convertToWSLPath(cwd);
    console.log('Using WSL configuration:', { wslDistro, nodePath, claudePath, cwd, wslCwd });

    // Validate paths to prevent command injection
    if (!isValidShellPath(nodePath)) {
      throw new Error(`Invalid nodePath configuration: "${nodePath}" contains unsafe characters`);
    }
    if (!isValidShellPath(claudePath)) {
      throw new Error(`Invalid claudePath configuration: "${claudePath}" contains unsafe characters`);
    }
    if (!isValidShellPath(wslDistro)) {
      throw new Error(`Invalid wslDistro configuration: "${wslDistro}" contains unsafe characters`);
    }

    // Build command with properly escaped arguments
    // Include cd to wslCwd since Windows cwd may not work inside WSL
    const escapedArgs = args.map(arg => shellEscape(arg)).join(' ');
    const wslCommand = `cd ${shellEscape(wslCwd)} && ${shellEscape(nodePath)} --no-warnings --enable-source-maps ${shellEscape(claudePath)} ${escapedArgs}`;

    // Track WSL state for proper process termination
    this._isWslProcess = true;
    this._wslDistro = wslDistro;

    return cp.spawn('wsl', ['-d', wslDistro, 'bash', '-ic', wslCommand], {
      signal: this._abortController!.signal,
      detached: process.platform !== 'win32',
      cwd: cwd, // Keep original cwd for Windows-side process
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1'
      }
    });
  }

  private _spawnNative(config: ProcessConfig): cp.ChildProcess {
    this._isWslProcess = false;

    console.log('Using native Claude command');
    return cp.spawn('claude', config.args, {
      signal: this._abortController!.signal,
      shell: process.platform === 'win32',
      detached: process.platform !== 'win32',
      cwd: config.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        NO_COLOR: '1'
      }
    });
  }

  private _setupEventHandlers(claudeProcess: cp.ChildProcess): void {
    if (claudeProcess.stdout) {
      claudeProcess.stdout.on('data', (data) => {
        this._recordActivity();
        this._callbacks.onStdout(data.toString());
      });
    }

    if (claudeProcess.stderr) {
      claudeProcess.stderr.on('data', (data) => {
        this._recordActivity();
        const str = data.toString();
        this._errorOutput += str;
        this._callbacks.onStderr(str);
      });
    }

    claudeProcess.on('close', (code) => {
      console.log('Claude process closed with code:', code);
      console.log('Claude stderr output:', this._errorOutput);

      this._stopHeartbeat();

      if (!this._currentProcess) {
        return;
      }

      this._currentProcess = undefined;
      this._callbacks.onClose(code, this._errorOutput);
    });

    claudeProcess.on('error', (error) => {
      console.log('Claude process error:', error.message);

      this._stopHeartbeat();

      if (!this._currentProcess) {
        return;
      }

      this._currentProcess = undefined;
      this._callbacks.onError(error);
    });
  }

  /**
   * Record activity timestamp (used by heartbeat monitoring)
   */
  private _recordActivity(): void {
    this._lastActivityTime = Date.now();
  }

  /**
   * Start heartbeat monitoring for the process
   */
  private _startHeartbeat(claudeProcess: cp.ChildProcess): void {
    this._stopHeartbeat(); // Clear any existing heartbeat

    this._heartbeatInterval = setInterval(() => {
      if (!this.isRunning()) {
        this._stopHeartbeat();
        return;
      }

      // Check if we've received any activity recently
      const timeSinceActivity = Date.now() - this._lastActivityTime;

      // If there's been recent activity, process is healthy
      if (timeSinceActivity < this._heartbeatConfig.intervalMs) {
        return;
      }

      // No recent activity - start timeout for unresponsive check
      // We'll consider the process unresponsive if no activity after timeout
      console.log('No recent process activity, starting unresponsive check...');

      // Clear any existing timeout to prevent stacking
      if (this._heartbeatTimeout) {
        clearTimeout(this._heartbeatTimeout);
        this._heartbeatTimeout = undefined;
      }

      this._heartbeatTimeout = setTimeout(async () => {
        // Double-check: if still no activity, consider unresponsive
        const currentTimeSinceActivity = Date.now() - this._lastActivityTime;

        if (currentTimeSinceActivity > this._heartbeatConfig.intervalMs + this._heartbeatConfig.timeoutMs) {
          console.warn('Process appears unresponsive, triggering recovery...');

          // Notify callback if provided
          this._callbacks.onUnresponsive?.();

          // Kill and let the callback handler decide whether to restart
          await this.kill();
          this._callbacks.onError(new Error('Process became unresponsive (no activity for extended period)'));
        }
      }, this._heartbeatConfig.timeoutMs);
    }, this._heartbeatConfig.intervalMs);
  }

  /**
   * Stop heartbeat monitoring
   */
  private _stopHeartbeat(): void {
    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = undefined;
    }
    if (this._heartbeatTimeout) {
      clearTimeout(this._heartbeatTimeout);
      this._heartbeatTimeout = undefined;
    }
  }

  /**
   * Write data to the process stdin
   */
  write(data: string): boolean {
    if (this._currentProcess?.stdin && !this._currentProcess.stdin.destroyed) {
      this._recordActivity(); // Writing is also activity
      return this._currentProcess.stdin.write(data);
    }
    return false;
  }

  /**
   * End the process stdin stream
   */
  endStdin(): void {
    if (this._currentProcess?.stdin && !this._currentProcess.stdin.destroyed) {
      this._currentProcess.stdin.end();
    }
  }

  /**
   * Kill the Claude process and all its children
   * Uses graceful shutdown sequence: stdin → SIGTERM → SIGKILL
   * Protected by mutex to prevent race conditions with concurrent spawn/kill
   */
  async kill(): Promise<void> {
    // Acquire mutex with timeout to prevent deadlock
    const release = await this._operationMutex.acquire();

    try {
      const processToKill = this._currentProcess;
      const pid = processToKill?.pid;

      // Stop monitoring immediately
      this._stopHeartbeat();

      // 1. Abort via controller (clean API)
      this._abortController?.abort();
      this._abortController = undefined;

      // 2. Clear reference immediately
      this._currentProcess = undefined;

      if (!pid) {
        return;
      }

    console.log(`Terminating Claude process group (PID: ${pid})...`);

    // 3. Try graceful shutdown via stdin first
    if (processToKill?.stdin && !processToKill.stdin.destroyed) {
      try {
        console.log('Attempting graceful shutdown via stdin...');
        processToKill.stdin.write(JSON.stringify({ type: 'shutdown' }) + '\n');
        processToKill.stdin.end();

        // Wait briefly for graceful exit
        const gracefulExit = await this._waitForExit(processToKill, 500);
        if (gracefulExit) {
          console.log('Process exited gracefully via stdin signal');
          return;
        }
      } catch {
        // stdin write failed, continue with signals
      }
    }

    // 4. SIGTERM - polite termination request
    console.log('Sending SIGTERM...');
    await this._killProcessGroup(pid, 'SIGTERM');

    // Wait for process to exit with timeout
    const sigTermExit = await this._waitForExit(processToKill, 2000);
    if (sigTermExit) {
      console.log('Process exited via SIGTERM');
      return;
    }

    // 5. SIGKILL as last resort
    if (processToKill && !processToKill.killed) {
      console.log(`Force killing Claude process group (PID: ${pid}) with SIGKILL...`);
      await this._killProcessGroup(pid, 'SIGKILL');
    }

    console.log('Claude process group terminated');
    } finally {
      release();
    }
  }

  /**
   * Wait for process to exit with timeout
   * @returns true if process exited, false if timeout
   */
  private async _waitForExit(process: cp.ChildProcess, timeoutMs: number): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      if (process.killed || process.exitCode !== null) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        process.off('exit', onExit);
        resolve(false);
      }, timeoutMs);

      const onExit = () => {
        clearTimeout(timeout);
        resolve(true);
      };

      process.once('exit', onExit);
    });
  }

  private async _killProcessGroup(pid: number, signal: string = 'SIGTERM'): Promise<void> {
    if (this._isWslProcess) {
      // WSL: Kill processes inside WSL using pkill
      try {
        const killSignal = signal === 'SIGKILL' ? '-9' : '-15';
        await exec(`wsl -d ${this._wslDistro} pkill ${killSignal} -f "claude"`);
      } catch {
        // Process may already be dead or pkill not available
      }
      // Also kill the Windows-side wsl process
      try {
        await exec(`taskkill /pid ${pid} /t /f`);
      } catch {
        // Process may already be dead
      }
    } else if (process.platform === 'win32') {
      // Windows: Use taskkill with /T flag for tree kill
      try {
        await exec(`taskkill /pid ${pid} /t /f`);
      } catch {
        // Process may already be dead
      }
    } else {
      // Unix: Kill process group with negative PID
      try {
        process.kill(-pid, signal as NodeJS.Signals);
      } catch {
        // Process may already be dead
      }
    }
  }

  /**
   * Check if a process is currently running
   */
  isRunning(): boolean {
    return this._currentProcess !== undefined;
  }

  /**
   * Get the current process (for advanced operations)
   */
  getProcess(): cp.ChildProcess | undefined {
    return this._currentProcess;
  }

  /**
   * Check if running in WSL
   */
  isWSL(): boolean {
    return this._isWslProcess;
  }

  /**
   * Get current WSL distro
   */
  getWSLDistro(): string {
    return this._wslDistro;
  }

  /**
   * Get time since last activity in ms
   */
  getTimeSinceLastActivity(): number {
    return Date.now() - this._lastActivityTime;
  }

  /**
   * Manually trigger activity recording (useful for external events)
   */
  recordExternalActivity(): void {
    this._recordActivity();
  }
}
