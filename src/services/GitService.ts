import simpleGit, { SimpleGit } from 'simple-git';

export interface GitServiceConfig {
  gitDir: string;
  workTree: string;
}

export interface CommitInfo {
  id: string;
  sha: string;
  message: string;
  timestamp: string;
}

/**
 * GitService provides safe Git operations for conversation backups
 * Uses simple-git library to prevent command injection vulnerabilities
 */
export class GitService {
  private _git: SimpleGit;
  private _config: GitServiceConfig;

  constructor(config: GitServiceConfig) {
    this._config = config;
    this._git = simpleGit({
      baseDir: config.workTree,
      config: [`core.gitdir=${config.gitDir}`]
    });
  }

  /**
   * Initialize git repository with safe configuration
   */
  async initialize(): Promise<void> {
    await this._git.init(['--separate-git-dir', this._config.gitDir]);
    await this._git.addConfig('user.name', 'Claude Code Chat');
    await this._git.addConfig('user.email', 'claude@anthropic.com');
  }

  /**
   * Create a backup commit with message truncation and sanitization
   */
  async createCommit(message: string): Promise<CommitInfo> {
    // Truncate message to prevent excessive file sizes
    const sanitized = message.substring(0, 500);

    await this._git.add('-A');
    const status = await this._git.status();

    // Use simple-git's safe parameter handling
    const commitMessage = status.files.length > 0
      ? `Before: ${sanitized}`
      : `Checkpoint (no changes): ${sanitized}`;

    await this._git.commit(commitMessage, ['--allow-empty']);
    const sha = await this._git.revparse(['HEAD']);

    return {
      id: `commit-${Date.now()}`,
      sha: sha.trim(),
      message: commitMessage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Restore working directory to a specific commit
   * Validates SHA format to prevent injection
   */
  async restoreCommit(sha: string): Promise<void> {
    // Validate SHA format (7-40 hex characters)
    if (!/^[0-9a-f]{7,40}$/.test(sha)) {
      throw new Error('Invalid commit SHA format');
    }
    // simple-git passes arguments as array, preventing shell injection
    await this._git.checkout([sha, '--', '.']);
  }

  /**
   * Get commit history with limit
   */
  async getCommitHistory(limit: number = 50): Promise<CommitInfo[]> {
    const log = await this._git.log({ maxCount: limit });
    return log.all.map(commit => ({
      id: `commit-${commit.date}`,
      sha: commit.hash,
      message: commit.message,
      timestamp: commit.date
    }));
  }
}
