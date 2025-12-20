/**
 * ConversationManager - Handles conversation storage and retrieval
 *
 * Manages both internal JSON conversations and Claude CLI JSONL conversation loading.
 * Uses Zod for robust schema validation of CLI output formats.
 * Supports streaming for large JSONL files.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as readline from 'readline';
import { z } from 'zod';
import { ConversationMessage, ConversationData } from '../types/messages';

// =============================================================================
// Zod Schemas for Claude CLI JSONL Format
// =============================================================================

/** Text content block */
const TextContentSchema = z.object({
  type: z.literal('text'),
  text: z.string()
});

/** Tool use content block */
const ToolUseContentSchema = z.object({
  type: z.literal('tool_use'),
  id: z.string().optional(),
  name: z.string(),
  input: z.record(z.unknown()).optional()
});

/** Tool result content block */
const ToolResultContentSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
  is_error: z.boolean().optional()
});

/** Image content block */
const ImageContentSchema = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.string(),
    media_type: z.string().optional(),
    data: z.string().optional()
  }).optional()
});

/** Content array that can contain various block types */
const ContentArraySchema = z.array(
  z.union([
    TextContentSchema,
    ToolUseContentSchema,
    ToolResultContentSchema,
    ImageContentSchema,
    z.object({ type: z.string() }).passthrough() // Fallback for unknown types
  ])
);

/** User message schema */
const UserMessageSchema = z.object({
  type: z.enum(['user', 'human']),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  uuid: z.string().optional(),
  message: z.object({
    role: z.literal('user').optional(),
    content: z.union([z.string(), ContentArraySchema])
  }).optional(),
  content: z.union([z.string(), ContentArraySchema]).optional(),
  text: z.string().optional()
});

/** Assistant message schema */
const AssistantMessageSchema = z.object({
  type: z.literal('assistant'),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  costUSD: z.number().optional(),
  durationMs: z.number().optional(),
  message: z.object({
    role: z.literal('assistant').optional(),
    content: z.union([z.string(), ContentArraySchema]),
    model: z.string().optional(),
    stop_reason: z.string().optional()
  }).optional(),
  content: z.union([z.string(), ContentArraySchema]).optional()
});

/** Tool result entry schema */
const ToolResultEntrySchema = z.object({
  type: z.literal('tool_result'),
  timestamp: z.string().optional(),
  tool_use_id: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]).optional(),
  is_error: z.boolean().optional()
});

/** Queue operation schema (for queued messages) */
const QueueOperationSchema = z.object({
  type: z.literal('queue-operation'),
  operation: z.string(),
  content: z.string().optional(),
  timestamp: z.string().optional()
});

/** System/init message schema */
const SystemMessageSchema = z.object({
  type: z.enum(['system', 'init', 'summary', 'result']),
  timestamp: z.string().optional(),
  sessionId: z.string().optional(),
  slug: z.string().optional(),
  cwd: z.string().optional(),
  model: z.string().optional()
}).passthrough();

/** File history snapshot (skip these) */
const FileHistorySnapshotSchema = z.object({
  type: z.literal('file-history-snapshot')
}).passthrough();

/** Union of all possible JSONL entry types */
const JSONLEntrySchema = z.union([
  UserMessageSchema,
  AssistantMessageSchema,
  ToolResultEntrySchema,
  QueueOperationSchema,
  SystemMessageSchema,
  FileHistorySnapshotSchema,
  z.object({ type: z.string() }).passthrough() // Fallback
]);

type JSONLEntry = z.infer<typeof JSONLEntrySchema>;
type UserMessage = z.infer<typeof UserMessageSchema>;
type AssistantMessage = z.infer<typeof AssistantMessageSchema>;
type ToolResultEntry = z.infer<typeof ToolResultEntrySchema>;

// =============================================================================
// Exported Types
// =============================================================================

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

// =============================================================================
// ConversationManager Class
// =============================================================================

export class ConversationManager {
  private _conversationsPath: string | undefined;
  private _conversationIndex: ConversationIndexEntry[] = [];
  private _currentConversation: ConversationMessage[] = [];
  private _conversationStartTime: string | undefined;
  private _callbacks: ConversationManagerCallbacks;
  private _context: vscode.ExtensionContext;
  private _indexSaveInProgress: boolean = false;
  private _indexSavePending: boolean = false;

  constructor(
    context: vscode.ExtensionContext,
    callbacks: ConversationManagerCallbacks
  ) {
    this._context = context;
    this._callbacks = callbacks;

    // Load conversation index - will be populated in initialize()
    this._conversationIndex = [];
  }

  /**
   * Initialize conversations storage directory and load index
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

      // Load conversation index with recovery
      await this._loadConversationIndex();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize conversations:', message);
    }
  }

  // ==========================================================================
  // Index Persistence with Atomic Writes
  // ==========================================================================

  /**
   * Load conversation index from disk with recovery fallbacks
   */
  private async _loadConversationIndex(): Promise<void> {
    if (!this._conversationsPath) {
      // Fall back to workspace state
      this._conversationIndex = this._context.workspaceState.get('claude.conversationIndex', []);
      return;
    }

    const indexPath = path.join(this._conversationsPath, 'index.json');
    const backupPath = path.join(this._conversationsPath, 'index.backup.json');

    // Try loading from primary index
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(indexPath));
      const parsed = JSON.parse(new TextDecoder().decode(content));

      if (Array.isArray(parsed) && this._validateIndexEntries(parsed)) {
        this._conversationIndex = parsed;
        console.log(`Loaded conversation index: ${parsed.length} entries`);
        return;
      }
    } catch {
      console.log('Primary index not found or corrupted, trying backup...');
    }

    // Try loading from backup
    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(backupPath));
      const parsed = JSON.parse(new TextDecoder().decode(content));

      if (Array.isArray(parsed) && this._validateIndexEntries(parsed)) {
        this._conversationIndex = parsed;
        console.log(`Recovered from backup index: ${parsed.length} entries`);
        // Restore primary from backup
        await this._atomicWriteFile(indexPath, JSON.stringify(parsed, null, 2));
        return;
      }
    } catch {
      console.log('Backup index not found or corrupted, trying workspace state...');
    }

    // Try workspace state as last resort
    const workspaceIndex = this._context.workspaceState.get<ConversationIndexEntry[]>('claude.conversationIndex', []);
    if (workspaceIndex.length > 0) {
      this._conversationIndex = workspaceIndex;
      console.log(`Recovered from workspace state: ${workspaceIndex.length} entries`);
      // Persist to disk
      await this._saveConversationIndex();
      return;
    }

    // Rebuild from conversation files
    console.log('No valid index found, rebuilding from files...');
    await this._rebuildConversationIndex();
  }

  /**
   * Validate that index entries have required fields
   */
  private _validateIndexEntries(entries: unknown[]): entries is ConversationIndexEntry[] {
    return entries.every(entry =>
      typeof entry === 'object' &&
      entry !== null &&
      'filename' in entry &&
      'startTime' in entry &&
      typeof (entry as ConversationIndexEntry).filename === 'string'
    );
  }

  /**
   * Save conversation index with atomic write (temp file + rename)
   */
  private async _saveConversationIndex(): Promise<void> {
    if (!this._conversationsPath) {
      // Fall back to workspace state only
      await this._context.workspaceState.update('claude.conversationIndex', this._conversationIndex);
      return;
    }

    // Prevent concurrent saves - queue if already saving
    if (this._indexSaveInProgress) {
      this._indexSavePending = true;
      return;
    }

    this._indexSaveInProgress = true;

    try {
      const indexPath = path.join(this._conversationsPath, 'index.json');
      const backupPath = path.join(this._conversationsPath, 'index.backup.json');

      // Create backup of current index before writing
      try {
        await vscode.workspace.fs.copy(
          vscode.Uri.file(indexPath),
          vscode.Uri.file(backupPath),
          { overwrite: true }
        );
      } catch {
        // No existing index to backup - that's fine
      }

      // Atomic write: temp file + rename
      const content = JSON.stringify(this._conversationIndex, null, 2);
      await this._atomicWriteFile(indexPath, content);

      // Also update workspace state as additional backup
      await this._context.workspaceState.update('claude.conversationIndex', this._conversationIndex);

      console.log(`Saved conversation index: ${this._conversationIndex.length} entries`);
    } catch (error) {
      console.error('Failed to save conversation index:', error);
    } finally {
      this._indexSaveInProgress = false;

      // Process pending save if queued
      if (this._indexSavePending) {
        this._indexSavePending = false;
        await this._saveConversationIndex();
      }
    }
  }

  /**
   * Atomic file write using temp file + rename
   * This ensures the file is never in a partial/corrupted state
   */
  private async _atomicWriteFile(filePath: string, content: string): Promise<void> {
    const tempPath = filePath + '.tmp.' + Date.now();

    try {
      // Write to temp file
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(tempPath),
        new TextEncoder().encode(content)
      );

      // Atomic rename (on most file systems)
      await vscode.workspace.fs.rename(
        vscode.Uri.file(tempPath),
        vscode.Uri.file(filePath),
        { overwrite: true }
      );
    } catch (error) {
      // Clean up temp file on failure
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(tempPath));
      } catch {
        // Temp file may not exist
      }
      throw error;
    }
  }

  /**
   * Rebuild conversation index from conversation files on disk
   * Used when index is corrupted or missing
   */
  private async _rebuildConversationIndex(): Promise<void> {
    if (!this._conversationsPath) return;

    console.log('Rebuilding conversation index from files...');
    const newIndex: ConversationIndexEntry[] = [];

    try {
      const files = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(this._conversationsPath)
      );

      for (const [filename, fileType] of files) {
        if (fileType !== vscode.FileType.File || !filename.endsWith('.json')) {
          continue;
        }
        if (filename === 'index.json' || filename.endsWith('.backup.json') || filename.endsWith('.tmp')) {
          continue;
        }

        try {
          const filePath = path.join(this._conversationsPath, filename);
          const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
          const data = JSON.parse(new TextDecoder().decode(content));

          const messages = data.messages || [];
          const userMessages = messages.filter((m: ConversationMessage) => m.messageType === 'userInput');

          newIndex.push({
            filename,
            sessionId: data.sessionId,
            startTime: data.startTime || '',
            endTime: data.endTime,
            messageCount: data.messageCount || messages.length,
            totalCost: data.totalCost,
            firstUserMessage: userMessages[0] ? String(userMessages[0].data).substring(0, 100) : 'No message',
            lastUserMessage: userMessages.length > 0
              ? String(userMessages[userMessages.length - 1].data).substring(0, 100)
              : undefined
          });
        } catch (e) {
          console.warn(`Failed to parse conversation file: ${filename}`, e);
        }
      }

      // Sort by start time (most recent first)
      newIndex.sort((a, b) =>
        new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime()
      );

      // Keep only last 50
      this._conversationIndex = newIndex.slice(0, 50);
      await this._saveConversationIndex();

      console.log(`Rebuilt conversation index: ${this._conversationIndex.length} entries`);
    } catch (error) {
      console.error('Failed to rebuild conversation index:', error);
      this._conversationIndex = [];
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

      // Update conversation index with atomic write
      await this._updateConversationIndex(filename, conversationData);

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
   * Load a conversation from Claude CLI JSONL format using streaming
   * This handles large files efficiently without loading everything into memory
   */
  async loadJSONLConversation(filePath: string): Promise<{
    messages: ConversationMessage[];
    sessionId?: string;
    startTime?: string;
  } | undefined> {
    try {
      // Use streaming for large files
      const messages = await this._parseJSONLStreaming(filePath);

      this._currentConversation = messages.messages;
      this._conversationStartTime = messages.startTime;

      console.log(`Loaded JSONL conversation: ${filePath} (${messages.messages.length} messages)`);
      return messages;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to load JSONL conversation:', message);
      this._callbacks.onError(`Failed to load conversation: ${message}`);
      return undefined;
    }
  }

  /**
   * Parse JSONL file using streaming (memory efficient for large files)
   */
  private async _parseJSONLStreaming(filePath: string): Promise<{
    messages: ConversationMessage[];
    sessionId?: string;
    startTime?: string;
  }> {
    return new Promise((resolve, reject) => {
      const messages: ConversationMessage[] = [];
      let sessionId: string | undefined;
      let startTime: string | undefined;

      // Check if file exists and get stats
      if (!fs.existsSync(filePath)) {
        reject(new Error(`File not found: ${filePath}`));
        return;
      }

      const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (!line.trim()) return;

        try {
          const rawEntry = JSON.parse(line);
          const parsed = this._parseJSONLEntry(rawEntry);

          if (parsed) {
            if (parsed.sessionId && !sessionId) {
              sessionId = parsed.sessionId;
            }
            if (parsed.startTime && !startTime) {
              startTime = parsed.startTime;
            }
            messages.push(...parsed.messages);
          }
        } catch (e) {
          // Log but don't fail on individual line parse errors
          console.warn('Failed to parse JSONL line:', e);
        }
      });

      rl.on('close', () => {
        resolve({ messages, sessionId, startTime });
      });

      rl.on('error', (error) => {
        reject(error);
      });

      fileStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse a single JSONL entry using Zod schemas
   * Returns extracted messages and metadata
   */
  private _parseJSONLEntry(rawEntry: unknown): {
    messages: ConversationMessage[];
    sessionId?: string;
    startTime?: string;
  } | null {
    // Validate against schema
    const parseResult = JSONLEntrySchema.safeParse(rawEntry);

    if (!parseResult.success) {
      console.warn('JSONL entry failed schema validation:', parseResult.error.message);
      return null;
    }

    const entry = parseResult.data;
    const messages: ConversationMessage[] = [];
    let sessionId: string | undefined;
    let startTime: string | undefined;

    // Skip file-history-snapshot entries
    if (entry.type === 'file-history-snapshot') {
      return null;
    }

    // Extract session info
    if ('sessionId' in entry && entry.sessionId) {
      sessionId = entry.sessionId;
    }
    if ('timestamp' in entry && entry.timestamp) {
      startTime = entry.timestamp;
    }

    // Handle user messages
    if (entry.type === 'user' || entry.type === 'human') {
      const userText = this._extractUserText(entry as UserMessage);
      if (userText.trim()) {
        messages.push({
          timestamp: (entry as UserMessage).timestamp || new Date().toISOString(),
          messageType: 'userInput',
          data: userText
        });
      }
    }

    // Handle assistant messages
    else if (entry.type === 'assistant') {
      const assistantMessages = this._extractAssistantContent(entry as AssistantMessage);
      messages.push(...assistantMessages);
    }

    // Handle tool_result entries
    else if (entry.type === 'tool_result') {
      const resultEntry = entry as ToolResultEntry;
      const content = typeof resultEntry.content === 'string'
        ? resultEntry.content
        : JSON.stringify(resultEntry.content || 'Tool executed');

      messages.push({
        timestamp: resultEntry.timestamp || new Date().toISOString(),
        messageType: 'toolResult',
        data: {
          result: content,
          isError: resultEntry.is_error || false,
          toolUseId: resultEntry.tool_use_id
        }
      });
    }

    // Handle queue operations (queued user messages)
    else if (entry.type === 'queue-operation') {
      const queueEntry = entry as z.infer<typeof QueueOperationSchema>;
      if (queueEntry.operation === 'enqueue' && queueEntry.content) {
        messages.push({
          timestamp: queueEntry.timestamp || new Date().toISOString(),
          messageType: 'userInput',
          data: queueEntry.content
        });
      }
    }

    return messages.length > 0 || sessionId || startTime
      ? { messages, sessionId, startTime }
      : null;
  }

  /**
   * Extract user text from various message formats
   */
  private _extractUserText(entry: UserMessage): string {
    // Format 1: message.content array with text objects
    if (entry.message?.content) {
      if (Array.isArray(entry.message.content)) {
        const textContent = entry.message.content.find(
          (c): c is z.infer<typeof TextContentSchema> => c.type === 'text'
        );
        if (textContent?.text) {
          return textContent.text;
        }
      } else if (typeof entry.message.content === 'string') {
        return entry.message.content;
      }
    }

    // Format 2: content directly on entry
    if (entry.content) {
      if (typeof entry.content === 'string') {
        return entry.content;
      }
      if (Array.isArray(entry.content)) {
        const textContent = entry.content.find(
          (c): c is z.infer<typeof TextContentSchema> =>
            typeof c === 'object' && 'type' in c && c.type === 'text'
        );
        if (textContent?.text) {
          return textContent.text;
        }
      }
    }

    // Format 3: text directly on entry
    if (entry.text) {
      return entry.text;
    }

    return '';
  }

  /**
   * Extract content from assistant messages (text + tool uses)
   */
  private _extractAssistantContent(entry: AssistantMessage): ConversationMessage[] {
    const messages: ConversationMessage[] = [];
    const timestamp = entry.timestamp || new Date().toISOString();

    // Get content from message.content or entry.content
    const contentArray = entry.message?.content || entry.content;

    if (Array.isArray(contentArray)) {
      for (const content of contentArray) {
        if (content.type === 'text' && 'text' in content && content.text) {
          messages.push({
            timestamp,
            messageType: 'response',
            data: content.text
          });
        } else if (content.type === 'tool_use' && 'name' in content) {
          messages.push({
            timestamp,
            messageType: 'toolUse',
            data: {
              toolInfo: `🔧 Executing: ${content.name}`,
              toolName: content.name,
              rawInput: 'input' in content ? content.input : undefined,
              toolId: 'id' in content ? content.id : undefined
            }
          });
        }
      }
    } else if (typeof contentArray === 'string') {
      messages.push({
        timestamp,
        messageType: 'response',
        data: contentArray
      });
    }

    return messages;
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

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

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
          const metadata = await this._parseJSONLMetadataStreaming(filePath);

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

  /**
   * Parse JSONL metadata using streaming (for conversation list)
   */
  private async _parseJSONLMetadataStreaming(filePath: string): Promise<{
    sessionId: string;
    slug: string;
    startTime: string;
    messageCount: number;
    firstUserMessage: string;
  } | null> {
    return new Promise((resolve) => {
      if (!fs.existsSync(filePath)) {
        resolve(null);
        return;
      }

      let sessionId = '';
      let slug = '';
      let startTime = '';
      let firstUserMessage = '';
      let messageCount = 0;

      const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      rl.on('line', (line) => {
        if (!line.trim()) return;

        try {
          const entry = JSON.parse(line);

          if (entry.type === 'file-history-snapshot') return;

          messageCount++;

          if (!sessionId && entry.sessionId) { sessionId = entry.sessionId; }
          if (!slug && entry.slug) { slug = entry.slug; }
          if (!startTime && entry.timestamp) { startTime = entry.timestamp; }

          // Get first user message for preview
          if (!firstUserMessage && (entry.type === 'user' || entry.type === 'human')) {
            const userResult = UserMessageSchema.safeParse(entry);
            if (userResult.success) {
              const text = this._extractUserText(userResult.data);
              if (text) {
                firstUserMessage = text.substring(0, 100);
              }
            }
          }
        } catch {
          // Skip malformed lines
        }
      });

      rl.on('close', () => {
        if (!sessionId && !slug && !firstUserMessage) {
          resolve(null);
        } else {
          resolve({ sessionId, slug, startTime, messageCount, firstUserMessage });
        }
      });

      rl.on('error', () => {
        resolve(null);
      });
    });
  }

  private async _updateConversationIndex(
    filename: string,
    conversationData: ConversationData & {
      sessionId?: string;
      endTime?: string;
      messageCount?: number;
      totalCost?: number;
      filename?: string;
    }
  ): Promise<void> {
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

    // Save with atomic write + backup
    await this._saveConversationIndex();
  }

  /**
   * Force rebuild of conversation index (public method for manual recovery)
   */
  async rebuildIndex(): Promise<void> {
    await this._rebuildConversationIndex();
  }

  /**
   * Get the current conversation index
   */
  getConversationIndex(): ConversationIndexEntry[] {
    return [...this._conversationIndex];
  }
}
