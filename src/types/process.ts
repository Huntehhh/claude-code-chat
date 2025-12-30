/**
 * Process-related type definitions
 * Single source of truth for process management types
 */

import * as cp from 'child_process';

// =============================================================================
// Process Configuration
// =============================================================================

/**
 * Configuration for spawning a Claude CLI process
 */
export interface ProcessConfig {
  /** Working directory for the process */
  cwd: string;
  /** Command line arguments to pass to Claude CLI */
  args: string[];
  /** Whether to run through WSL */
  wslEnabled: boolean;
  /** WSL distribution name (e.g., 'Ubuntu') */
  wslDistro: string;
  /** Path to Node.js in WSL (only used when wslEnabled) */
  nodePath: string;
  /** Path to Claude CLI in WSL (only used when wslEnabled) */
  claudePath: string;
}

/**
 * Configuration for heartbeat monitoring
 */
export interface HeartbeatConfig {
  /** Interval between heartbeat checks in ms (default: 30000) */
  intervalMs: number;
  /** Timeout to consider process unresponsive in ms (default: 5000) */
  timeoutMs: number;
}

/**
 * Default heartbeat configuration values
 */
export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  intervalMs: 30000,
  timeoutMs: 5000
};

// =============================================================================
// Process Callbacks
// =============================================================================

/**
 * Callbacks for process lifecycle events
 */
export interface ProcessManagerCallbacks {
  /** Called when data is received on stdout */
  onStdout: (data: string) => void;
  /** Called when data is received on stderr */
  onStderr: (data: string) => void;
  /** Called when process closes */
  onClose: (code: number | null, errorOutput: string) => void;
  /** Called when process encounters an error */
  onError: (error: Error) => void;
  /** Called when process becomes unresponsive (optional) */
  onUnresponsive?: () => void;
}

// =============================================================================
// Panel Process State
// =============================================================================

/**
 * State for a process associated with a specific webview panel
 */
export interface PanelProcessInfo {
  /** The child process instance */
  process: cp.ChildProcess;
  /** Configuration used to spawn this process */
  config: ProcessConfig;
  /** Raw output buffer for incomplete JSON lines */
  rawOutput: string;
  /** Abort controller for cancellation */
  abortController: AbortController;
}

// =============================================================================
// Process Spawn Options
// =============================================================================

/**
 * Options that can be passed when spawning a process
 */
export interface ProcessSpawnOptions {
  /** Optional session ID to resume */
  resumeSessionId?: string;
  /** Whether to use thinking mode */
  thinkingMode?: boolean;
  /** Whether to use plan mode */
  planMode?: boolean;
  /** Selected model override */
  selectedModel?: string;
}

/**
 * High-level spawn options for Claude CLI
 * Used by spawnWithOptions() for a cleaner API
 */
export interface ClaudeSpawnOptions {
  /** Working directory */
  cwd: string;
  /** Session ID to resume (optional) */
  sessionId?: string;
  /** Model to use (optional) */
  model?: string;
  /** Enable yolo mode (skip permission checks) */
  yoloMode?: boolean;
  /** Enable plan mode */
  planMode?: boolean;
  /** WSL configuration */
  wslEnabled?: boolean;
  wslDistro?: string;
  nodePath?: string;
  claudePath?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is a valid ProcessConfig
 */
export function isValidProcessConfig(config: unknown): config is ProcessConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.cwd === 'string' &&
    Array.isArray(c.args) &&
    typeof c.wslEnabled === 'boolean' &&
    typeof c.wslDistro === 'string' &&
    typeof c.nodePath === 'string' &&
    typeof c.claudePath === 'string'
  );
}

/**
 * Compare two ProcessConfig objects to detect changes
 * Used to determine if a process needs restart
 */
export function hasProcessConfigChanged(
  oldConfig: ProcessConfig | undefined,
  newConfig: ProcessConfig
): boolean {
  if (!oldConfig) return true;

  return (
    oldConfig.cwd !== newConfig.cwd ||
    oldConfig.wslEnabled !== newConfig.wslEnabled ||
    oldConfig.wslDistro !== newConfig.wslDistro ||
    oldConfig.nodePath !== newConfig.nodePath ||
    oldConfig.claudePath !== newConfig.claudePath ||
    JSON.stringify(oldConfig.args) !== JSON.stringify(newConfig.args)
  );
}
