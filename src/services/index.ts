/**
 * Service exports for ClaudeChatProvider
 *
 * These services extract specific responsibilities from the ClaudeChatProvider
 * to improve testability, maintainability, and separation of concerns.
 */

export { BackupService, BackupServiceCallbacks } from './BackupService';
export { ConversationManager, ConversationManagerCallbacks, ConversationStats, ConversationIndexEntry, JSONLConversation } from './ConversationManager';
export { ProcessManager, ProcessManagerCallbacks, ProcessConfig } from './ProcessManager';
export { PermissionsManager, PermissionsManagerCallbacks, PermissionRequest, PermissionsData } from './PermissionsManager';
export { MessageRouter, getMessageRouter, resetMessageRouter, type MessageHandler } from './MessageRouter';
export { PanelManager, type PanelState, type PanelProcessInfo, type PanelProcessConfig, type PanelManagerCallbacks } from './PanelManager';
export * from './CliSchemas';
export { MessageDebouncer, type DebouncedMessage, type MessageSender } from './MessageDebouncer';
export { MemoryMonitor, getMemoryMonitor, resetMemoryMonitor, type MemoryStats, type MemoryMonitorConfig, type MemoryAlertLevel } from './MemoryMonitor';
export { StreamBuffer, LineBuffer, createStreamBuffer, createLineBuffer, type ParsedJSON } from './StreamBuffer';
export { McpService, getMcpService, resetMcpService, type MCPServerConfig, type McpServiceCallbacks } from './McpService';
export { GitService, type GitServiceConfig, type CommitInfo } from './GitService';
export { SessionManager, type Session } from './SessionManager';
export { MetricsService, type Metrics } from './MetricsService';
