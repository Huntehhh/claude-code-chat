/**
 * Shared types between extension and webview
 * This file serves as the single source of truth for IPC message types
 *
 * IMPORTANT: This file is imported by BOTH the extension (Node.js) and
 * the webview (browser). Do not import Node.js-specific modules here.
 */

// =============================================================================
// Re-export message types from messages.ts
// =============================================================================

export type {
  // Base
  BaseMessage,

  // Webview → Extension messages
  WebviewToExtensionMessage,
  SendMessageRequest,
  NewSessionRequest,
  StopProcessRequest,
  CopyCodeRequest,
  PermissionResponseMessage,
  RestoreToCommitRequest,
  LoadConversationRequest,
  RequestConversationsRequest,
  RequestWorkspaceFilesRequest,
  SelectImageFileRequest,
  UpdateSettingsRequest,
  SetSelectedModelRequest,
  OpenModelTerminalRequest,
  OpenUsageTerminalRequest,
  SaveMCPServerRequest,
  DeleteMCPServerRequest,
  SaveCustomSnippetRequest,
  DeleteCustomSnippetRequest,
  AddPermissionRequest,
  RemovePermissionRequest,
  OpenFileInEditorRequest,
  OpenDiffByIndexRequest,
  SaveInputTextRequest,
  SaveScrollPositionRequest,
  RenameChatRequest,
  ExecuteSlashCommandRequest,
  DismissWSLAlertRequest,
  EnableYoloModeRequest,
  RunInstallRequest,
  GetClipboardTextRequest,
  CreateImageRequest,

  // Extension → Webview messages
  ExtensionToWebviewMessage,
  ReadyMessage,
  StreamingMessageUpdate,
  ToolResultMessage,
  PermissionRequestMessage,
  ShowRestoreOptionMessage,
  ConversationListMessage,
  MCPServersMessage,
  CustomSnippetsMessage,
  PermissionsListMessage,
  WorkspaceFilesMessage,
  SettingsMessage,
  PlatformInfoMessage,
  ErrorMessage,
  ClipboardTextMessage,
  InstallCompleteMessage,
  TerminalOpenedMessage,

  // Data types
  CommitInfo,
  ConversationListItem,
  MCPServerConfig,
  CustomSnippet,
  PermissionsData,
  WorkspaceFile,
  ConversationMessage
} from './messages';

// Re-export type guards
export {
  isValidWebviewMessage,
  isSendMessageRequest,
  isPermissionResponse
} from './messages';

// =============================================================================
// Additional Shared Types
// =============================================================================

/**
 * Message types from Claude CLI (JSON stream)
 * These are parsed from stdout when communicating with claude CLI
 */
export type CLIMessageType =
  | 'user'
  | 'assistant'
  | 'system'
  | 'control_request'
  | 'control_response'
  | 'result'
  | 'session';

/**
 * Base interface for CLI messages
 */
export interface CLIMessage {
  type: CLIMessageType;
}

/**
 * Tool use information from Claude
 */
export interface ToolUseInfo {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result information
 */
export interface ToolResultInfo {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

/**
 * Text content block
 */
export interface TextContent {
  type: 'text';
  text: string;
}

/**
 * Image content block
 */
export interface ImageContent {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

/**
 * Union of all content block types
 */
export type ContentBlock = TextContent | ToolUseInfo | ToolResultInfo | ImageContent;

/**
 * Control request from Claude CLI (permission prompts)
 */
export interface CLIControlRequest {
  type: 'control_request';
  request_id: string;
  tool: {
    name: string;
    input: Record<string, unknown>;
  };
}

/**
 * Control response sent back to Claude CLI
 */
export interface CLIControlResponse {
  type: 'control_response';
  request_id: string;
  decision: 'approved' | 'denied';
}

/**
 * Result message from Claude CLI (end of response)
 */
export interface CLIResultMessage {
  type: 'result';
  cost_usd?: number;
  input_tokens?: number;
  output_tokens?: number;
  model?: string;
  session_id?: string;
}

// =============================================================================
// Type Guards for CLI Messages
// =============================================================================

/**
 * Check if a parsed JSON is a CLI control request
 */
export function isCLIControlRequest(msg: unknown): msg is CLIControlRequest {
  if (typeof msg !== 'object' || msg === null) return false;
  const m = msg as Record<string, unknown>;
  return m.type === 'control_request' && typeof m.request_id === 'string';
}

/**
 * Check if a parsed JSON is a CLI result message
 */
export function isCLIResultMessage(msg: unknown): msg is CLIResultMessage {
  if (typeof msg !== 'object' || msg === null) return false;
  return (msg as Record<string, unknown>).type === 'result';
}

/**
 * Check if content is a tool use block
 */
export function isToolUse(content: ContentBlock): content is ToolUseInfo {
  return content.type === 'tool_use';
}

/**
 * Check if content is a tool result block
 */
export function isToolResult(content: ContentBlock): content is ToolResultInfo {
  return content.type === 'tool_result';
}

/**
 * Check if content is a text block
 */
export function isTextContent(content: ContentBlock): content is TextContent {
  return content.type === 'text';
}

// =============================================================================
// Message Utilities
// =============================================================================

/**
 * Extract text from a content block array
 */
export function extractTextFromContent(content: ContentBlock[]): string {
  return content
    .filter(isTextContent)
    .map(c => c.text)
    .join('');
}

/**
 * Find tool uses in a content block array
 */
export function extractToolUses(content: ContentBlock[]): ToolUseInfo[] {
  return content.filter(isToolUse);
}
