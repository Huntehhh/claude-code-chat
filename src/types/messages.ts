/**
 * TypeScript interfaces for all webview IPC messages
 * This provides type safety for communication between extension and webview
 */

// =============================================================================
// Base Types
// =============================================================================

export interface BaseMessage {
  type: string;
}

// =============================================================================
// Messages FROM Webview TO Extension
// =============================================================================

export interface SendMessageRequest extends BaseMessage {
  type: 'sendMessage';
  text: string;
  planMode?: boolean;
  thinkingMode?: boolean;
  isImageMessage?: boolean;
}

export interface NewSessionRequest extends BaseMessage {
  type: 'newSession';
}

export interface StopProcessRequest extends BaseMessage {
  type: 'stopProcess';
}

export interface CopyCodeRequest extends BaseMessage {
  type: 'copyCode';
  code: string;
}

export interface PermissionResponseMessage extends BaseMessage {
  type: 'permissionResponse';
  id: string;
  approved: boolean;
  alwaysAllow?: boolean;
}

export interface RestoreToCommitRequest extends BaseMessage {
  type: 'restoreToCommit';
  sha: string;
}

export interface LoadConversationRequest extends BaseMessage {
  type: 'loadConversation';
  filename: string;
  source?: 'local' | 'claude';
  fullPath?: string;
}

export interface RequestConversationsRequest extends BaseMessage {
  type: 'requestConversations';
}

export interface RequestWorkspaceFilesRequest extends BaseMessage {
  type: 'requestWorkspaceFiles';
  searchTerm?: string;
}

export interface SelectImageFileRequest extends BaseMessage {
  type: 'selectImageFile';
}

export interface UpdateSettingsRequest extends BaseMessage {
  type: 'updateSettings';
  settings: Record<string, unknown>;
}

export interface SetSelectedModelRequest extends BaseMessage {
  type: 'setSelectedModel';
  model: string;
}

export interface OpenModelTerminalRequest extends BaseMessage {
  type: 'openModelTerminal';
}

export interface OpenUsageTerminalRequest extends BaseMessage {
  type: 'openUsageTerminal';
  usageType: 'plan' | 'api';
}

export interface SaveMCPServerRequest extends BaseMessage {
  type: 'saveMCPServer';
  name: string;
  config: MCPServerConfig;
}

export interface DeleteMCPServerRequest extends BaseMessage {
  type: 'deleteMCPServer';
  name: string;
}

export interface SaveCustomSnippetRequest extends BaseMessage {
  type: 'saveCustomSnippet';
  snippet: CustomSnippet;
}

export interface DeleteCustomSnippetRequest extends BaseMessage {
  type: 'deleteCustomSnippet';
  snippetId: string;
}

export interface AddPermissionRequest extends BaseMessage {
  type: 'addPermission';
  toolName: string;
  command: string | null;
}

export interface RemovePermissionRequest extends BaseMessage {
  type: 'removePermission';
  toolName: string;
  command: string | null;
}

export interface OpenFileInEditorRequest extends BaseMessage {
  type: 'openFileInEditor';
  filePath: string;
}

export interface OpenDiffByIndexRequest extends BaseMessage {
  type: 'openDiffByIndex';
  messageIndex: number;
}

export interface SaveInputTextRequest extends BaseMessage {
  type: 'saveInputText';
  text: string;
}

export interface RenameChatRequest extends BaseMessage {
  type: 'renameChat';
  name: string;
}

export interface ExecuteSlashCommandRequest extends BaseMessage {
  type: 'executeSlashCommand';
  command: string;
}

export interface DismissWSLAlertRequest extends BaseMessage {
  type: 'dismissWSLAlert';
}

export interface EnableYoloModeRequest extends BaseMessage {
  type: 'enableYoloMode';
}

export interface RunInstallRequest extends BaseMessage {
  type: 'runInstall';
}

export interface GetClipboardTextRequest extends BaseMessage {
  type: 'getClipboardText';
}

export interface CreateImageRequest extends BaseMessage {
  type: 'createImage';
  imageData: string;
  imageType: string;
}

// Union type for all messages from webview
export type WebviewToExtensionMessage =
  | SendMessageRequest
  | NewSessionRequest
  | StopProcessRequest
  | CopyCodeRequest
  | PermissionResponseMessage
  | RestoreToCommitRequest
  | LoadConversationRequest
  | RequestConversationsRequest
  | RequestWorkspaceFilesRequest
  | SelectImageFileRequest
  | UpdateSettingsRequest
  | SetSelectedModelRequest
  | OpenModelTerminalRequest
  | OpenUsageTerminalRequest
  | SaveMCPServerRequest
  | DeleteMCPServerRequest
  | SaveCustomSnippetRequest
  | DeleteCustomSnippetRequest
  | AddPermissionRequest
  | RemovePermissionRequest
  | OpenFileInEditorRequest
  | OpenDiffByIndexRequest
  | SaveInputTextRequest
  | RenameChatRequest
  | ExecuteSlashCommandRequest
  | DismissWSLAlertRequest
  | EnableYoloModeRequest
  | RunInstallRequest
  | GetClipboardTextRequest
  | CreateImageRequest;

// =============================================================================
// Messages FROM Extension TO Webview
// =============================================================================

export interface ReadyMessage extends BaseMessage {
  type: 'ready';
  data: {
    chatName?: string;
    draftMessage: string;
    selectedModel: string;
    currentSessionId?: string;
    totalCost: number;
    totalTokensInput: number;
    totalTokensOutput: number;
    requestCount: number;
    subscriptionType?: string;
  };
}

export interface StreamingMessageUpdate extends BaseMessage {
  type: 'streamingMessage';
  data: {
    content: string;
    toolName?: string;
    toolInput?: string;
    rawInput?: Record<string, unknown>;
  };
}

export interface ToolResultMessage extends BaseMessage {
  type: 'toolResult';
  data: {
    toolName: string;
    isError: boolean;
    result: string;
  };
}

export interface PermissionRequestMessage extends BaseMessage {
  type: 'permissionRequest';
  data: {
    id: string;
    tool: string;
    input: Record<string, unknown>;
  };
}

export interface ShowRestoreOptionMessage extends BaseMessage {
  type: 'showRestoreOption';
  data: CommitInfo;
}

export interface ConversationListMessage extends BaseMessage {
  type: 'conversationList';
  data: ConversationListItem[];
}

export interface MCPServersMessage extends BaseMessage {
  type: 'mcpServers';
  data: Record<string, MCPServerConfig>;
}

export interface CustomSnippetsMessage extends BaseMessage {
  type: 'customSnippets';
  data: CustomSnippet[];
}

export interface PermissionsListMessage extends BaseMessage {
  type: 'permissionsList';
  data: PermissionsData;
}

export interface WorkspaceFilesMessage extends BaseMessage {
  type: 'workspaceFiles';
  data: WorkspaceFile[];
}

export interface SettingsMessage extends BaseMessage {
  type: 'settings';
  data: Record<string, unknown>;
}

export interface PlatformInfoMessage extends BaseMessage {
  type: 'platformInfo';
  data: {
    platform: string;
    isWindows: boolean;
    wslAlertDismissed: boolean;
    wslEnabled: boolean;
  };
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  data: string;
}

export interface ClipboardTextMessage extends BaseMessage {
  type: 'clipboardText';
  data: string;
}

export interface InstallCompleteMessage extends BaseMessage {
  type: 'installComplete';
  success: boolean;
  error?: string;
}

export interface TerminalOpenedMessage extends BaseMessage {
  type: 'terminalOpened';
  data: string;
}

// Union type for all messages from extension
export type ExtensionToWebviewMessage =
  | ReadyMessage
  | StreamingMessageUpdate
  | ToolResultMessage
  | PermissionRequestMessage
  | ShowRestoreOptionMessage
  | ConversationListMessage
  | MCPServersMessage
  | CustomSnippetsMessage
  | PermissionsListMessage
  | WorkspaceFilesMessage
  | SettingsMessage
  | PlatformInfoMessage
  | ErrorMessage
  | ClipboardTextMessage
  | InstallCompleteMessage
  | TerminalOpenedMessage;

// =============================================================================
// Data Types
// =============================================================================

export interface CommitInfo {
  id: string;
  sha: string;
  message: string;
  timestamp: string;
}

export interface ConversationListItem {
  filename: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  messageCount: number;
  totalCost: number;
  firstUserMessage: string;
  lastUserMessage: string;
  source: 'internal' | 'cli';
  cliPath?: string;
}

export interface MCPServerConfig {
  type: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface CustomSnippet {
  id: string;
  name: string;
  content: string;
  category?: string;
}

export interface PermissionsData {
  alwaysAllow: Record<string, boolean | string[]>;
}

export interface WorkspaceFile {
  path: string;
  name: string;
  relativePath: string;
}

export interface ConversationMessage {
  timestamp: string;
  messageType: string;
  data: unknown;
}

export interface ConversationData {
  startTime: string;
  messages: ConversationMessage[];
}

// =============================================================================
// Type Guards
// =============================================================================

export function isValidWebviewMessage(msg: unknown): msg is WebviewToExtensionMessage {
  return typeof msg === 'object' && msg !== null && 'type' in msg && typeof (msg as BaseMessage).type === 'string';
}

export function isSendMessageRequest(msg: WebviewToExtensionMessage): msg is SendMessageRequest {
  return msg.type === 'sendMessage';
}

export function isPermissionResponse(msg: WebviewToExtensionMessage): msg is PermissionResponseMessage {
  return msg.type === 'permissionResponse';
}
