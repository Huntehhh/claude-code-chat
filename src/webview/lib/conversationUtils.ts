/**
 * Conversation utility functions for formatting and filtering conversation data
 * Separates business logic from React components
 */

import { Conversation } from '../stores/chatStore';

export interface HistoryConversation {
  id: string;
  title: string;
  source: 'cli' | 'chat';
  timestamp: string;
  messageCount: number;
  preview: string;
  checkpoints?: any[];
}

/**
 * Format conversations for history panel display
 */
export function formatConversationsForHistory(conversations: Conversation[]): HistoryConversation[] {
  return conversations.map(c => ({
    id: c.sessionId,
    title: c.chatName || c.name || c.firstUserMessage || 'Untitled',
    source: c.source === 'cli' ? ('cli' as const) : ('chat' as const),
    timestamp: c.startTime || c.lastModified || new Date().toISOString(),
    messageCount: c.messageCount || 0,
    preview: c.lastUserMessage || c.preview || '',
    checkpoints: c.checkpoints
  }));
}

/**
 * Find conversation by ID and optional source filter
 */
export function findConversationById(
  conversations: Conversation[],
  id: string,
  source?: 'cli' | 'chat'
): Conversation | undefined {
  // First try exact match with source filter
  const exactMatch = conversations.find(c =>
    c.sessionId === id &&
    (source ? (source === 'cli' ? c.source === 'cli' : c.source === 'internal') : true)
  );

  // Fallback to ID-only match if no source filter
  return exactMatch || conversations.find(c => c.sessionId === id);
}

/**
 * Sort conversations by timestamp (newest first)
 */
export function sortConversationsByDate(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => {
    const timeA = new Date(a.startTime || a.lastModified || 0).getTime();
    const timeB = new Date(b.startTime || b.lastModified || 0).getTime();
    return timeB - timeA; // Newest first
  });
}

/**
 * Filter conversations by source
 */
export function filterConversationsBySource(
  conversations: Conversation[],
  source: 'cli' | 'chat'
): Conversation[] {
  return conversations.filter(c =>
    source === 'cli' ? c.source === 'cli' : c.source === 'internal'
  );
}

/**
 * Search conversations by title or preview text
 */
export function searchConversations(
  conversations: Conversation[],
  searchTerm: string
): Conversation[] {
  const lowerTerm = searchTerm.toLowerCase();
  return conversations.filter(c => {
    const title = (c.chatName || c.name || '').toLowerCase();
    const preview = (c.preview || c.lastUserMessage || '').toLowerCase();
    return title.includes(lowerTerm) || preview.includes(lowerTerm);
  });
}

/**
 * Get conversation statistics
 */
export function getConversationStats(conversations: Conversation[]): {
  total: number;
  bySource: { cli: number; chat: number };
  totalMessages: number;
  averageMessagesPerConversation: number;
} {
  const cliCount = conversations.filter(c => c.source === 'cli').length;
  const chatCount = conversations.filter(c => c.source === 'internal').length;
  const totalMessages = conversations.reduce((sum, c) => sum + (c.messageCount || 0), 0);

  return {
    total: conversations.length,
    bySource: {
      cli: cliCount,
      chat: chatCount
    },
    totalMessages,
    averageMessagesPerConversation: conversations.length > 0
      ? totalMessages / conversations.length
      : 0
  };
}

/**
 * Format timestamp for display
 */
export function formatConversationTime(timestamp: string | undefined): string {
  if (!timestamp) return 'Unknown';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Show date for older conversations
  return date.toLocaleDateString();
}

/**
 * Truncate conversation title to fit UI
 */
export function truncateTitle(title: string, maxLength: number = 50): string {
  return title.length > maxLength
    ? title.substring(0, maxLength) + '...'
    : title;
}

/**
 * Get conversation display title with fallback
 */
export function getConversationTitle(conversation: Conversation): string {
  return conversation.chatName ||
    conversation.name ||
    conversation.firstUserMessage ||
    'Untitled Conversation';
}

/**
 * Check if conversation is recent (created within last 24 hours)
 */
export function isRecentConversation(conversation: Conversation): boolean {
  const timestamp = conversation.startTime || conversation.lastModified;
  if (!timestamp) return false;

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  return diffMs < oneDayMs;
}

/**
 * Group conversations by date
 */
export function groupConversationsByDate(
  conversations: Conversation[]
): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Older': []
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  conversations.forEach(conv => {
    const timestamp = conv.startTime || conv.lastModified;
    if (!timestamp) {
      groups['Older'].push(conv);
      return;
    }

    const date = new Date(timestamp);
    if (date >= todayStart) {
      groups['Today'].push(conv);
    } else if (date >= yesterdayStart) {
      groups['Yesterday'].push(conv);
    } else if (date >= weekStart) {
      groups['This Week'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}
