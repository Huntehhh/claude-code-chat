/**
 * Message Handler Registry for Webview
 *
 * Replaces the massive switch statement in useVSCodeMessaging with
 * a registry-based approach following the Open/Closed principle.
 */

import type { ExtensionToWebviewMessage } from '../../types/messages';

// Generic handler type that receives the message data
export type MessageHandler<T = unknown> = (data: T) => void;

// Registry of message handlers
const handlers = new Map<string, MessageHandler>();

/**
 * Register a handler for a message type
 */
export function registerHandler<T = unknown>(
  type: string,
  handler: MessageHandler<T>
): void {
  if (handlers.has(type)) {
    console.warn(`[MessageHandlers] Overwriting handler for '${type}'`);
  }
  handlers.set(type, handler as MessageHandler);
}

/**
 * Register multiple handlers at once
 */
export function registerHandlers(
  handlerMap: Record<string, MessageHandler>
): void {
  for (const [type, handler] of Object.entries(handlerMap)) {
    registerHandler(type, handler);
  }
}

/**
 * Handle an incoming message
 */
export function handleMessage(
  message: ExtensionToWebviewMessage | { type: string; data?: unknown }
): boolean {
  const handler = handlers.get(message.type);

  if (!handler) {
    // Unknown message type - log for debugging
    console.debug(`[MessageHandlers] No handler for message type '${message.type}'`);
    return false;
  }

  try {
    handler('data' in message ? message.data : message);
    return true;
  } catch (error) {
    console.error(`[MessageHandlers] Error handling '${message.type}':`, error);
    return false;
  }
}

/**
 * Check if a handler exists
 */
export function hasHandler(type: string): boolean {
  return handlers.has(type);
}

/**
 * Get all registered message types
 */
export function getRegisteredTypes(): string[] {
  return Array.from(handlers.keys());
}

/**
 * Clear all handlers (useful for testing)
 */
export function clearHandlers(): void {
  handlers.clear();
}

/**
 * Create a typed handler registration function
 * Usage: const register = createTypedRegister<MyStoreActions>();
 */
export function createTypedRegister<TActions>() {
  return function register<K extends keyof TActions>(
    type: string,
    actionKey: K,
    actions: TActions,
    transform?: (data: unknown) => Parameters<TActions[K] extends (...args: infer P) => unknown ? (...args: P) => unknown : never>[0]
  ): void {
    const action = actions[actionKey];
    if (typeof action !== 'function') {
      throw new Error(`Action '${String(actionKey)}' is not a function`);
    }

    registerHandler(type, (data: unknown) => {
      const args = transform ? transform(data) : data;
      (action as (...args: unknown[]) => void)(args);
    });
  };
}

/**
 * Create handlers from a simple mapping object
 * Maps message types to store action calls
 */
export function createHandlersFromMapping<TData = unknown>(
  mapping: Record<string, (data: TData) => void>
): void {
  for (const [type, handler] of Object.entries(mapping)) {
    registerHandler(type, handler);
  }
}
