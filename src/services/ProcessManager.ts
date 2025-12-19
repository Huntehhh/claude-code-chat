/**
 * ProcessManager - Handles Claude process lifecycle and I/O
 *
 * Manages spawning, communication, and termination of the Claude CLI process.
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';

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

export interface ProcessConfig {
  cwd: string;
  args: string[];
  wslEnabled: boolean;
  wslDistro: string;
  nodePath: string;
  claudePath: string;
}

export interface ProcessManagerCallbacks {
  onStdout: (data: string) => void;
  onStderr: (data: string) => void;
  onClose: (code: number | null, errorOutput: string) => void;
  onError: (error: Error) => void;
}

export class ProcessManager {
  private _currentProcess: cp.ChildProcess | undefined;
  private _abortController: AbortController | undefined;
  private _isWslProcess: boolean = false;
  private _wslDistro: string = 'Ubuntu';
  private _callbacks: ProcessManagerCallbacks;
  private _errorOutput: string = '';

  constructor(callbacks: ProcessManagerCallbacks) {
    this._callbacks = callbacks;
  }

  /**
   * Spawn a new Claude process
   */
  spawn(config: ProcessConfig): cp.ChildProcess {
    // Create new AbortController for this process
    this._abortController = new AbortController();
    this._errorOutput = '';

    let claudeProcess: cp.ChildProcess;

    if (config.wslEnabled) {
      claudeProcess = this._spawnWSL(config);
    } else {
      claudeProcess = this._spawnNative(config);
    }

    this._currentProcess = claudeProcess;
    this._setupEventHandlers(claudeProcess);

    return claudeProcess;
  }

  private _spawnWSL(config: ProcessConfig): cp.ChildProcess {
    const { cwd, args, wslDistro, nodePath, claudePath } = config;

    console.log('Using WSL configuration:', { wslDistro, nodePath, claudePath });

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
    const escapedArgs = args.map(arg => shellEscape(arg)).join(' ');
    const wslCommand = `${shellEscape(nodePath)} --no-warnings --enable-source-maps ${shellEscape(claudePath)} ${escapedArgs}`;

    // Track WSL state for proper process termination
    this._isWslProcess = true;
    this._wslDistro = wslDistro;

    return cp.spawn('wsl', ['-d', wslDistro, 'bash', '-ic', wslCommand], {
      signal: this._abortController!.signal,
      detached: process.platform !== 'win32',
      cwd: cwd,
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
        this._callbacks.onStdout(data.toString());
      });
    }

    if (claudeProcess.stderr) {
      claudeProcess.stderr.on('data', (data) => {
        const str = data.toString();
        this._errorOutput += str;
        this._callbacks.onStderr(str);
      });
    }

    claudeProcess.on('close', (code) => {
      console.log('Claude process closed with code:', code);
      console.log('Claude stderr output:', this._errorOutput);

      if (!this._currentProcess) {
        return;
      }

      this._currentProcess = undefined;
      this._callbacks.onClose(code, this._errorOutput);
    });

    claudeProcess.on('error', (error) => {
      console.log('Claude process error:', error.message);

      if (!this._currentProcess) {
        return;
      }

      this._currentProcess = undefined;
      this._callbacks.onError(error);
    });
  }

  /**
   * Write data to the process stdin
   */
  write(data: string): boolean {
    if (this._currentProcess?.stdin && !this._currentProcess.stdin.destroyed) {
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
   */
  async kill(): Promise<void> {
    const processToKill = this._currentProcess;
    const pid = processToKill?.pid;

    // 1. Abort via controller (clean API)
    this._abortController?.abort();
    this._abortController = undefined;

    // 2. Clear reference immediately
    this._currentProcess = undefined;

    if (!pid) {
      return;
    }

    console.log(`Terminating Claude process group (PID: ${pid})...`);

    // 3. Kill process group (handles children)
    await this._killProcessGroup(pid, 'SIGTERM');

    // 4. Wait for process to exit, with timeout
    const exitPromise = new Promise<void>((resolve) => {
      if (processToKill?.killed) {
        resolve();
        return;
      }
      processToKill?.once('exit', () => resolve());
    });

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 2000);
    });

    await Promise.race([exitPromise, timeoutPromise]);

    // 5. Force kill if still running
    if (processToKill && !processToKill.killed) {
      console.log(`Force killing Claude process group (PID: ${pid})...`);
      await this._killProcessGroup(pid, 'SIGKILL');
    }

    console.log('Claude process group terminated');
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
}
