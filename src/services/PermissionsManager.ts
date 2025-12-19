/**
 * PermissionsManager - Handles tool permission management
 *
 * Manages permission requests, approvals, and local permission storage.
 */

import * as vscode from 'vscode';
import * as path from 'path';

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

export class PermissionsManager {
  private _context: vscode.ExtensionContext;
  private _callbacks: PermissionsManagerCallbacks;
  private _pendingRequests: Map<string, PermissionRequest> = new Map();

  constructor(
    context: vscode.ExtensionContext,
    callbacks: PermissionsManagerCallbacks
  ) {
    this._context = context;
    this._callbacks = callbacks;
  }

  /**
   * Check if a tool is pre-approved for a specific input
   */
  async isToolPreApproved(toolName: string, input: Record<string, unknown>): Promise<boolean> {
    try {
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
        return true;
      }

      if (Array.isArray(toolPermission) && toolName === 'Bash' && input.command) {
        // Check if the command matches any approved pattern
        const command = (input.command as string).trim();
        for (const pattern of toolPermission) {
          if (this._matchesPattern(command, pattern)) {
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
   * Check if a command matches a permission pattern (supports * wildcard)
   */
  private _matchesPattern(command: string, pattern: string): boolean {
    if (pattern === command) return true;

    // Handle wildcard patterns like "npm install *"
    if (pattern.endsWith(' *')) {
      const prefix = pattern.slice(0, -1); // Remove the *
      return command.startsWith(prefix);
    }

    return false;
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
}
