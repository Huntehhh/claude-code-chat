/**
 * BackupService - Handles git-based backup operations for workspace files
 *
 * Creates automatic backups before AI edits and allows restoration to previous states.
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as util from 'util';
import * as path from 'path';
import { CommitInfo } from '../types/messages';

const exec = util.promisify(cp.exec);

export interface BackupServiceCallbacks {
  onCommitCreated: (commitInfo: CommitInfo) => void;
  onRestoreProgress: (message: string) => void;
  onRestoreSuccess: (message: string, commitSha: string) => void;
  onRestoreError: (error: string) => void;
}

export class BackupService {
  private _backupRepoPath: string | undefined;
  private _commits: CommitInfo[] = [];
  private _storagePath: string | undefined;
  private _callbacks: BackupServiceCallbacks;

  constructor(
    storagePath: string | undefined,
    callbacks: BackupServiceCallbacks
  ) {
    this._storagePath = storagePath;
    this._callbacks = callbacks;
  }

  /**
   * Initialize the backup git repository
   */
  async initialize(): Promise<void> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) { return; }

      if (!this._storagePath) {
        console.error('No workspace storage available');
        return;
      }

      console.log('Workspace storage path:', this._storagePath);
      this._backupRepoPath = path.join(this._storagePath, 'backups', '.git');

      // Create backup git directory if it doesn't exist
      try {
        await vscode.workspace.fs.stat(vscode.Uri.file(this._backupRepoPath));
      } catch {
        await vscode.workspace.fs.createDirectory(vscode.Uri.file(this._backupRepoPath));

        const workspacePath = workspaceFolder.uri.fsPath;

        // Initialize git repo with workspace as work-tree
        await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" init`);
        await exec(`git --git-dir="${this._backupRepoPath}" config user.name "Claude Code Chat"`);
        await exec(`git --git-dir="${this._backupRepoPath}" config user.email "claude@anthropic.com"`);

        console.log(`Initialized backup repository at: ${this._backupRepoPath}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize backup repository:', message);
    }
  }

  /**
   * Create a backup commit before processing a user message
   */
  async createCommit(userMessage: string): Promise<CommitInfo | undefined> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder || !this._backupRepoPath) { return; }

      const workspacePath = workspaceFolder.uri.fsPath;
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const displayTimestamp = now.toISOString();
      const truncatedMessage = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
      const commitMessage = `Before: ${truncatedMessage}`;

      // Add all files using git-dir and work-tree (excludes .git automatically)
      await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" add -A`);

      // Check if this is the first commit (no HEAD exists yet)
      let isFirstCommit = false;
      try {
        await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);
      } catch {
        isFirstCommit = true;
      }

      // Check if there are changes to commit
      const { stdout: status } = await exec(
        `git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" status --porcelain`
      );

      // Determine the commit message
      let actualMessage: string;
      if (isFirstCommit) {
        actualMessage = `Initial backup: ${truncatedMessage}`;
      } else if (status.trim()) {
        actualMessage = commitMessage;
      } else {
        actualMessage = `Checkpoint (no changes): ${truncatedMessage}`;
      }

      // Create commit with --allow-empty to ensure checkpoint is always created
      // Use spawn with argument array to prevent command injection via commit message
      await new Promise<void>((resolve, reject) => {
        const git = cp.spawn('git', [
          '--git-dir', this._backupRepoPath!,
          '--work-tree', workspacePath,
          'commit', '--allow-empty', '-m', actualMessage
        ], { cwd: workspacePath });
        git.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`git commit failed with code ${code}`));
        });
        git.on('error', reject);
      });

      const { stdout: sha } = await exec(`git --git-dir="${this._backupRepoPath}" rev-parse HEAD`);

      // Create commit info
      const commitInfo: CommitInfo = {
        id: `commit-${timestamp}`,
        sha: sha.trim(),
        message: actualMessage,
        timestamp: displayTimestamp
      };

      this._commits.push(commitInfo);
      this._callbacks.onCommitCreated(commitInfo);

      console.log(`Created backup commit: ${commitInfo.sha.substring(0, 8)} - ${actualMessage}`);
      return commitInfo;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to create backup commit:', message);
      return undefined;
    }
  }

  /**
   * Restore workspace to a specific commit
   */
  async restoreToCommit(commitSha: string): Promise<void> {
    try {
      const commit = this._commits.find(c => c.sha === commitSha);
      if (!commit) {
        this._callbacks.onRestoreError('Commit not found');
        return;
      }

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder || !this._backupRepoPath) {
        vscode.window.showErrorMessage('No workspace folder or backup repository available.');
        return;
      }

      const workspacePath = workspaceFolder.uri.fsPath;

      this._callbacks.onRestoreProgress('Restoring files from backup...');

      // Restore files directly to workspace using git checkout
      await exec(`git --git-dir="${this._backupRepoPath}" --work-tree="${workspacePath}" checkout ${commitSha} -- .`);

      vscode.window.showInformationMessage(`Restored to commit: ${commit.message}`);
      this._callbacks.onRestoreSuccess(`Successfully restored to: ${commit.message}`, commitSha);

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Failed to restore commit:', message);
      vscode.window.showErrorMessage(`Failed to restore commit: ${message}`);
      this._callbacks.onRestoreError(`Failed to restore: ${message}`);
    }
  }

  /**
   * Get all stored commits
   */
  getCommits(): CommitInfo[] {
    return [...this._commits];
  }

  /**
   * Find a commit by SHA
   */
  findCommit(sha: string): CommitInfo | undefined {
    return this._commits.find(c => c.sha === sha);
  }

  /**
   * Get the backup repository path
   */
  getRepoPath(): string | undefined {
    return this._backupRepoPath;
  }

  /**
   * Clear all commits (for session reset)
   */
  clearCommits(): void {
    this._commits = [];
  }
}
