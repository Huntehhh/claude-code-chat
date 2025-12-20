/**
 * McpService - MCP Server Configuration Management
 *
 * Manages Model Context Protocol (MCP) server configurations.
 * Handles loading, saving, and deleting MCP server configs from mcp.json.
 *
 * NOTE: The actual implementation logic will be extracted from extension.ts
 * when that file becomes available for refactoring.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

/**
 * MCP Server configuration types
 */
export interface MCPServerConfig {
  /** Server type: stdio for command-line, http/sse for network */
  type: 'stdio' | 'http' | 'sse';
  /** Command to run (for stdio type) */
  command?: string;
  /** Arguments for the command */
  args?: string[];
  /** URL for http/sse types */
  url?: string;
  /** Environment variables */
  env?: Record<string, string>;
}

/**
 * Full MCP configuration file structure
 */
interface MCPConfigFile {
  mcpServers?: Record<string, MCPServerConfig>;
}

/**
 * Callbacks for MCP service events
 */
export interface McpServiceCallbacks {
  /** Called when servers are loaded */
  onServersLoaded?: (servers: Record<string, MCPServerConfig>) => void;
  /** Called when a server is saved */
  onServerSaved?: (name: string, config: MCPServerConfig) => void;
  /** Called when a server is deleted */
  onServerDeleted?: (name: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Service for managing MCP server configurations
 */
export class McpService {
  private _configPath: string | undefined;
  private _callbacks: McpServiceCallbacks;
  private _initialized: boolean = false;

  constructor(callbacks: McpServiceCallbacks = {}) {
    this._callbacks = callbacks;
  }

  /**
   * Initialize the service with the config path
   * Should be called once during extension activation
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;

    // Determine MCP config path (typically ~/.claude/mcp.json)
    const claudeDir = path.join(os.homedir(), '.claude');
    this._configPath = path.join(claudeDir, 'mcp.json');

    // Ensure config directory exists
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(claudeDir));
    } catch {
      // Directory may already exist
    }

    // Ensure config file exists with valid JSON
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(this._configPath));
    } catch {
      // File doesn't exist, create empty config
      await this._writeConfig({ mcpServers: {} });
    }

    this._initialized = true;
    console.log('McpService initialized with config path:', this._configPath);
  }

  /**
   * Get the config file path
   */
  getConfigPath(): string | undefined {
    return this._configPath;
  }

  /**
   * Load all configured MCP servers
   * Filters out internal servers
   */
  async loadServers(): Promise<Record<string, MCPServerConfig>> {
    if (!this._configPath) {
      throw new Error('McpService not initialized');
    }

    try {
      const content = await vscode.workspace.fs.readFile(vscode.Uri.file(this._configPath));
      const config: MCPConfigFile = JSON.parse(new TextDecoder().decode(content));

      // Filter out internal servers
      const servers = Object.fromEntries(
        Object.entries(config.mcpServers || {}).filter(
          ([name]) => !name.startsWith('_') && name !== 'internal'
        )
      );

      this._callbacks.onServersLoaded?.(servers);
      return servers;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to load MCP servers:', err.message);
      this._callbacks.onError?.(err);
      return {};
    }
  }

  /**
   * Save an MCP server configuration
   */
  async saveServer(name: string, config: MCPServerConfig): Promise<void> {
    if (!this._configPath) {
      throw new Error('McpService not initialized');
    }

    // Validate server name
    if (!name || name.startsWith('_') || name === 'internal') {
      throw new Error('Invalid server name');
    }

    try {
      const servers = await this.loadServers();
      servers[name] = config;

      await this._writeConfig({ mcpServers: servers });
      this._callbacks.onServerSaved?.(name, config);

      console.log(`Saved MCP server: ${name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to save MCP server:', err.message);
      this._callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Delete an MCP server configuration
   */
  async deleteServer(name: string): Promise<void> {
    if (!this._configPath) {
      throw new Error('McpService not initialized');
    }

    try {
      const servers = await this.loadServers();

      if (!servers[name]) {
        console.warn(`MCP server not found: ${name}`);
        return;
      }

      delete servers[name];
      await this._writeConfig({ mcpServers: servers });
      this._callbacks.onServerDeleted?.(name);

      console.log(`Deleted MCP server: ${name}`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to delete MCP server:', err.message);
      this._callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Check if a server exists
   */
  async hasServer(name: string): Promise<boolean> {
    const servers = await this.loadServers();
    return name in servers;
  }

  /**
   * Get a specific server config
   */
  async getServer(name: string): Promise<MCPServerConfig | undefined> {
    const servers = await this.loadServers();
    return servers[name];
  }

  /**
   * Write the config file with atomic write pattern
   */
  private async _writeConfig(config: MCPConfigFile): Promise<void> {
    if (!this._configPath) return;

    const tempPath = this._configPath + '.tmp';
    const content = JSON.stringify(config, null, 2);

    try {
      // Write to temp file first
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(tempPath),
        new TextEncoder().encode(content)
      );

      // Atomic rename
      await vscode.workspace.fs.rename(
        vscode.Uri.file(tempPath),
        vscode.Uri.file(this._configPath),
        { overwrite: true }
      );
    } catch (error) {
      // Clean up temp file on failure
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(tempPath));
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }
}

/**
 * Singleton instance for global access
 */
let _mcpServiceInstance: McpService | undefined;

/**
 * Get the singleton McpService instance
 */
export function getMcpService(callbacks?: McpServiceCallbacks): McpService {
  if (!_mcpServiceInstance) {
    _mcpServiceInstance = new McpService(callbacks);
  }
  return _mcpServiceInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetMcpService(): void {
  _mcpServiceInstance = undefined;
}
