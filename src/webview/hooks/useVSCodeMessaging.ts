import { useEffect, useCallback } from 'react';
import { useChatStore, type PermissionRequest, type TodoItem } from '../stores/chatStore';
import { useSettingsStore, type McpServer } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { vscode } from '../lib/vscode';
import type {
  ExtensionToWebviewMessage,
  CommitInfo,
  ConversationListItem,
  MCPServerConfig,
  CustomSnippet,
  WorkspaceFile,
} from '../../types/messages';

// =============================================================================
// Helper: Convert raw backend message to Message type
// =============================================================================

import type { Message } from '../stores/chatStore';

function convertRawToMessage(raw: { type: string; data: any }): Message | null {
  const timestamp = Date.now();
  switch (raw.type) {
    case 'userInput':
      return { type: 'user', content: raw.data, timestamp };
    case 'output':
      return { type: 'claude', content: raw.data, timestamp };
    case 'toolUse': {
      const d = raw.data;
      return {
        type: 'tool-use',
        content: d.toolInfo || '',
        toolName: d.toolName,
        toolInput: d.rawInput,
        rawInput: d.rawInput,
        filePath: d.filePath,
        toolUseId: d.toolUseId,
        timestamp,
      };
    }
    case 'toolResult': {
      const d = raw.data;
      return {
        type: 'tool-result',
        content: d.result || d.content || '',
        toolName: d.toolName,
        isError: d.isError,
        toolUseId: d.toolUseId,
        timestamp,
      };
    }
    case 'system':
      return { type: 'system', content: raw.data, timestamp };
    default:
      return null;
  }
}

// =============================================================================
// Message Handler Hook
// =============================================================================

export function useVSCodeMessaging() {
  // Chat store actions
  const {
    addMessage,
    updateLastMessage,
    setProcessing,
    updateTokens,
    clearMessages,
    setChatName,
    setSessionId,
    setTotalCost,
    setRequestCount,
    setSubscriptionType,
    addPendingPermission,
    updatePermissionStatus,
    clearPendingPermissions,
    setConversations,
    setWorkspaceFiles,
    setCommits,
    addCommit,
    setTodos,
    setDraftMessage,
    setScrollPosition,
    setClipboardText,
  } = useChatStore();

  // Settings store actions
  const {
    updateSettings,
    setModel,
    setPlatformInfo,
    setPermissions,
    setMcpServers,
    setCustomSnippets,
  } = useSettingsStore();

  // UI store actions
  const {
    openModal,
    closeModal,
    showThinkingOverlay,
    hideThinkingOverlay,
    showToast,
  } = useUIStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data as ExtensionToWebviewMessage | { type: string; data?: unknown };

      switch (msg.type) {
        // =================================================================
        // Initialization & Session
        // =================================================================
        case 'ready': {
          const data = msg.data as {
            chatName?: string;
            draftMessage: string;
            scrollPosition: number;
            selectedModel: string;
            currentSessionId?: string;
            totalCost: number;
            totalTokensInput: number;
            totalTokensOutput: number;
            requestCount: number;
            subscriptionType?: string;
          };
          setChatName(data.chatName || 'Claude Code Chat');
          setDraftMessage(data.draftMessage || '');
          setScrollPosition(data.scrollPosition || 0);
          if (data.selectedModel) {
            setModel(data.selectedModel);
          }
          if (data.currentSessionId) {
            setSessionId(data.currentSessionId);
          }
          setTotalCost(data.totalCost || 0);
          updateTokens(data.totalTokensInput || 0, data.totalTokensOutput || 0);
          setRequestCount(data.requestCount || 0);
          if (data.subscriptionType) {
            setSubscriptionType(data.subscriptionType);
          }
          break;
        }

        case 'sessionInfo': {
          const data = msg.data as { sessionId: string; tools?: string[] };
          setSessionId(data.sessionId);
          break;
        }

        case 'sessionCleared': {
          // Only clear messages, don't reset chat name
          // The backend will send chatNameUpdated with the correct name
          clearMessages();
          break;
        }

        case 'newSession': {
          clearMessages();
          setChatName('Claude Code Chat'); // Only reset chat name on NEW session
          break;
        }

        case 'chatRenamed': {
          const newName = msg.data as string;
          setChatName(newName || 'Claude Code Chat');
          break;
        }

        // =================================================================
        // Processing State
        // =================================================================
        case 'setProcessing': {
          const data = msg.data as { isProcessing: boolean };
          setProcessing(data.isProcessing);
          if (!data.isProcessing) {
            hideThinkingOverlay();
          }
          break;
        }

        case 'loading': {
          const data = msg.data as { loading: boolean; message?: string };
          if (data.loading) {
            showThinkingOverlay();
          } else {
            hideThinkingOverlay();
          }
          break;
        }

        case 'compacting': {
          const data = msg.data as { compacting: boolean };
          if (data.compacting) {
            showThinkingOverlay();
          } else {
            hideThinkingOverlay();
          }
          break;
        }

        // =================================================================
        // Messages
        // =================================================================
        case 'userInput': {
          const content = typeof msg.data === 'string' ? msg.data : (msg.data as { content: string }).content;
          addMessage({ type: 'user', content, timestamp: Date.now() });
          break;
        }

        case 'output': {
          const content = typeof msg.data === 'string' ? msg.data : (msg.data as { content: string }).content;
          addMessage({ type: 'claude', content, timestamp: Date.now() });
          break;
        }

        case 'thinking': {
          const content = typeof msg.data === 'string' ? msg.data : (msg.data as { content: string }).content;
          addMessage({ type: 'thinking', content, timestamp: Date.now() });
          break;
        }

        case 'error': {
          const content = typeof msg.data === 'string' ? msg.data : String(msg.data);
          addMessage({ type: 'error', content, timestamp: Date.now() });
          break;
        }

        case 'systemMessage':
        case 'system': {
          const content = typeof msg.data === 'string' ? msg.data : (msg.data as { content: string }).content;
          addMessage({ type: 'system', content, timestamp: Date.now() });
          break;
        }

        // =================================================================
        // Streaming
        // =================================================================
        case 'streamingMessage': {
          const data = msg.data as {
            content: string;
            toolName?: string;
            toolInput?: string;
            rawInput?: Record<string, unknown>;
          };
          // For streaming, we update the last message or add a new one
          updateLastMessage(data.content);
          break;
        }

        // =================================================================
        // Tool Use & Results
        // =================================================================
        case 'toolUse': {
          const data = msg.data as {
            toolName: string;
            toolInfo: string;
            rawInput?: Record<string, unknown>;
            filePath?: string;
            fileContentBefore?: string; // Backend sends fileContentBefore, not oldContent
            toolUseId?: string;
          };
          addMessage({
            type: 'tool-use',
            content: data.toolInfo,
            toolName: data.toolName,
            toolInput: data.rawInput,
            rawInput: data.rawInput, // Also store as rawInput for fallback
            filePath: data.filePath || (data.rawInput?.file_path as string),
            oldContent: data.fileContentBefore, // Map backend name to frontend name
            toolUseId: data.toolUseId,
            timestamp: Date.now(),
          });
          break;
        }

        case 'toolResult': {
          const data = msg.data as {
            toolName: string;
            result: string;
            content?: string; // Backend may send 'content' instead of 'result'
            isError?: boolean;
            fileContentAfter?: string; // For Edit/Write tools
            hidden?: boolean;
            toolUseId?: string;
          };
          // Skip hidden results (Read tool success, TodoWrite success)
          if (data.hidden) break;
          addMessage({
            type: 'tool-result',
            content: data.content || data.result || '',
            toolName: data.toolName,
            isError: data.isError,
            newContent: data.fileContentAfter, // Map backend name to frontend name
            toolUseId: data.toolUseId,
            timestamp: Date.now(),
          });
          break;
        }

        // =================================================================
        // Permissions
        // =================================================================
        case 'permissionRequest': {
          const data = msg.data as {
            id: string;
            tool: string;
            input: Record<string, unknown>;
            suggestions?: string[];
            decisionReason?: string;
          };
          const permission: PermissionRequest = {
            id: data.id,
            tool: data.tool,
            input: data.input,
            suggestions: data.suggestions,
            decisionReason: data.decisionReason,
            status: 'pending',
          };
          addPendingPermission(permission);
          // Also add as a message for display
          addMessage({
            type: 'permission',
            content: JSON.stringify(data.input),
            permissionId: data.id,
            toolName: data.tool,
            permissionSuggestions: data.suggestions,
            decisionReason: data.decisionReason,
            timestamp: Date.now(),
          });
          break;
        }

        case 'updatePermissionStatus': {
          const data = msg.data as { id: string; status: 'approved' | 'denied' };
          updatePermissionStatus(data.id, data.status);
          break;
        }

        case 'permissionsList':
        case 'permissionsData': {
          const data = msg.data as { alwaysAllow: Record<string, boolean | string[]> };
          setPermissions(data.alwaysAllow);
          break;
        }

        // =================================================================
        // Tokens & Cost
        // =================================================================
        case 'updateTokens': {
          const data = msg.data as {
            currentInputTokens?: number;
            currentOutputTokens?: number;
          };
          updateTokens(data.currentInputTokens || 0, data.currentOutputTokens || 0);
          break;
        }

        case 'updateTotals': {
          const data = msg.data as {
            totalCost?: number;
            requestCount?: number;
          };
          if (data.totalCost !== undefined) {
            setTotalCost(data.totalCost);
          }
          if (data.requestCount !== undefined) {
            setRequestCount(data.requestCount);
          }
          break;
        }

        // =================================================================
        // Conversations & History
        // =================================================================
        case 'conversationList': {
          const data = msg.data as ConversationListItem[];
          setConversations(data.map((c) => ({
            ...c,
            // Map fields for convenience
            id: c.sessionId,
            name: c.chatName || c.firstUserMessage, // Prefer custom name over first message
            lastModified: c.startTime,
            preview: c.lastUserMessage || '',
          })));
          break;
        }

        case 'conversationHistory': {
          const data = msg.data as { messages: Array<{ type: string; data: unknown }> };
          // Clear and replay messages
          clearMessages();
          data.messages.forEach((m) => {
            // Convert old message format to new
            if (m.type === 'userInput') {
              addMessage({ type: 'user', content: String(m.data), timestamp: Date.now() });
            } else if (m.type === 'output') {
              addMessage({ type: 'claude', content: String(m.data), timestamp: Date.now() });
            }
            // ... handle other types as needed
          });
          break;
        }

        // =================================================================
        // Checkpoints
        // =================================================================
        case 'showRestoreOption': {
          const data = msg.data as CommitInfo;
          addCommit(data);
          break;
        }

        case 'checkpointsList':
        case 'checkpoints': {
          const data = msg.data as CommitInfo[];
          setCommits(data);
          break;
        }

        // =================================================================
        // Workspace Files
        // =================================================================
        case 'workspaceFiles': {
          const data = msg.data as WorkspaceFile[];
          setWorkspaceFiles(data);
          break;
        }

        // =================================================================
        // Settings & Configuration
        // =================================================================
        case 'settings':
        case 'settingsData': {
          const data = msg.data as Record<string, unknown>;
          updateSettings(data);
          break;
        }

        case 'settingUpdated': {
          // Backend confirms a setting has been persisted to disk
          const data = msg.data as { key: string; value: unknown };
          console.log(`[Settings] Confirmed persisted: ${data.key} = ${data.value}`);
          // Update with confirmed values from backend
          // Map backend config keys back to frontend keys for proper store updates
          const configToFrontendKey: Record<string, string> = {
            'thinking.intensity': 'thinkingIntensity',
            'wsl.enabled': 'wslEnabled',
            'wsl.distro': 'wslDistribution',
            'wsl.nodePath': 'nodePath',
            'wsl.claudePath': 'claudePath',
            'permissions.yoloMode': 'yoloMode',
            'compact.toolOutput': 'compactToolOutput',
            'compact.mcpCalls': 'compactMcpCalls',
            'compact.previewHeight': 'previewHeight',
            'display.showTodoList': 'showTodoList',
          };
          const frontendKey = configToFrontendKey[data.key] || data.key;
          updateSettings({ [frontendKey]: data.value });
          break;
        }

        case 'platformInfo': {
          const data = msg.data as {
            platform: string;
            isWindows: boolean;
            wslAlertDismissed: boolean;
            wslEnabled: boolean;
          };
          setPlatformInfo(data);
          break;
        }

        case 'accountInfo': {
          const data = msg.data as { subscriptionType?: string };
          if (data.subscriptionType) {
            setSubscriptionType(data.subscriptionType);
          }
          break;
        }

        // =================================================================
        // MCP Servers
        // =================================================================
        case 'mcpServers': {
          const data = msg.data as Record<string, MCPServerConfig>;
          const servers: McpServer[] = Object.entries(data).map(([name, config]) => ({
            id: name,
            name,
            type: config.type,
            enabled: true,
            command: config.command,
            args: config.args,
            url: config.url,
            env: config.env,
          }));
          setMcpServers(servers);
          break;
        }

        // =================================================================
        // Custom Snippets
        // =================================================================
        case 'customSnippets':
        case 'customSnippetsData': {
          const data = msg.data as CustomSnippet[];
          setCustomSnippets(data);
          break;
        }

        // =================================================================
        // Todos
        // =================================================================
        case 'todosUpdated': {
          const data = msg.data as TodoItem[];
          setTodos(data);
          break;
        }

        // =================================================================
        // Clipboard
        // =================================================================
        case 'clipboardText': {
          const data = msg.data as string;
          setClipboardText(data);
          break;
        }

        // =================================================================
        // Installation
        // =================================================================
        case 'installComplete': {
          const data = msg as { success: boolean; error?: string };
          if (data.success) {
            closeModal();
          } else if (data.error) {
            addMessage({ type: 'error', content: `Installation failed: ${data.error}`, timestamp: Date.now() });
          }
          break;
        }

        case 'terminalOpened': {
          // Terminal was opened - could show notification
          break;
        }

        // =================================================================
        // Model Selection
        // =================================================================
        case 'modelSelected': {
          const data = msg.data as { model: string } | undefined;
          if (data?.model) {
            setModel(data.model);
          }
          break;
        }

        // =================================================================
        // Draft Message
        // =================================================================
        case 'restoreInputText': {
          const data = msg.data as string;
          setDraftMessage(data);
          break;
        }

        // =================================================================
        // Additional Backend Messages
        // =================================================================
        case 'clearLoading': {
          setProcessing(false);
          hideThinkingOverlay();
          break;
        }

        // =================================================================
        // Pagination / Infinite Scroll
        // =================================================================
        case 'hasMoreMessages': {
          const data = msg.data as { remaining: number };
          console.log(`[Pagination] ${data.remaining} more messages available`);
          useChatStore.getState().setHasMoreMessages(true);
          break;
        }

        case 'noMoreMessages': {
          console.log('[Pagination] No more messages');
          useChatStore.getState().setHasMoreMessages(false);
          useChatStore.getState().setIsLoadingMore(false);
          break;
        }

        case 'prependMessages': {
          const rawMessages = msg.data as Array<{ type: string; data: any }>;
          console.log(`[Pagination] Prepending ${rawMessages.length} older messages`);
          // Convert raw messages to Message format and prepend
          const messages: Message[] = [];
          for (const raw of rawMessages) {
            const converted = convertRawToMessage(raw);
            if (converted) messages.push(converted);
          }
          useChatStore.getState().prependMessages(messages);
          break;
        }

        case 'showInstallModal': {
          openModal('install');
          break;
        }

        case 'toast': {
          const data = msg.data as { message: string; duration?: number };
          showToast(data.message, data.duration);
          break;
        }

        case 'loginRequired': {
          // TODO: Show login required UI
          console.log('[VSCode Messaging] Login required');
          break;
        }

        case 'mcpServerError': {
          const data = msg.data as { error: string };
          console.error('[MCP Server Error]', data.error);
          break;
        }

        case 'mcpServerSaved':
        case 'mcpServerDeleted': {
          // Refresh MCP servers list after save/delete
          // The list is typically refreshed automatically
          break;
        }

        case 'customSnippetSaved':
        case 'customSnippetDeleted': {
          // Refresh snippets list after save/delete
          // The list is typically refreshed automatically
          break;
        }

        case 'scrollToBottom': {
          // This can be handled by the MessageList component via a ref
          // For now, just log it
          break;
        }

        case 'restoreScrollPosition': {
          // Set scroll position from backend (persisted across sessions)
          const position = msg.data as number;
          setScrollPosition(position || 0);
          break;
        }

        case 'expirePendingPermissions': {
          clearPendingPermissions();
          break;
        }

        case 'sessionResumed': {
          const data = msg.data as { sessionId: string };
          setSessionId(data.sessionId);
          break;
        }

        case 'restoreError':
        case 'restoreProgress': {
          // TODO: Handle restore progress/error UI
          console.log('[Restore]', msg.type, msg.data);
          break;
        }

        case 'imagePath': {
          // TODO: Handle image path response
          console.log('[Image Path]', msg.data);
          break;
        }

        case 'chatNameUpdated': {
          const data = msg.data as { name: string };
          console.log('[ChatName] Received chatNameUpdated:', data);
          if (data?.name) {
            console.log('[ChatName] Setting chat name to:', data.name);
            setChatName(data.name);
          }
          break;
        }

        default:
          // Unknown message type - log for debugging
          console.log('[VSCode Messaging] Unknown message type:', msg.type, msg);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    addMessage,
    updateLastMessage,
    setProcessing,
    updateTokens,
    clearMessages,
    setChatName,
    setSessionId,
    setTotalCost,
    setRequestCount,
    setSubscriptionType,
    addPendingPermission,
    updatePermissionStatus,
    clearPendingPermissions,
    setConversations,
    setWorkspaceFiles,
    setCommits,
    addCommit,
    setTodos,
    setDraftMessage,
    setScrollPosition,
    setClipboardText,
    updateSettings,
    setModel,
    setPlatformInfo,
    setPermissions,
    setMcpServers,
    setCustomSnippets,
    openModal,
    closeModal,
    showThinkingOverlay,
    hideThinkingOverlay,
    showToast,
  ]);
}

// =============================================================================
// Sender Functions Hook
// =============================================================================

export const useVSCodeSender = () => {
  // =========================================================================
  // Chat & Messages
  // =========================================================================

  const sendMessage = useCallback((text: string, planMode: boolean, thinkingMode: boolean, isImageMessage?: boolean) => {
    vscode.postMessage({ type: 'sendMessage', text, planMode, thinkingMode, isImageMessage });
  }, []);

  const stopProcess = useCallback(() => {
    vscode.postMessage({ type: 'stopRequest' });
  }, []);

  const newSession = useCallback(() => {
    vscode.postMessage({ type: 'newSession' });
  }, []);

  const copyCode = useCallback((code: string) => {
    vscode.postMessage({ type: 'copyCode', code });
  }, []);

  // =========================================================================
  // Permissions
  // =========================================================================

  const respondToPermission = useCallback((id: string, approved: boolean, alwaysAllow?: boolean) => {
    vscode.postMessage({ type: 'permissionResponse', id, approved, alwaysAllow });
  }, []);

  const getPermissions = useCallback(() => {
    vscode.postMessage({ type: 'getPermissions' });
  }, []);

  const addPermission = useCallback((toolName: string, command: string | null) => {
    vscode.postMessage({ type: 'addPermission', toolName, command });
  }, []);

  const removePermission = useCallback((toolName: string, command: string | null) => {
    vscode.postMessage({ type: 'removePermission', toolName, command });
  }, []);

  const enableYoloMode = useCallback(() => {
    vscode.postMessage({ type: 'enableYoloMode' });
  }, []);

  // =========================================================================
  // Conversations & History
  // =========================================================================

  const loadConversation = useCallback((filename: string, source?: 'internal' | 'cli', cliPath?: string) => {
    console.log('[loadConversation] Called with:', { filename, source, cliPath });
    console.log('[loadConversation] Stack trace:', new Error().stack);
    vscode.postMessage({ type: 'loadConversation', filename, source, cliPath });
  }, []);

  const requestConversations = useCallback(() => {
    vscode.postMessage({ type: 'getConversationList' });
  }, []);

  const loadMoreMessages = useCallback(() => {
    useChatStore.getState().setIsLoadingMore(true);
    vscode.postMessage({ type: 'loadMoreMessages' });
  }, []);

  const restoreToCommit = useCallback((sha: string) => {
    vscode.postMessage({ type: 'restoreCommit', commitSha: sha });
  }, []);

  // =========================================================================
  // Files & Workspace
  // =========================================================================

  const requestWorkspaceFiles = useCallback((searchTerm?: string) => {
    vscode.postMessage({ type: 'getWorkspaceFiles', searchTerm });
  }, []);

  const selectImageFile = useCallback(() => {
    vscode.postMessage({ type: 'selectImageFile' });
  }, []);

  const openFile = useCallback((filePath: string) => {
    vscode.postMessage({ type: 'openFile', filePath });
  }, []);

  const openDiff = useCallback((oldContent: string, newContent: string, filePath: string) => {
    vscode.postMessage({ type: 'openDiff', oldContent, newContent, filePath });
  }, []);

  const openDiffByIndex = useCallback((messageIndex: number) => {
    vscode.postMessage({ type: 'openDiffByIndex', messageIndex });
  }, []);

  const createImage = useCallback((imageData: string, imageType: string) => {
    vscode.postMessage({ type: 'createImageFile', imageData, imageType });
  }, []);

  // =========================================================================
  // Settings
  // =========================================================================

  const updateSettings = useCallback((settings: Record<string, unknown>) => {
    vscode.postMessage({ type: 'updateSettings', settings });
  }, []);

  const getSettings = useCallback(() => {
    vscode.postMessage({ type: 'getSettings' });
  }, []);

  const dismissWSLAlert = useCallback(() => {
    vscode.postMessage({ type: 'dismissWSLAlert' });
  }, []);

  // =========================================================================
  // Model Selection
  // =========================================================================

  const selectModel = useCallback((model: string) => {
    vscode.postMessage({ type: 'selectModel', model });
  }, []);

  const openModelTerminal = useCallback(() => {
    vscode.postMessage({ type: 'openModelTerminal' });
  }, []);

  // =========================================================================
  // Usage & Billing
  // =========================================================================

  const viewUsage = useCallback((usageType?: 'plan' | 'api') => {
    vscode.postMessage({ type: 'viewUsage', usageType });
  }, []);

  // =========================================================================
  // MCP Servers
  // =========================================================================

  const loadMCPServers = useCallback(() => {
    vscode.postMessage({ type: 'loadMCPServers' });
  }, []);

  const saveMCPServer = useCallback((name: string, config: MCPServerConfig) => {
    vscode.postMessage({ type: 'saveMCPServer', name, config });
  }, []);

  const deleteMCPServer = useCallback((name: string) => {
    vscode.postMessage({ type: 'deleteMCPServer', name });
  }, []);

  // =========================================================================
  // Custom Snippets
  // =========================================================================

  const getCustomSnippets = useCallback(() => {
    vscode.postMessage({ type: 'getCustomSnippets' });
  }, []);

  const saveCustomSnippet = useCallback((snippet: CustomSnippet) => {
    vscode.postMessage({ type: 'saveCustomSnippet', snippet });
  }, []);

  const deleteCustomSnippet = useCallback((snippetId: string) => {
    vscode.postMessage({ type: 'deleteCustomSnippet', snippetId });
  }, []);

  // =========================================================================
  // Slash Commands
  // =========================================================================

  const executeSlashCommand = useCallback((command: string) => {
    vscode.postMessage({ type: 'executeSlashCommand', command });
  }, []);

  // =========================================================================
  // Chat Management
  // =========================================================================

  const renameChat = useCallback((name: string) => {
    vscode.postMessage({ type: 'renameChat', name });
  }, []);

  const saveInputText = useCallback((text: string) => {
    vscode.postMessage({ type: 'saveInputText', text });
  }, []);

  const saveScrollPosition = useCallback((position: number) => {
    vscode.postMessage({ type: 'saveScrollPosition', position });
  }, []);

  // =========================================================================
  // Clipboard
  // =========================================================================

  const getClipboardText = useCallback(() => {
    vscode.postMessage({ type: 'getClipboardText' });
  }, []);

  // =========================================================================
  // Installation
  // =========================================================================

  const runInstall = useCallback(() => {
    vscode.postMessage({ type: 'runInstallCommand' });
  }, []);

  // =========================================================================
  // Ready Signal
  // =========================================================================

  const requestReady = useCallback(() => {
    vscode.postMessage({ type: 'ready' });
  }, []);

  // =========================================================================
  // Return all senders
  // =========================================================================

  return {
    // Chat & Messages
    sendMessage,
    stopProcess,
    newSession,
    copyCode,

    // Permissions
    respondToPermission,
    getPermissions,
    addPermission,
    removePermission,
    enableYoloMode,

    // Conversations & History
    loadConversation,
    requestConversations,
    loadMoreMessages,
    restoreToCommit,

    // Files & Workspace
    requestWorkspaceFiles,
    selectImageFile,
    openFile,
    openDiff,
    openDiffByIndex,
    createImage,

    // Settings
    updateSettings,
    getSettings,
    dismissWSLAlert,

    // Model Selection
    selectModel,
    openModelTerminal,

    // Usage & Billing
    viewUsage,

    // MCP Servers
    loadMCPServers,
    saveMCPServer,
    deleteMCPServer,

    // Custom Snippets
    getCustomSnippets,
    saveCustomSnippet,
    deleteCustomSnippet,

    // Slash Commands
    executeSlashCommand,

    // Chat Management
    renameChat,
    saveInputText,
    saveScrollPosition,

    // Clipboard
    getClipboardText,

    // Installation
    runInstall,

    // Ready Signal
    requestReady,
  };
};
