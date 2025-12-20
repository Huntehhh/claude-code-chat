import { create } from 'zustand';
import type {
  CommitInfo,
  ConversationListItem,
  WorkspaceFile,
} from '../../types/messages';

// =============================================================================
// Message Types
// =============================================================================

export interface Message {
  type: 'user' | 'claude' | 'tool-use' | 'tool-result' | 'permission' | 'error' | 'thinking' | 'system';
  content: string;
  timestamp: number;
  toolName?: string;
  permissionId?: string;
  isError?: boolean;
  // Tool use additional data
  toolInput?: Record<string, unknown>;
  rawInput?: Record<string, unknown>;
  toolUseId?: string; // For matching tool-use with tool-result
  // For permission requests
  permissionSuggestions?: string[];
  decisionReason?: string;
  // For file operations
  filePath?: string;
  oldContent?: string;
  newContent?: string;
}

export interface PermissionRequest {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  suggestions?: string[];
  decisionReason?: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface TodoItem {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm?: string;
}

// Extended conversation with checkpoints
export interface Conversation extends ConversationListItem {
  // These come from the base ConversationListItem
  // messageCount is already in base
  preview?: string;
  checkpoints?: CommitInfo[];
  // Convenience getters
  id?: string;  // Maps to sessionId
  name?: string;  // Maps to firstUserMessage
  lastModified?: string;  // Maps to startTime
}

// =============================================================================
// Store Interface
// =============================================================================

interface ChatState {
  // Messages
  messages: Message[];
  isProcessing: boolean;
  sessionId: string | null;
  chatName: string;

  // Tokens & Cost
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCost: number;
  requestCount: number;
  subscriptionType: string | null;

  // Permissions
  pendingPermissions: PermissionRequest[];

  // Conversations & History
  conversations: Conversation[];
  activeConversationId: string | null;

  // Workspace Files (for file picker)
  workspaceFiles: WorkspaceFile[];

  // Checkpoints/Commits
  commits: CommitInfo[];

  // Todos (from Claude)
  todos: TodoItem[];

  // Draft message (auto-saved input)
  draftMessage: string;

  // Scroll position (persisted across sessions)
  scrollPosition: number;

  // Clipboard text (from VSCode)
  clipboardText: string;

  // Pagination for infinite scroll
  hasMoreMessages: boolean;
  isLoadingMore: boolean;

  // =========================================================================
  // Actions
  // =========================================================================

  // Messages
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  setHasMoreMessages: (has: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setProcessing: (processing: boolean) => void;

  // Tokens & Cost
  updateTokens: (input: number, output: number) => void;
  setTotalCost: (cost: number) => void;
  setRequestCount: (count: number) => void;
  setSubscriptionType: (type: string | null) => void;

  // Session
  setChatName: (name: string) => void;
  setSessionId: (id: string | null) => void;

  // Permissions
  addPendingPermission: (permission: PermissionRequest) => void;
  updatePermissionStatus: (id: string, status: 'approved' | 'denied') => void;
  removePendingPermission: (id: string) => void;
  clearPendingPermissions: () => void;

  // Conversations
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: string | null) => void;

  // Workspace Files
  setWorkspaceFiles: (files: WorkspaceFile[]) => void;

  // Commits
  setCommits: (commits: CommitInfo[]) => void;
  addCommit: (commit: CommitInfo) => void;

  // Todos
  setTodos: (todos: TodoItem[]) => void;

  // Draft, Scroll & Clipboard
  setDraftMessage: (text: string) => void;
  setScrollPosition: (position: number) => void;
  setClipboardText: (text: string) => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  messages: [],
  isProcessing: false,
  sessionId: null,
  chatName: 'Claude Code Chat',
  totalTokensInput: 0,
  totalTokensOutput: 0,
  totalCost: 0,
  requestCount: 0,
  subscriptionType: null,
  pendingPermissions: [],
  conversations: [],
  activeConversationId: null,
  workspaceFiles: [],
  commits: [],
  todos: [],
  draftMessage: '',
  scrollPosition: 0,
  clipboardText: '',
  hasMoreMessages: false,
  isLoadingMore: false,

  // Message actions
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  prependMessages: (messages) => set((s) => ({ messages: [...messages, ...s.messages], isLoadingMore: false })),
  setHasMoreMessages: (has) => set({ hasMoreMessages: has }),
  setIsLoadingMore: (loading) => set({ isLoadingMore: loading }),

  updateLastMessage: (content) => set((s) => {
    const messages = [...s.messages];
    if (messages.length > 0) {
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content,
      };
    }
    return { messages };
  }),

  clearMessages: () => set({
    messages: [],
    totalTokensInput: 0,
    totalTokensOutput: 0,
    totalCost: 0,
    requestCount: 0,
    pendingPermissions: [],
    todos: [],
    scrollPosition: 0,
  }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  // Token & cost actions
  updateTokens: (input, output) =>
    set((s) => ({
      totalTokensInput: s.totalTokensInput + input,
      totalTokensOutput: s.totalTokensOutput + output,
    })),
  setTotalCost: (cost) => set({ totalCost: cost }),
  setRequestCount: (count) => set({ requestCount: count }),
  setSubscriptionType: (type) => set({ subscriptionType: type }),

  // Session actions
  setChatName: (name) => set({ chatName: name }),
  setSessionId: (id) => set({ sessionId: id }),

  // Permission actions
  addPendingPermission: (permission) => set((s) => ({
    pendingPermissions: [...s.pendingPermissions, permission],
  })),

  updatePermissionStatus: (id, status) => set((s) => ({
    pendingPermissions: s.pendingPermissions.map((p) =>
      p.id === id ? { ...p, status } : p
    ),
  })),

  removePendingPermission: (id) => set((s) => ({
    pendingPermissions: s.pendingPermissions.filter((p) => p.id !== id),
  })),

  clearPendingPermissions: () => set({ pendingPermissions: [] }),

  // Conversation actions
  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  // Workspace files actions
  setWorkspaceFiles: (files) => set({ workspaceFiles: files }),

  // Commits actions
  setCommits: (commits) => set({ commits }),
  addCommit: (commit) => set((s) => ({ commits: [commit, ...s.commits] })),

  // Todos actions
  setTodos: (todos) => set({ todos }),

  // Draft, scroll & clipboard actions
  setDraftMessage: (text) => set({ draftMessage: text }),
  setScrollPosition: (position) => set({ scrollPosition: position }),
  setClipboardText: (text) => set({ clipboardText: text }),
}));
