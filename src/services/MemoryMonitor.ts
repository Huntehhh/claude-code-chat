/**
 * MemoryMonitor - Periodic memory usage monitoring
 *
 * Monitors extension memory usage and logs warnings when
 * thresholds are exceeded. Helps detect memory leaks early.
 */

export interface MemoryStats {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rssUnused: number;
  timestamp: number;
}

export interface MemoryMonitorConfig {
  /** Check interval in milliseconds (default: 60000 = 1 minute) */
  intervalMs: number;
  /** Warning threshold in MB (default: 500) */
  warningThresholdMB: number;
  /** Critical threshold in MB (default: 1000) */
  criticalThresholdMB: number;
  /** Enable console logging (default: true) */
  logToConsole: boolean;
}

export type MemoryAlertLevel = 'normal' | 'warning' | 'critical';

export interface MemoryAlertCallback {
  (level: MemoryAlertLevel, stats: MemoryStats): void;
}

const DEFAULT_CONFIG: MemoryMonitorConfig = {
  intervalMs: 60000, // 1 minute
  warningThresholdMB: 500,
  criticalThresholdMB: 1000,
  logToConsole: true,
};

export class MemoryMonitor {
  private _interval: ReturnType<typeof setInterval> | undefined;
  private _config: MemoryMonitorConfig;
  private _alertCallback: MemoryAlertCallback | undefined;
  private _history: MemoryStats[] = [];
  private _maxHistoryLength = 60; // Keep last 60 readings

  constructor(config: Partial<MemoryMonitorConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start monitoring memory usage
   */
  start(): void {
    if (this._interval) {
      return; // Already running
    }

    // Take initial reading
    this._checkMemory();

    // Schedule periodic checks
    this._interval = setInterval(() => {
      this._checkMemory();
    }, this._config.intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  /**
   * Set a callback for memory alerts
   */
  onAlert(callback: MemoryAlertCallback): void {
    this._alertCallback = callback;
  }

  /**
   * Get current memory stats
   */
  getCurrentStats(): MemoryStats {
    const usage = process.memoryUsage();
    return {
      heapUsedMB: usage.heapUsed / 1024 / 1024,
      heapTotalMB: usage.heapTotal / 1024 / 1024,
      externalMB: usage.external / 1024 / 1024,
      rssUnused: usage.rss / 1024 / 1024,
      timestamp: Date.now(),
    };
  }

  /**
   * Get memory usage history
   */
  getHistory(): MemoryStats[] {
    return [...this._history];
  }

  /**
   * Get current alert level
   */
  getAlertLevel(stats?: MemoryStats): MemoryAlertLevel {
    const currentStats = stats || this.getCurrentStats();

    if (currentStats.heapUsedMB >= this._config.criticalThresholdMB) {
      return 'critical';
    }
    if (currentStats.heapUsedMB >= this._config.warningThresholdMB) {
      return 'warning';
    }
    return 'normal';
  }

  /**
   * Force a garbage collection hint (if available)
   * Note: Only works if node is started with --expose-gc
   */
  suggestGC(): void {
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  private _checkMemory(): void {
    const stats = this.getCurrentStats();

    // Add to history
    this._history.push(stats);
    if (this._history.length > this._maxHistoryLength) {
      this._history.shift();
    }

    const level = this.getAlertLevel(stats);

    // Log based on level
    if (this._config.logToConsole) {
      if (level === 'critical') {
        console.error(
          `[MemoryMonitor] CRITICAL: Heap usage ${stats.heapUsedMB.toFixed(2)} MB ` +
          `exceeds ${this._config.criticalThresholdMB} MB threshold`
        );
      } else if (level === 'warning') {
        console.warn(
          `[MemoryMonitor] WARNING: Heap usage ${stats.heapUsedMB.toFixed(2)} MB ` +
          `exceeds ${this._config.warningThresholdMB} MB threshold`
        );
      }
    }

    // Notify callback
    if (this._alertCallback && level !== 'normal') {
      this._alertCallback(level, stats);
    }
  }

  /**
   * Dispose of the monitor
   */
  dispose(): void {
    this.stop();
    this._history = [];
    this._alertCallback = undefined;
  }
}

// Singleton instance for the extension
let _instance: MemoryMonitor | undefined;

export function getMemoryMonitor(config?: Partial<MemoryMonitorConfig>): MemoryMonitor {
  if (!_instance) {
    _instance = new MemoryMonitor(config);
  }
  return _instance;
}

export function resetMemoryMonitor(): void {
  _instance?.dispose();
  _instance = undefined;
}
