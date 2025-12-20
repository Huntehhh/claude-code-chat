/**
 * PanelManager - Centralized panel state management
 *
 * Extracts panel-specific state from ClaudeChatProvider to improve
 * separation of concerns and reduce state leakage.
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';

/**
 * Configuration for a Claude process
 */
export interface PanelProcessConfig {
  model: string;
  yoloMode: boolean;
  mcpConfigPath: string | undefined;
  wslEnabled: boolean;
  wslDistro: string;
  planMode: boolean;
  thinkingMode: boolean;
}

/**
 * State for an individual panel
 */
export interface PanelState {
  panel: vscode.WebviewPanel;
  sessionId: string | undefined;
  chatName: string;
  conversation: Array<{ timestamp: string; messageType: string; data: unknown }>;
  conversationStartTime: string | undefined;
  totalCost: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  requestCount: number;
  draftMessage: string;
  scrollPosition: number;
  isProcessing: boolean;
  pendingPermissionRequests: Map<string, {
    requestId: string;
    toolName: string;
    input: Record<string, unknown>;
    suggestions?: unknown[];
    toolUseId: string;
  }>;
}

/**
 * Process info for a panel
 */
export interface PanelProcessInfo {
  process: cp.ChildProcess;
  config: PanelProcessConfig;
  rawOutput: string;
  abortController: AbortController;
}

export interface PanelManagerCallbacks {
  onPanelDisposed: (panelId: string) => void;
  onPanelFocused: (panelId: string) => void;
}

export class PanelManager {
  private _panels = new Map<string, PanelState>();
  private _panelProcesses = new Map<string, PanelProcessInfo>();
  private _activePanelId: string | undefined;
  private _panelCounter = 0;
  private _callbacks: PanelManagerCallbacks;

  constructor(callbacks: PanelManagerCallbacks) {
    this._callbacks = callbacks;
  }

  /**
   * Generate a unique panel ID
   */
  generatePanelId(): string {
    this._panelCounter++;
    return `panel-${Date.now()}-${this._panelCounter}`;
  }

  /**
   * Create initial state for a new panel
   */
  createPanelState(panel: vscode.WebviewPanel): PanelState {
    return {
      panel,
      sessionId: undefined,
      chatName: 'Claude Code Chat',
      conversation: [],
      conversationStartTime: undefined,
      totalCost: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      requestCount: 0,
      draftMessage: '',
      scrollPosition: 0,
      isProcessing: false,
      pendingPermissionRequests: new Map(),
    };
  }

  /**
   * Register a new panel
   */
  registerPanel(panelId: string, state: PanelState): void {
    this._panels.set(panelId, state);

    // Set up panel event handlers
    state.panel.onDidChangeViewState((e) => {
      if (e.webviewPanel.active) {
        this._activePanelId = panelId;
        this._callbacks.onPanelFocused(panelId);
      }
    });

    state.panel.onDidDispose(() => {
      this._panels.delete(panelId);
      this._panelProcesses.delete(panelId);
      if (this._activePanelId === panelId) {
        this._activePanelId = undefined;
      }
      this._callbacks.onPanelDisposed(panelId);
    });
  }

  /**
   * Get panel state by ID
   */
  getPanel(panelId: string): PanelState | undefined {
    return this._panels.get(panelId);
  }

  /**
   * Get the active panel ID
   */
  getActivePanelId(): string | undefined {
    return this._activePanelId;
  }

  /**
   * Set the active panel
   */
  setActivePanelId(panelId: string | undefined): void {
    this._activePanelId = panelId;
  }

  /**
   * Get all panels
   */
  getAllPanels(): Map<string, PanelState> {
    return this._panels;
  }

  /**
   * Get panel count
   */
  getPanelCount(): number {
    return this._panels.size;
  }

  /**
   * Check if a panel exists
   */
  hasPanel(panelId: string): boolean {
    return this._panels.has(panelId);
  }

  /**
   * Update panel state
   */
  updatePanel(panelId: string, updates: Partial<PanelState>): boolean {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return false;
    }

    Object.assign(panel, updates);
    return true;
  }

  /**
   * Register process info for a panel
   */
  setProcessInfo(panelId: string, processInfo: PanelProcessInfo): void {
    this._panelProcesses.set(panelId, processInfo);
  }

  /**
   * Get process info for a panel
   */
  getProcessInfo(panelId: string): PanelProcessInfo | undefined {
    return this._panelProcesses.get(panelId);
  }

  /**
   * Remove process info for a panel
   */
  removeProcessInfo(panelId: string): boolean {
    return this._panelProcesses.delete(panelId);
  }

  /**
   * Clean up a specific panel's resources
   */
  async disposePanel(panelId: string): Promise<void> {
    const processInfo = this._panelProcesses.get(panelId);
    if (processInfo) {
      // Abort the process
      processInfo.abortController.abort();

      // Kill the process if still running
      if (processInfo.process && !processInfo.process.killed) {
        processInfo.process.kill();
      }

      this._panelProcesses.delete(panelId);
    }

    const panelState = this._panels.get(panelId);
    if (panelState) {
      panelState.panel.dispose();
      this._panels.delete(panelId);
    }

    if (this._activePanelId === panelId) {
      this._activePanelId = undefined;
    }
  }

  /**
   * Dispose all panels
   */
  async disposeAll(): Promise<void> {
    const panelIds = Array.from(this._panels.keys());
    for (const panelId of panelIds) {
      await this.disposePanel(panelId);
    }
  }

  /**
   * Add a pending permission request to a panel
   */
  addPendingPermission(
    panelId: string,
    request: {
      requestId: string;
      toolName: string;
      input: Record<string, unknown>;
      suggestions?: unknown[];
      toolUseId: string;
    }
  ): boolean {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return false;
    }
    panel.pendingPermissionRequests.set(request.requestId, request);
    return true;
  }

  /**
   * Get and remove a pending permission request
   */
  consumePendingPermission(
    panelId: string,
    requestId: string
  ): { requestId: string; toolName: string; input: Record<string, unknown>; suggestions?: unknown[]; toolUseId: string } | undefined {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return undefined;
    }
    const request = panel.pendingPermissionRequests.get(requestId);
    if (request) {
      panel.pendingPermissionRequests.delete(requestId);
    }
    return request;
  }

  /**
   * Add a message to a panel's conversation
   */
  addConversationMessage(
    panelId: string,
    message: { timestamp: string; messageType: string; data: unknown }
  ): boolean {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return false;
    }
    panel.conversation.push(message);
    return true;
  }

  /**
   * Clear a panel's conversation
   */
  clearConversation(panelId: string): boolean {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return false;
    }
    panel.conversation = [];
    panel.conversationStartTime = undefined;
    panel.totalCost = 0;
    panel.totalTokensInput = 0;
    panel.totalTokensOutput = 0;
    panel.requestCount = 0;
    return true;
  }

  /**
   * Update token counts for a panel
   */
  updateTokens(
    panelId: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ): boolean {
    const panel = this._panels.get(panelId);
    if (!panel) {
      return false;
    }
    panel.totalTokensInput += inputTokens;
    panel.totalTokensOutput += outputTokens;
    panel.totalCost += cost;
    panel.requestCount++;
    return true;
  }
}
