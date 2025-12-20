/**
 * Message utility functions for formatting and transforming message data
 * Separates business logic from React components
 */

import { ConversationMessage } from '../stores/chatStore';

export function formatMessageTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function truncateMessage(content: string, maxLength: number = 500): string {
  return content.length > maxLength
    ? content.substring(0, maxLength) + '...'
    : content;
}

export interface FormattedMessage extends ConversationMessage {
  formattedTime: string;
  displayContent: string;
  isTruncated: boolean;
}

/**
 * Format a single message with computed properties
 */
export function formatMessage(message: ConversationMessage): FormattedMessage {
  return {
    ...message,
    formattedTime: formatMessageTime(message.timestamp),
    displayContent: truncateMessage(message.content),
    isTruncated: message.content.length > 500
  };
}

/**
 * Merge tool-use and tool-result messages into unified display objects
 * Tool results are associated with their tool-use messages
 */
export function mergeToolMessages(messages: ConversationMessage[]): ConversationMessage[] {
  const merged: ConversationMessage[] = [];
  const toolUseMap = new Map<string, ConversationMessage>();

  messages.forEach(msg => {
    if (msg.type === 'tool-use' && msg.toolUseId) {
      toolUseMap.set(msg.toolUseId, msg);
      merged.push(msg);
    } else if (msg.type === 'tool-result' && msg.toolUseId) {
      const toolUse = toolUseMap.get(msg.toolUseId);
      if (toolUse) {
        // Associate result with tool-use message
        (toolUse as any).toolResult = msg.content;
      } else {
        // If no matching tool-use, include result separately
        merged.push(msg);
      }
    } else {
      merged.push(msg);
    }
  });

  return merged;
}

/**
 * Extract text content from various message types
 */
export function getMessageText(message: ConversationMessage): string {
  switch (message.type) {
    case 'user':
      return message.content || '';
    case 'assistant':
      return message.content || '';
    case 'thinking':
      return message.thinking || '';
    case 'tool-use':
      return message.toolName || '';
    case 'tool-result':
      return message.content || '';
    default:
      return '';
  }
}

/**
 * Get displayable title for message type
 */
export function getMessageTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'user': 'You',
    'assistant': 'Claude',
    'thinking': 'Thinking',
    'tool-use': 'Tool Use',
    'tool-result': 'Tool Result',
    'output': 'Output'
  };
  return labels[type] || type;
}

/**
 * Check if message should be displayed with special formatting
 */
export function isSpecialFormatMessage(type: string): boolean {
  return ['thinking', 'tool-use', 'tool-result', 'output'].includes(type);
}

/**
 * Filter messages by type
 */
export function filterMessagesByType(messages: ConversationMessage[], type: string): ConversationMessage[] {
  return messages.filter(msg => msg.type === type);
}

/**
 * Get message statistics
 */
export function getMessageStats(messages: ConversationMessage[]): {
  total: number;
  byType: Record<string, number>;
  totalCharacters: number;
  averageLength: number;
} {
  const byType: Record<string, number> = {};
  let totalCharacters = 0;

  messages.forEach(msg => {
    byType[msg.type] = (byType[msg.type] || 0) + 1;
    const text = getMessageText(msg);
    totalCharacters += text.length;
  });

  return {
    total: messages.length,
    byType,
    totalCharacters,
    averageLength: messages.length > 0 ? totalCharacters / messages.length : 0
  };
}
