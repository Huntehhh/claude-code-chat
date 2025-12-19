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
    setConversations,
    setWorkspaceFiles,
    setCommits,
    addCommit,
    setTodos,
    setDraftMessage,
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

        case 'sessionCleared':
        case 'newSession': {
          clearMessages();
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

        case 'systemMessage': {
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
            oldContent?: string;
            newContent?: string;
          };
          addMessage({
            type: 'tool-use',
            content: data.toolInfo,
            toolName: data.toolName,
            toolInput: data.rawInput,
            filePath: data.filePath,
            oldContent: data.oldContent,
            newContent: data.newContent,
            timestamp: Date.now(),
          });
          break;
        }

        case 'toolResult': {
          const data = msg.data as {
            toolName: string;
            result: string;
            isError?: boolean;
          };
          addMessage({
            type: 'tool-result',
            content: data.result,
            toolName: data.toolName,
            isError: data.isError,
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

        case 'permissionsList': {
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
            messageCount: 0,
            preview: '',
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

        case 'checkpointsList': {
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
        case 'customSnippets': {
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
          const data = msg.data as { model: string };
          setModel(data.model);
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
    setConversations,
    setWorkspaceFiles,
    setCommits,
    addCommit,
    setTodos,
    setDraftMessage,
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

  const loadConversation = useCallback((filename: string, source?: 'local' | 'claude', fullPath?: string) => {
    vscode.postMessage({ type: 'loadConversation', filename, source, fullPath });
  }, []);

  const requestConversations = useCallback(() => {
    vscode.postMessage({ type: 'requestConversations' });
  }, []);

  const restoreToCommit = useCallback((sha: string) => {
    vscode.postMessage({ type: 'restoreToCommit', sha });
  }, []);

  // =========================================================================
  // Files & Workspace
  // =========================================================================

  const requestWorkspaceFiles = useCallback((searchTerm?: string) => {
    vscode.postMessage({ type: 'requestWorkspaceFiles', searchTerm });
  }, []);

  const selectImageFile = useCallback(() => {
    vscode.postMessage({ type: 'selectImageFile' });
  }, []);

  const openFile = useCallback((filePath: string) => {
    vscode.postMessage({ type: 'openFileInEditor', filePath });
  }, []);

  const openDiff = useCallback((oldContent: string, newContent: string, filePath: string) => {
    vscode.postMessage({ type: 'openDiff', oldContent, newContent, filePath });
  }, []);

  const openDiffByIndex = useCallback((messageIndex: number) => {
    vscode.postMessage({ type: 'openDiffByIndex', messageIndex });
  }, []);

  const createImage = useCallback((imageData: string, imageType: string) => {
    vscode.postMessage({ type: 'createImage', imageData, imageType });
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
    vscode.postMessage({ type: 'setSelectedModel', model });
  }, []);

  const openModelTerminal = useCallback(() => {
    vscode.postMessage({ type: 'openModelTerminal' });
  }, []);

  // =========================================================================
  // Usage & Billing
  // =========================================================================

  const viewUsage = useCallback((usageType: 'plan' | 'api') => {
    vscode.postMessage({ type: 'openUsageTerminal', usageType });
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
    vscode.postMessage({ type: 'runInstall' });
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

    // Clipboard
    getClipboardText,

    // Installation
    runInstall,

    // Ready Signal
    requestReady,
  };
};
