/**
 * Type exports for the extension
 * Import from '@/types' or '../types' instead of individual files
 */

// Process types
export type {
  ProcessConfig,
  HeartbeatConfig,
  ProcessManagerCallbacks,
  PanelProcessInfo,
  ProcessSpawnOptions
} from './process';

export {
  DEFAULT_HEARTBEAT_CONFIG,
  isValidProcessConfig,
  hasProcessConfigChanged
} from './process';

// Session types
export type {
  ConversationData,
  ConversationIndexEntry,
  PanelState,
  PendingPermission,
  TodoItem,
  SessionMetadata,
  CLISessionInfo
} from './session';

export {
  isValidConversationData,
  isCLISessionInfo,
  createEmptyPanelState,
  generateSessionId
} from './session';

// Shared types (re-exports from messages.ts + CLI types)
export * from './shared';

// Original messages.ts exports (for backward compatibility)
export * from './messages';
