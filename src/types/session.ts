/**
 * Session and conversation type definitions
 * Single source of truth for session state management
 */

import * as vscode from 'vscode';
import type { ProcessConfig, PanelProcessInfo } from './process';
import type { ConversationMessage } from './messages';

// =============================================================================
// Conversation Data
// =============================================================================

/**
 * Complete conversation data structure for persistence
 */
export interface ConversationData {
  /** Session identifier */
  sessionId: string;
  /** When the conversation started */
  startTime: string;
  /** When the conversation ended (set on save) */
  endTime?: string;
  /** Display name for the chat */
  chatName?: string;
  /** All messages in the conversation */
  messages: ConversationMessage[];
  /** Total cost for this conversation */
  totalCost?: number;
  /** Total input tokens used */
  totalTokensInput?: number;
  /** Total output tokens used */
  totalTokensOutput?: number;
  /** Number of requests made */
  requestCount?: number;
  /** Model used for this conversation */
  selectedModel?: string;
}

/**
 * Index entry for conversation list
 */
export interface ConversationIndexEntry {
  /** Filename of the conversation JSON */
  filename: string;
  /** Session identifier */
  sessionId: string;
  /** When the conversation started */
  startTime: string;
  /** When the conversation ended */
  endTime: string;
  /** Number of messages */
  messageCount: number;
  /** Total cost */
  totalCost: number;
  /** First user message (for display) */
  firstUserMessage: string;
  /** Last user message (for display) */
  lastUserMessage: string;
  /** Source of conversation */
  source: 'internal' | 'cli';
  /** Full path for CLI conversations */
  cliPath?: string;
}

// =============================================================================
// Panel State
// =============================================================================

/**
 * State for a webview panel instance
 */
export interface PanelState {
  /** The webview panel instance */
  panel: vscode.WebviewPanel;
  /** Current session ID */
  sessionId: string;
  /** Current conversation data */
  conversation: ConversationMessage[];
  /** Conversation start time */
  conversationStartTime: string;
  /** Display name for the chat */
  chatName?: string;
  /** Whether the panel is currently processing */
  isProcessing: boolean;
  /** Draft message saved from input */
  draftMessage: string;
  /** Scroll position in the chat */
  scrollPosition: number;
  /** Selected model for this panel */
  selectedModel: string;
  /** Subscription type (e.g., 'pro') */
  subscriptionType?: string;
  /** Total cost for this panel's session */
  totalCost: number;
  /** Total input tokens */
  totalTokensInput: number;
  /** Total output tokens */
  totalTokensOutput: number;
  /** Number of requests made */
  requestCount: number;
  /** Pending permission requests */
  pendingPermissionRequests: Map<string, PendingPermission>;
  /** Current todos from Claude */
  currentTodos: TodoItem[];
}

/**
 * Pending permission request
 */
export interface PendingPermission {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  timestamp: number;
}

/**
 * Todo item from Claude
 */
export interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm?: string;
}

// =============================================================================
// Session Metadata
// =============================================================================

/**
 * Metadata about the current session
 */
export interface SessionMetadata {
  /** Unique session identifier */
  sessionId: string;
  /** When the session started */
  startTime: string;
  /** Model being used */
  model: string;
  /** Whether account info has been fetched */
  accountInfoFetched: boolean;
  /** Subscription type if known */
  subscriptionType?: string;
}

/**
 * Session info received from Claude CLI
 */
export interface CLISessionInfo {
  type: 'session';
  session_id: string;
  model?: string;
  api_key_source?: string;
  subscription_type?: string;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a value is valid ConversationData
 */
export function isValidConversationData(data: unknown): data is ConversationData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.sessionId === 'string' &&
    typeof d.startTime === 'string' &&
    Array.isArray(d.messages)
  );
}

/**
 * Check if a value is CLI session info
 */
export function isCLISessionInfo(data: unknown): data is CLISessionInfo {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return d.type === 'session' && typeof d.session_id === 'string';
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a new empty PanelState
 */
export function createEmptyPanelState(
  panel: vscode.WebviewPanel,
  defaultModel: string = 'claude-sonnet-4-20250514'
): PanelState {
  return {
    panel,
    sessionId: generateSessionId(),
    conversation: [],
    conversationStartTime: new Date().toISOString(),
    chatName: undefined,
    isProcessing: false,
    draftMessage: '',
    scrollPosition: 0,
    selectedModel: defaultModel,
    subscriptionType: undefined,
    totalCost: 0,
    totalTokensInput: 0,
    totalTokensOutput: 0,
    requestCount: 0,
    pendingPermissionRequests: new Map(),
    currentTodos: []
  };
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
