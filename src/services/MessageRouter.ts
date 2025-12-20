/**
 * MessageRouter - Handler registry pattern for webview messages
 *
 * Replaces the massive switch statement in extension.ts with a
 * registry-based approach that follows Open/Closed principle.
 */

export type MessageHandler<T = unknown> = (data: T, panelId?: string) => void | Promise<void>;

export interface MessageHandlerConfig<T = unknown> {
  handler: MessageHandler<T>;
  description?: string;
}

export class MessageRouter {
  private _handlers = new Map<string, MessageHandlerConfig>();

  /**
   * Register a handler for a specific message type
   */
  register<T = unknown>(
    messageType: string,
    handler: MessageHandler<T>,
    description?: string
  ): void {
    if (this._handlers.has(messageType)) {
      console.warn(`MessageRouter: Overwriting handler for '${messageType}'`);
    }
    this._handlers.set(messageType, { handler: handler as MessageHandler, description });
  }

  /**
   * Register multiple handlers at once
   */
  registerAll(handlers: Record<string, MessageHandler>): void {
    for (const [type, handler] of Object.entries(handlers)) {
      this.register(type, handler);
    }
  }

  /**
   * Route a message to its registered handler
   */
  async route(message: { type: string; [key: string]: unknown }, panelId?: string): Promise<boolean> {
    const config = this._handlers.get(message.type);

    if (!config) {
      console.warn(`MessageRouter: No handler for message type '${message.type}'`);
      return false;
    }

    try {
      await config.handler(message, panelId);
      return true;
    } catch (error) {
      console.error(`MessageRouter: Error handling '${message.type}':`, error);
      throw error;
    }
  }

  /**
   * Check if a handler exists for a message type
   */
  hasHandler(messageType: string): boolean {
    return this._handlers.has(messageType);
  }

  /**
   * Get all registered message types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this._handlers.keys());
  }

  /**
   * Unregister a handler
   */
  unregister(messageType: string): boolean {
    return this._handlers.delete(messageType);
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this._handlers.clear();
  }

  /**
   * Get handler count for debugging
   */
  get handlerCount(): number {
    return this._handlers.size;
  }
}

// Singleton instance for the extension
let _instance: MessageRouter | undefined;

export function getMessageRouter(): MessageRouter {
  if (!_instance) {
    _instance = new MessageRouter();
  }
  return _instance;
}

export function resetMessageRouter(): void {
  _instance?.clear();
  _instance = undefined;
}
