/**
 * MessageDebouncer - Debounces streaming messages to reduce re-renders
 *
 * Batches rapid streaming updates (text, thinking) while allowing
 * control messages (toolUse, toolResult, result) through immediately.
 */

export interface DebouncedMessage {
  type: string;
  data: unknown;
}

export type MessageSender = (message: DebouncedMessage) => void;

// Message types that should be debounced (streaming content)
const DEBOUNCED_TYPES = new Set(['output', 'thinking']);

// Message types that should pass through immediately
const IMMEDIATE_TYPES = new Set([
  'toolUse',
  'toolResult',
  'sessionInfo',
  'result',
  'error',
  'setProcessing',
  'updateTokens',
  'updateTotals',
  'todosUpdated',
  'compacting',
  'compactBoundary',
]);

export class MessageDebouncer {
  private _pendingMessages: Map<string, string> = new Map();
  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private _sender: MessageSender;
  private _debounceMs: number;
  private _maxWaitMs: number;
  private _lastFlushTime: number = 0;

  constructor(sender: MessageSender, debounceMs = 50, maxWaitMs = 100) {
    this._sender = sender;
    this._debounceMs = debounceMs;
    this._maxWaitMs = maxWaitMs;
  }

  /**
   * Send a message, potentially debouncing it
   */
  send(message: DebouncedMessage): void {
    if (IMMEDIATE_TYPES.has(message.type)) {
      // Flush any pending debounced messages first
      this._flush();
      // Send immediately
      this._sender(message);
      return;
    }

    if (DEBOUNCED_TYPES.has(message.type)) {
      // Accumulate content for debouncing
      const existing = this._pendingMessages.get(message.type) || '';
      const newContent = typeof message.data === 'string' ? message.data : '';
      this._pendingMessages.set(message.type, existing + newContent);

      // Reset debounce timer
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }

      // Check if we've exceeded max wait time
      const now = Date.now();
      const timeSinceLastFlush = now - this._lastFlushTime;

      if (timeSinceLastFlush >= this._maxWaitMs) {
        // Force flush after max wait
        this._flush();
      } else {
        // Schedule flush after debounce delay
        this._debounceTimer = setTimeout(() => {
          this._flush();
        }, this._debounceMs);
      }
      return;
    }

    // Unknown types pass through immediately
    this._sender(message);
  }

  /**
   * Flush all pending debounced messages
   */
  private _flush(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = undefined;
    }

    this._lastFlushTime = Date.now();

    // Send accumulated messages
    for (const [type, content] of this._pendingMessages.entries()) {
      if (content) {
        this._sender({ type, data: content });
      }
    }

    this._pendingMessages.clear();
  }

  /**
   * Force flush - call when processing ends
   */
  forceFlush(): void {
    this._flush();
  }

  /**
   * Clear pending messages without sending
   */
  clear(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = undefined;
    }
    this._pendingMessages.clear();
  }

  /**
   * Dispose of the debouncer
   */
  dispose(): void {
    this._flush();
  }
}
