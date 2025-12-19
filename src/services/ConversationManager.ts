/**
 * ConversationManager - Handles conversation storage and retrieval
 *
 * Manages both internal JSON conversations and Claude CLI JSONL conversation loading.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ConversationMessage, ConversationData } from '../types/messages';

export interface ConversationStats {
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
}

export interface ConversationIndexEntry {
  filename: string;
  sessionId?: string;
  startTime: string;
  endTime?: string;
  messageCount: number;
  totalCost?: number;
  firstUserMessage: string;
  lastUserMessage?: string;
  source?: 'internal' | 'jsonl';
  path?: string;
}

export interface JSONLConversation {
  filename: string;
  path: string;
  sessionId: string;
  slug: string;
  startTime: string;
  messageCount: number;
  firstUserMessage: string;
  source: 'jsonl';
}

export interface ConversationManagerCallbacks {
  onConversationSaved: (filename: string) => void;
  onConversationLoaded: (messages: ConversationMessage[], sessionId?: string) => void;
  onError: (message: string) => void;
}

export class ConversationManager {
  private _conversationsPath: string | undefined;
  private _conversationIndex: ConversationIndexEntry[] = [];
  private _currentConversation: ConversationMessage[] = [];
  private _conversationStartTime: string | undefined;
  private _callbacks: ConversationManagerCallbacks;
  private _context: vscode.ExtensionContext;

  constructor(
    context: vscode.ExtensionContext,
    callbacks: ConversationManagerCallbacks
  ) {
    this._context = context;
    this._callbacks = callbacks;

    // Load conversation index from workspace state
    this._conversationIndex = context.workspaceState.get('claude.conversationIndex', []);
  }

  /**
   * Initialize conversations storage directory
   */
  async initialize(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) { return; }

      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) { return; }

      this._conversationsPath = path.join(storagePath, 'conversations');

      // Create conversations directory if it doesn't exist
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(this._conversationsPath));
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._conversationsPath));
        console.log(`Created conversations directory: ${this._conversationsPath}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize conversations:', message);
    }
  }

  /**
   * Add a message to the current conversation
   */
  addMessage(message: ConversationMessage): void {
    if (!this._conversationStartTime) {
      this._conversationStartTime = new Date().toISOString();
    }
    this._currentConversation.push(message);
  }

  /**
   * Get all messages in the current conversation
   */
  getMessages(): ConversationMessage[] {
    return [...this._currentConversation];
  }

  /**
   * Get a message by index
   */
  getMessage(index: number): ConversationMessage | undefined {
    return this._currentConversation[index];
  }

  /**
   * Save the current conversation to disk
   */
  async saveCurrentConversation(
    sessionId: string | undefined,
    stats: ConversationStats
  ): Promise<void> {
    if (!this._conversationsPath || this._currentConversation.length === 0) { return; }
    if (!sessionId) { return; }

    try {
      // Create filename from first user message and timestamp
      const firstUserMessage = this._currentConversation.find(m => m.messageType === 'userInput');
      const firstMessage = firstUserMessage ? String(firstUserMessage.data) : 'conversation';
      const startTime = this._conversationStartTime || new Date().toISOString();

      // Clean and truncate first message for filename
      const cleanMessage = firstMessage
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .substring(0, 50) // Limit length
        .toLowerCase();

      const datePrefix = startTime.substring(0, 16).replace('T', '_').replace(/:/g, '-');
      const filename = `${datePrefix}_${cleanMessage}.json`;

      const conversationData: ConversationData & {
        sessionId: string;
        endTime: string;
        messageCount: number;
        totalCost: number;
        totalTokens: { input: number; output: number };
        filename: string;
      } = {
        sessionId: sessionId,
        startTime: this._conversationStartTime || startTime,
        endTime: new Date().toISOString(),
        messageCount: this._currentConversation.length,
        totalCost: stats.totalCost,
        totalTokens: {
          input: stats.totalTokensInput,
          output: stats.totalTokensOutput
        },
        messages: this._currentConversation,
        filename
      };

      const filePath = path.join(this._conversationsPath, filename);
      const content = new TextEncoder().encode(JSON.stringify(conversationData, null, 2));
      await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), content);

      // Update conversation index
      this._updateConversationIndex(filename, conversationData);

      console.log(`Saved conversation: ${filename}`, this._conversationsPath);
      this._callbacks.onConversationSaved(filename);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to save conversation:', message);
    }
  }

  /**
   * Load a conversation from internal JSON format
   */
  async loadInternalConversation(filename: string): Promise<{
    messages: ConversationMessage[];
    stats: ConversationStats;
    startTime?: string;
  } | undefined> {
    if (!this._conversationsPath) { return undefined; }

    try {
      const filePath = path.join(this._conversationsPath, filename);
      const fileUri = vscode.Uri.file(filePath);
      const content = await vscode.workspace.fs.readFile(fileUri);
      const conversationData = JSON.parse(new TextDecoder().decode(content));

      this._currentConversation = conversationData.messages || [];
      this._conversationStartTime = conversationData.startTime;

      const stats: ConversationStats = {
        totalCost: conversationData.totalCost || 0,
        totalTokensInput: conversationData.totalTokens?.input || 0,
        totalTokensOutput: conversationData.totalTokens?.output || 0
      };

      console.log(`Loaded conversation history: ${filename}`);
      return {
        messages: this._currentConversation,
        stats,
        startTime: this._conversationStartTime
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load conversation history:', message);
      this._callbacks.onError(`Failed to load conversation: ${message}`);
      return undefined;
    }
  }

  /**
   * Load a conversation from Claude CLI JSONL format
   */
  async loadJSONLConversation(filePath: string): Promise<{
    messages: ConversationMessage[];
    sessionId?: string;
    startTime?: string;
  } | undefined> {
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      const lines = new TextDecoder().decode(content).split('\n').filter(l => l.trim());

      const messages: ConversationMessage[] = [];
      let sessionId = '';
      let startTime: string | undefined;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          // Skip non-message entries
          if (entry.type === 'file-history-snapshot') { continue; }

          if (!sessionId && entry.sessionId) {
            sessionId = entry.sessionId;
          }
          if (!startTime && entry.timestamp) {
            startTime = entry.timestamp;
          }

          // Convert JSONL format to internal format
          if (entry.type === 'user' || entry.type === 'human') {
            const userText = this._extractUserText(entry);
            if (userText.trim()) {
              messages.push({
                timestamp: entry.timestamp,
                messageType: 'userInput',
                data: userText
              });
            }
          } else if (entry.type === 'assistant') {
            this._processAssistantEntry(entry, messages);
          } else if (entry.type === 'tool_result') {
            messages.push({
              timestamp: entry.timestamp,
              messageType: 'toolResult',
              data: { result: entry.content || 'Tool executed' }
            });
          } else if (entry.type === 'queue-operation' && entry.operation === 'enqueue' && entry.content) {
            messages.push({
              timestamp: entry.timestamp,
              messageType: 'userInput',
              data: entry.content
            });
          }
        } catch {
          // Skip malformed lines
        }
      }

      this._currentConversation = messages;
      this._conversationStartTime = startTime;

      console.log(`Loaded JSONL conversation: ${filePath}`);
      return { messages, sessionId, startTime };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load JSONL conversation:', message);
      this._callbacks.onError(`Failed to load conversation: ${message}`);
      return undefined;
    }
  }

  /**
   * Get list of all conversations (internal + Claude CLI)
   */
  async getAllConversations(): Promise<ConversationIndexEntry[]> {
    const jsonlConversations = await this._getClaudeJSONLConversations();

    // Combine and sort by date (most recent first)
    const allConversations = [
      ...this._conversationIndex.map(c => ({ ...c, source: 'internal' as const })),
      ...jsonlConversations.map(c => ({ ...c, source: 'jsonl' as const }))
    ].sort((a, b) =>
      new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
    );

    return allConversations;
  }

  /**
   * Clear current conversation state
   */
  clearCurrentConversation(): void {
    this._currentConversation = [];
    this._conversationStartTime = undefined;
  }

  /**
   * Set current conversation from loaded data
   */
  setCurrentConversation(messages: ConversationMessage[], startTime?: string): void {
    this._currentConversation = messages;
    this._conversationStartTime = startTime;
  }

  /**
   * Get conversation start time
   */
  getStartTime(): string | undefined {
    return this._conversationStartTime;
  }

  /**
   * Get conversations storage path
   */
  getConversationsPath(): string | undefined {
    return this._conversationsPath;
  }

  // Private helper methods

  private _extractUserText(entry: Record<string, unknown>): string {
    // Format 1: message.content array with text objects
    const message = entry.message as Record<string, unknown> | undefined;
    if (message?.content && Array.isArray(message.content)) {
      const textContent = message.content.find((c: Record<string, unknown>) => c.type === 'text');
      if (textContent?.text) {
        return String(textContent.text);
      }
    }
    // Format 2: message.content as direct string
    if (message?.content && typeof message.content === 'string') {
      return message.content;
    }
    // Format 3: content directly on entry
    if (entry.content && typeof entry.content === 'string') {
      return entry.content;
    }
    // Format 4: content as array on entry
    if (entry.content && Array.isArray(entry.content)) {
      const textContent = entry.content.find((c: Record<string, unknown>) => c.type === 'text');
      if (textContent?.text) {
        return String(textContent.text);
      }
    }
    // Format 5: text directly on entry
    if (entry.text && typeof entry.text === 'string') {
      return entry.text;
    }
    return '';
  }

  private _processAssistantEntry(entry: Record<string, unknown>, messages: ConversationMessage[]): void {
    const message = entry.message as Record<string, unknown> | undefined;
    const contentArray = message?.content || entry.content;

    if (Array.isArray(contentArray)) {
      for (const content of contentArray) {
        if (content.type === 'text' && content.text) {
          messages.push({
            timestamp: entry.timestamp as string,
            messageType: 'response',
            data: content.text
          });
        } else if (content.type === 'tool_use') {
          messages.push({
            timestamp: entry.timestamp as string,
            messageType: 'toolUse',
            data: {
              toolInfo: `🔧 Executing: ${content.name}`,
              toolName: content.name,
              rawInput: content.input
            }
          });
        }
      }
    } else if (typeof contentArray === 'string') {
      messages.push({
        timestamp: entry.timestamp as string,
        messageType: 'response',
        data: contentArray
      });
    }
  }

  private async _getClaudeJSONLConversations(): Promise<JSONLConversation[]> {
    const projectsPath = this._getClaudeProjectsPath();
    const projectFolder = this._getProjectFolderName();

    if (!projectFolder) { return []; }

    const projectPath = path.join(projectsPath, projectFolder);
    const conversations: JSONLConversation[] = [];

    try {
      const projectUri = vscode.Uri.file(projectPath);
      const files = await vscode.workspace.fs.readDirectory(projectUri);

      for (const [filename, fileType] of files) {
        if (fileType === vscode.FileType.File && filename.endsWith('.jsonl')) {
          // Skip agent files (sub-conversations)
          if (filename.startsWith('agent-')) { continue; }

          const filePath = path.join(projectPath, filename);
          const metadata = await this._parseJSONLMetadata(filePath);

          if (metadata) {
            conversations.push({
              filename,
              path: filePath,
              source: 'jsonl',
              ...metadata
            });
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
      console.log(`Claude projects folder not found: ${projectPath}`);
    }

    return conversations;
  }

  private _getClaudeProjectsPath(): string {
    return path.join(os.homedir(), '.claude', 'projects');
  }

  private _getProjectFolderName(): string | undefined {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) { return undefined; }

    // Claude CLI encodes folder paths by replacing special chars
    const fsPath = workspaceFolder.uri.fsPath;
    const encoded = fsPath
      .replace(/:/g, '-')
      .replace(/[\\/]/g, '-');

    return encoded;
  }

  private async _parseJSONLMetadata(filePath: string): Promise<{
    sessionId: string;
    slug: string;
    startTime: string;
    messageCount: number;
    firstUserMessage: string;
  } | null> {
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
      const lines = new TextDecoder().decode(content).split('\n').filter(l => l.trim());

      if (lines.length === 0) { return null; }

      let sessionId = '';
      let slug = '';
      let startTime = '';
      let firstUserMessage = '';
      let messageCount = 0;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          if (entry.type === 'file-history-snapshot') { continue; }

          messageCount++;

          if (!sessionId && entry.sessionId) { sessionId = entry.sessionId; }
          if (!slug && entry.slug) { slug = entry.slug; }
          if (!startTime && entry.timestamp) { startTime = entry.timestamp; }

          if (!firstUserMessage && entry.type === 'user' && entry.message?.content) {
            const textContent = entry.message.content.find((c: Record<string, unknown>) => c.type === 'text');
            if (textContent) {
              firstUserMessage = String(textContent.text).substring(0, 100);
            }
          }
        } catch {
          // Skip malformed lines
        }
      }

      if (!sessionId && !slug && !firstUserMessage) { return null; }

      return { sessionId, slug, startTime, messageCount, firstUserMessage };
    } catch {
      return null;
    }
  }

  private _updateConversationIndex(
    filename: string,
    conversationData: ConversationData & {
      sessionId?: string;
      endTime?: string;
      messageCount?: number;
      totalCost?: number;
      filename?: string;
    }
  ): void {
    const messages = conversationData.messages || [];
    const userMessages = messages.filter(m => m.messageType === 'userInput');
    const firstUserMessage = userMessages.length > 0 ? String(userMessages[0].data) : 'No user message';
    const lastUserMessage = userMessages.length > 0 ? String(userMessages[userMessages.length - 1].data) : firstUserMessage;

    const indexEntry: ConversationIndexEntry = {
      filename: filename,
      sessionId: conversationData.sessionId,
      startTime: conversationData.startTime || '',
      endTime: conversationData.endTime,
      messageCount: conversationData.messageCount || messages.length,
      totalCost: conversationData.totalCost,
      firstUserMessage: firstUserMessage.substring(0, 100),
      lastUserMessage: lastUserMessage.substring(0, 100)
    };

    // Remove any existing entry for this filename
    this._conversationIndex = this._conversationIndex.filter(entry => entry.filename !== filename);

    // Add new entry at the beginning (most recent first)
    this._conversationIndex.unshift(indexEntry);

    // Keep only last 50 conversations
    if (this._conversationIndex.length > 50) {
      this._conversationIndex = this._conversationIndex.slice(0, 50);
    }

    // Save to workspace state
    this._context.workspaceState.update('claude.conversationIndex', this._conversationIndex);
  }
}
