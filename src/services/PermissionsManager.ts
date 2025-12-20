/**
 * PermissionsManager - Handles tool permission management
 *
 * Manages permission requests, approvals, and local permission storage.
 * Includes:
 * - Minimatch glob pattern support for flexible command matching
 * - Hardcoded deny list for dangerous commands
 * - Audit logging for permission decisions
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { minimatch } from 'minimatch';

export interface PermissionRequest {
  requestId: string;
  toolName: string;
  input: Record<string, unknown>;
  suggestions?: unknown[];
  toolUseId: string;
}

export interface PermissionsData {
  alwaysAllow: Record<string, boolean | string[]>;
}

export interface PermissionsManagerCallbacks {
  onPermissionStatusUpdate: (id: string, status: 'approved' | 'denied' | 'cancelled') => void;
  onPermissionRequest: (requestId: string, toolName: string, input: Record<string, unknown>, pattern?: string, suggestions?: unknown[], decisionReason?: string, blockedPath?: string) => void;
}

/** Audit log entry for permission decisions */
export interface AuditEntry {
  timestamp: string;
  action: 'approved' | 'denied' | 'auto-approved' | 'blocked';
  toolName: string;
  command?: string;
  pattern?: string;
  reason?: string;
}

/**
 * Dangerous command patterns that should NEVER be auto-approved.
 * These will always trigger a permission prompt, even if broader patterns are allowed.
 */
const BLOCKED_COMMAND_PATTERNS: readonly string[] = [
  // Destructive file operations
  'rm -rf /',
  'rm -rf ~',
  'rm -rf *',
  'rm -rf .',
  'sudo rm -rf',
  'sudo rm -r /',

  // Privilege escalation
  'sudo su',
  'sudo bash',
  'sudo sh',
  'sudo -i',
  'sudo -s',

  // System destruction
  'mkfs',
  'mkfs.*',
  'dd if=*of=/dev/*',
  'dd of=/dev/sda',
  'dd of=/dev/nvme',
  '> /dev/sda',
  '> /dev/nvme',

  // Fork bombs and resource exhaustion
  ':(){:|:&};:',
  ':(){ :|:& };:',

  // Dangerous permission changes
  'chmod 777 /',
  'chmod -R 777 /',
  'chown -R * /',

  // Remote code execution
  'curl * | bash',
  'curl * | sh',
  'wget * | bash',
  'wget * | sh',
  'curl -s * | bash',
  'wget -q * | bash',

  // History/log manipulation (potential cover-up)
  'history -c',
  'rm ~/.bash_history',
  'rm -rf /var/log',

  // Network attacks
  ':(){ :|:& };:',
  'fork bomb',
] as const;

/**
 * Additional patterns that are blocked but may have legitimate uses.
 * These generate warnings but can be overridden with explicit permission.
 */
const WARNED_COMMAND_PATTERNS: readonly string[] = [
  'sudo *',           // Any sudo command (warn but allow if explicitly approved)
  'chmod 777 *',      // World-writable permissions
  'rm -rf *',         // Recursive force delete (context-dependent)
] as const;

export class PermissionsManager {
  private _context: vscode.ExtensionContext;
  private _callbacks: PermissionsManagerCallbacks;
  private _pendingRequests: Map<string, PermissionRequest> = new Map();
  private _auditLogPath: string | undefined;

  constructor(
    context: vscode.ExtensionContext,
    callbacks: PermissionsManagerCallbacks
  ) {
    this._context = context;
    this._callbacks = callbacks;
    this._initializeAuditLog();
  }

  /**
   * Initialize audit log path
   */
  private async _initializeAuditLog(): Promise<void> {
    try {
      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return;

      const permissionsDir = path.join(storagePath, 'permissions');
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(permissionsDir));
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(permissionsDir));
      }

      this._auditLogPath = path.join(permissionsDir, 'audit.jsonl');
    } catch (error) {
      console.error('Failed to initialize audit log:', error);
    }
  }

  /**
   * Check if a command is in the blocked list
   * @returns Object with blocked status and reason
   */
  isCommandBlocked(command: string): { blocked: boolean; reason?: string } {
    // Normalize: trim, lowercase, and collapse multiple spaces to prevent bypass
    const normalizedCommand = command.trim().toLowerCase().replace(/\s+/g, ' ');

    for (const pattern of BLOCKED_COMMAND_PATTERNS) {
      // Check for exact match or pattern match
      if (normalizedCommand === pattern.toLowerCase()) {
        return { blocked: true, reason: `Matches blocked pattern: ${pattern}` };
      }

      // Check if command contains the dangerous pattern
      if (pattern.includes('*')) {
        // Convert simple glob to regex for contains check
        const regexPattern = pattern
          .replace(/[.+^${}()|[\]\\]/g, '\\$&')
          .replace(/\*/g, '.*');
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(normalizedCommand)) {
          return { blocked: true, reason: `Matches blocked pattern: ${pattern}` };
        }
      } else if (normalizedCommand.includes(pattern.toLowerCase())) {
        return { blocked: true, reason: `Contains blocked command: ${pattern}` };
      }
    }

    return { blocked: false };
  }

  /**
   * Check if a command triggers a warning (but is not fully blocked)
   */
  isCommandWarned(command: string): { warned: boolean; reason?: string } {
    const normalizedCommand = command.trim();

    for (const pattern of WARNED_COMMAND_PATTERNS) {
      if (this._matchesPattern(normalizedCommand, pattern)) {
        return { warned: true, reason: `Potentially dangerous: matches ${pattern}` };
      }
    }

    return { warned: false };
  }

  /**
   * Check if a tool is pre-approved for a specific input
   */
  async isToolPreApproved(toolName: string, input: Record<string, unknown>): Promise<boolean> {
    try {
      // First, check blocked list for Bash commands
      if (toolName === 'Bash' && input.command) {
        const command = (input.command as string).trim();
        const { blocked, reason } = this.isCommandBlocked(command);

        if (blocked) {
          console.warn(`Blocked dangerous command: ${command} - ${reason}`);
          await this._logAuditEntry({
            timestamp: new Date().toISOString(),
            action: 'blocked',
            toolName,
            command,
            reason
          });
          return false; // Force permission prompt
        }
      }

      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return false;

      const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
      let permissions: PermissionsData = { alwaysAllow: {} };

      try {
        const content = await vscode.workspace.fs.readFile(permissionsUri);
        permissions = JSON.parse(new TextDecoder().decode(content));
      } catch {
        return false; // No permissions file
      }

      const toolPermission = permissions.alwaysAllow?.[toolName];

      if (toolPermission === true) {
        // Tool is fully approved (all commands/inputs)
        await this._logAuditEntry({
          timestamp: new Date().toISOString(),
          action: 'auto-approved',
          toolName,
          command: toolName === 'Bash' ? (input.command as string) : undefined,
          reason: 'Tool fully approved'
        });
        return true;
      }

      if (Array.isArray(toolPermission) && toolName === 'Bash' && input.command) {
        // Check if the command matches any approved pattern
        const command = (input.command as string).trim();
        for (const pattern of toolPermission) {
          if (this._matchesPattern(command, pattern)) {
            await this._logAuditEntry({
              timestamp: new Date().toISOString(),
              action: 'auto-approved',
              toolName,
              command,
              pattern,
              reason: `Matches pattern: ${pattern}`
            });
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking pre-approved permissions:', error);
      return false;
    }
  }

  /**
   * Check if a command matches a permission pattern
   * Supports:
   * - Exact match
   * - Simple wildcards (e.g., "npm install *")
   * - Glob patterns via minimatch (e.g., "git {add,commit} *")
   * - Regex patterns prefixed with / (e.g., "/^npm (install|i) .*/")
   */
  private _matchesPattern(command: string, pattern: string): boolean {
    // Exact match
    if (pattern === command) return true;

    // Simple wildcard at end (backwards compatible)
    if (pattern.endsWith(' *')) {
      const prefix = pattern.slice(0, -1); // Remove the *
      if (command.startsWith(prefix)) return true;
    }

    // Regex pattern (prefixed with /)
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try {
        const regexStr = pattern.slice(1, -1);
        const regex = new RegExp(regexStr);
        if (regex.test(command)) return true;
      } catch {
        // Invalid regex, skip
        console.warn(`Invalid regex pattern: ${pattern}`);
      }
    }

    // Minimatch glob pattern
    try {
      if (minimatch(command, pattern, { nocase: true })) {
        return true;
      }
    } catch {
      // minimatch failed, continue
    }

    return false;
  }

  /**
   * Log a permission decision to the audit log
   * Uses fs.appendFile for O(1) atomic appends instead of read-modify-write
   */
  private async _logAuditEntry(entry: AuditEntry): Promise<void> {
    if (!this._auditLogPath) return;

    try {
      const line = JSON.stringify(entry) + '\n';
      // Use fs.appendFile for efficient O(1) append without reading entire file
      await fs.promises.appendFile(this._auditLogPath, line, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Read existing audit log content
   * Uses fs.promises for consistency with appendFile
   */
  private async _readAuditLog(): Promise<string> {
    if (!this._auditLogPath) return '';

    try {
      return await fs.promises.readFile(this._auditLogPath, 'utf8');
    } catch {
      return ''; // File doesn't exist yet
    }
  }

  /**
   * Get recent audit log entries
   */
  async getRecentAuditEntries(limit: number = 50): Promise<AuditEntry[]> {
    try {
      const content = await this._readAuditLog();
      if (!content.trim()) return [];

      const lines = content.trim().split('\n');
      const entries: AuditEntry[] = [];

      // Parse from end (most recent first)
      for (let i = lines.length - 1; i >= 0 && entries.length < limit; i--) {
        try {
          const entry = JSON.parse(lines[i]) as AuditEntry;
          entries.push(entry);
        } catch {
          // Skip malformed lines
        }
      }

      return entries;
    } catch {
      return [];
    }
  }

  /**
   * Add a pending permission request
   */
  addPendingRequest(request: PermissionRequest): void {
    this._pendingRequests.set(request.requestId, request);
  }

  /**
   * Get a pending permission request
   */
  getPendingRequest(requestId: string): PermissionRequest | undefined {
    return this._pendingRequests.get(requestId);
  }

  /**
   * Remove and return a pending permission request
   */
  removePendingRequest(requestId: string): PermissionRequest | undefined {
    const request = this._pendingRequests.get(requestId);
    this._pendingRequests.delete(requestId);
    return request;
  }

  /**
   * Cancel all pending permission requests
   */
  cancelAllPendingRequests(): void {
    for (const [id] of this._pendingRequests) {
      this._callbacks.onPermissionStatusUpdate(id, 'cancelled');
    }
    this._pendingRequests.clear();
  }

  /**
   * Log a manual permission decision (approved/denied by user)
   */
  async logPermissionDecision(
    toolName: string,
    approved: boolean,
    input: Record<string, unknown>,
    pattern?: string
  ): Promise<void> {
    await this._logAuditEntry({
      timestamp: new Date().toISOString(),
      action: approved ? 'approved' : 'denied',
      toolName,
      command: toolName === 'Bash' ? (input.command as string) : undefined,
      pattern,
      reason: approved ? 'User approved' : 'User denied'
    });
  }

  /**
   * Save permission to local storage for UI display in settings
   */
  async saveLocalPermission(toolName: string, input: Record<string, unknown>): Promise<void> {
    try {
      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return;

      // Ensure permissions directory exists
      const permissionsDir = path.join(storagePath, 'permissions');
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(permissionsDir));
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(permissionsDir));
      }

      // Load existing permissions
      const permissionsUri = vscode.Uri.file(path.join(permissionsDir, 'permissions.json'));
      let permissions: PermissionsData = { alwaysAllow: {} };

      try {
        const content = await vscode.workspace.fs.readFile(permissionsUri);
        permissions = JSON.parse(new TextDecoder().decode(content));
      } catch {
        // File doesn't exist yet
      }

      // Add the permission
      if (toolName === 'Bash' && input.command) {
        if (!permissions.alwaysAllow[toolName]) {
          permissions.alwaysAllow[toolName] = [];
        }
        const currentValue = permissions.alwaysAllow[toolName];
        if (Array.isArray(currentValue)) {
          const pattern = this.getCommandPattern(input.command as string);
          if (!currentValue.includes(pattern)) {
            currentValue.push(pattern);
          }
        }
      } else {
        permissions.alwaysAllow[toolName] = true;
      }

      // Save permissions
      const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
      await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

      console.log(`Saved local permission for ${toolName}`);
    } catch (error) {
      console.error('Error saving local permission:', error);
    }
  }

  /**
   * Get all saved permissions
   */
  async getPermissions(): Promise<PermissionsData> {
    try {
      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return { alwaysAllow: {} };

      const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));

      try {
        const content = await vscode.workspace.fs.readFile(permissionsUri);
        return JSON.parse(new TextDecoder().decode(content));
      } catch {
        return { alwaysAllow: {} };
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      return { alwaysAllow: {} };
    }
  }

  /**
   * Remove a permission
   */
  async removePermission(toolName: string, command: string | null): Promise<void> {
    try {
      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return;

      const permissionsUri = vscode.Uri.file(path.join(storagePath, 'permissions', 'permissions.json'));
      let permissions: PermissionsData = { alwaysAllow: {} };

      try {
        const content = await vscode.workspace.fs.readFile(permissionsUri);
        permissions = JSON.parse(new TextDecoder().decode(content));
      } catch {
        return; // No file to modify
      }

      if (command === null) {
        // Remove the entire tool permission
        delete permissions.alwaysAllow[toolName];
      } else {
        // Remove a specific command pattern
        const currentValue = permissions.alwaysAllow[toolName];
        if (Array.isArray(currentValue)) {
          permissions.alwaysAllow[toolName] = currentValue.filter(c => c !== command);
          if ((permissions.alwaysAllow[toolName] as string[]).length === 0) {
            delete permissions.alwaysAllow[toolName];
          }
        }
      }

      const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
      await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

      console.log(`Removed permission for ${toolName}${command ? `: ${command}` : ''}`);
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  }

  /**
   * Add a permission
   */
  async addPermission(toolName: string, command: string | null): Promise<void> {
    try {
      const storagePath = this._context.storageUri?.fsPath;
      if (!storagePath) return;

      // Ensure permissions directory exists
      const permissionsDir = path.join(storagePath, 'permissions');
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(permissionsDir));
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(permissionsDir));
      }

      const permissionsUri = vscode.Uri.file(path.join(permissionsDir, 'permissions.json'));
      let permissions: PermissionsData = { alwaysAllow: {} };

      try {
        const content = await vscode.workspace.fs.readFile(permissionsUri);
        permissions = JSON.parse(new TextDecoder().decode(content));
      } catch {
        // File doesn't exist yet
      }

      if (command === null) {
        // Add full tool permission
        permissions.alwaysAllow[toolName] = true;
      } else {
        // Add specific command pattern
        if (!permissions.alwaysAllow[toolName]) {
          permissions.alwaysAllow[toolName] = [];
        }
        const currentValue = permissions.alwaysAllow[toolName];
        if (Array.isArray(currentValue)) {
          if (!currentValue.includes(command)) {
            currentValue.push(command);
          }
        }
      }

      const permissionsContent = new TextEncoder().encode(JSON.stringify(permissions, null, 2));
      await vscode.workspace.fs.writeFile(permissionsUri, permissionsContent);

      console.log(`Added permission for ${toolName}${command ? `: ${command}` : ''}`);
    } catch (error) {
      console.error('Error adding permission:', error);
    }
  }

  /**
   * Get command pattern for a Bash command (for UI display)
   */
  getCommandPattern(command: string): string {
    const parts = command.trim().split(/\s+/);
    if (parts.length === 0) return command;

    const baseCmd = parts[0];
    const subCmd = parts.length > 1 ? parts[1] : '';

    // Common patterns that should use wildcards
    const patterns: [string, string, string][] = [
      // Package managers
      ['npm', 'install', 'npm install *'],
      ['npm', 'i', 'npm i *'],
      ['npm', 'add', 'npm add *'],
      ['npm', 'remove', 'npm remove *'],
      ['npm', 'uninstall', 'npm uninstall *'],
      ['npm', 'update', 'npm update *'],
      ['npm', 'run', 'npm run *'],
      ['yarn', 'add', 'yarn add *'],
      ['yarn', 'remove', 'yarn remove *'],
      ['yarn', 'install', 'yarn install *'],
      ['pnpm', 'install', 'pnpm install *'],
      ['pnpm', 'add', 'pnpm add *'],
      ['pnpm', 'remove', 'pnpm remove *'],

      // Git commands
      ['git', 'add', 'git add *'],
      ['git', 'commit', 'git commit *'],
      ['git', 'push', 'git push *'],
      ['git', 'pull', 'git pull *'],
      ['git', 'checkout', 'git checkout *'],
      ['git', 'branch', 'git branch *'],
      ['git', 'merge', 'git merge *'],
      ['git', 'clone', 'git clone *'],
      ['git', 'reset', 'git reset *'],
      ['git', 'rebase', 'git rebase *'],
      ['git', 'tag', 'git tag *'],

      // Docker commands
      ['docker', 'run', 'docker run *'],
      ['docker', 'build', 'docker build *'],
      ['docker', 'exec', 'docker exec *'],
      ['docker', 'logs', 'docker logs *'],
      ['docker', 'stop', 'docker stop *'],
      ['docker', 'start', 'docker start *'],
      ['docker', 'rm', 'docker rm *'],
      ['docker', 'rmi', 'docker rmi *'],
      ['docker', 'pull', 'docker pull *'],

      // Build tools
      ['make', '', 'make *'],
      ['cargo', 'build', 'cargo build *'],
      ['cargo', 'run', 'cargo run *'],
      ['cargo', 'test', 'cargo test *'],
      ['go', 'build', 'go build *'],
      ['go', 'run', 'go run *'],
      ['go', 'test', 'go test *'],
      ['gradle', '', 'gradle *'],
      ['maven', '', 'maven *'],
      ['mvn', '', 'mvn *'],

      // Python
      ['pip', 'install', 'pip install *'],
      ['pip3', 'install', 'pip3 install *'],
      ['python', '-m', 'python -m *'],
      ['python3', '-m', 'python3 -m *'],

      // General utilities
      ['mkdir', '', 'mkdir *'],
      ['rm', '', 'rm *'],
      ['cp', '', 'cp *'],
      ['mv', '', 'mv *'],
      ['chmod', '', 'chmod *'],
      ['chown', '', 'chown *'],
      ['cat', '', 'cat *'],
      ['ls', '', 'ls *'],
      ['find', '', 'find *'],
      ['grep', '', 'grep *'],
    ];

    for (const [cmd, sub, pattern] of patterns) {
      if (baseCmd === cmd && (sub === '' || subCmd === sub)) {
        return pattern;
      }
    }

    // For unknown commands with arguments, use base command + wildcard
    if (parts.length > 1) {
      return `${baseCmd} *`;
    }

    // For single-word commands, return as-is
    return command;
  }

  /**
   * Build permission response object for Claude CLI
   */
  buildPermissionResponse(
    requestId: string,
    approved: boolean,
    pendingRequest: PermissionRequest,
    alwaysAllow?: boolean
  ): Record<string, unknown> {
    if (approved) {
      return {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: requestId,
          response: {
            behavior: 'allow',
            updatedInput: pendingRequest.input,
            updatedPermissions: alwaysAllow ? pendingRequest.suggestions : undefined,
            toolUseID: pendingRequest.toolUseId
          }
        }
      };
    } else {
      return {
        type: 'control_response',
        response: {
          subtype: 'success',
          request_id: requestId,
          response: {
            behavior: 'deny',
            message: 'User denied permission',
            interrupt: true,
            toolUseID: pendingRequest.toolUseId
          }
        }
      };
    }
  }

  /**
   * Get the list of blocked command patterns (for UI display)
   */
  getBlockedPatterns(): readonly string[] {
    return BLOCKED_COMMAND_PATTERNS;
  }

  /**
   * Get the list of warned command patterns (for UI display)
   */
  getWarnedPatterns(): readonly string[] {
    return WARNED_COMMAND_PATTERNS;
  }
}
