import { create } from 'zustand';
import type { MCPServerConfig, CustomSnippet } from '../../types/messages';

// =============================================================================
// Types
// =============================================================================

export type ThinkingIntensity = 'think' | 'think-hard' | 'think-harder' | 'ultrathink';

export interface McpServer {
  id: string;
  name: string;
  type: 'stdio' | 'http' | 'sse';
  enabled: boolean;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

// =============================================================================
// Store Interface
// =============================================================================

interface SettingsState {
  // Mode toggles
  planMode: boolean;
  thinkingMode: boolean;
  thinkingIntensity: ThinkingIntensity;

  // Model selection
  selectedModel: string;

  // Permissions
  yoloMode: boolean;
  permissions: Record<string, boolean | string[]>;

  // WSL Configuration (Windows only)
  wslEnabled: boolean;
  wslDistribution: string;
  nodePath: string;
  claudePath: string;

  // Platform info
  platform: string;
  isWindows: boolean;
  wslAlertDismissed: boolean;

  // Display settings
  compactToolOutput: boolean;
  previewHeight: number;
  compactMcpCalls: boolean;
  showTodoList: boolean;

  // MCP Servers
  mcpServers: McpServer[];

  // Custom Snippets
  customSnippets: CustomSnippet[];

  // =========================================================================
  // Actions
  // =========================================================================

  // Mode toggles
  togglePlanMode: () => void;
  toggleThinkingMode: () => void;
  setThinkingIntensity: (intensity: ThinkingIntensity) => void;

  // Model
  setModel: (model: string) => void;

  // Permissions
  setYoloMode: (enabled: boolean) => void;
  setPermissions: (permissions: Record<string, boolean | string[]>) => void;
  addPermission: (toolName: string, command: string | null) => void;
  removePermission: (toolName: string, command: string | null) => void;

  // WSL
  setWslEnabled: (enabled: boolean) => void;
  setWslDistribution: (distro: string) => void;
  setNodePath: (path: string) => void;
  setClaudePath: (path: string) => void;

  // Platform
  setPlatformInfo: (info: { platform: string; isWindows: boolean; wslAlertDismissed: boolean; wslEnabled: boolean }) => void;
  setWslAlertDismissed: (dismissed: boolean) => void;

  // Display
  setCompactToolOutput: (enabled: boolean) => void;
  setPreviewHeight: (height: number) => void;
  setCompactMcpCalls: (enabled: boolean) => void;
  setShowTodoList: (enabled: boolean) => void;

  // MCP Servers
  setMcpServers: (servers: McpServer[]) => void;
  addMcpServer: (server: McpServer) => void;
  updateMcpServer: (id: string, updates: Partial<McpServer>) => void;
  removeMcpServer: (id: string) => void;
  toggleMcpServer: (id: string) => void;

  // Custom Snippets
  setCustomSnippets: (snippets: CustomSnippet[]) => void;
  addCustomSnippet: (snippet: CustomSnippet) => void;
  removeCustomSnippet: (id: string) => void;

  // Bulk update
  updateSettings: (settings: Partial<SettingsState>) => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useSettingsStore = create<SettingsState>((set) => ({
  // Initial state - Mode toggles
  planMode: false,
  thinkingMode: true,
  thinkingIntensity: 'think-hard',

  // Model
  selectedModel: 'Opus',

  // Permissions
  yoloMode: false,
  permissions: {},

  // WSL Configuration
  wslEnabled: false,
  wslDistribution: '',
  nodePath: '',
  claudePath: '',

  // Platform
  platform: '',
  isWindows: false,
  wslAlertDismissed: false,

  // Display settings
  compactToolOutput: true,
  previewHeight: 150,
  compactMcpCalls: true,
  showTodoList: true,

  // MCP Servers
  mcpServers: [],

  // Custom Snippets
  customSnippets: [],

  // =========================================================================
  // Action implementations
  // =========================================================================

  // Mode toggles
  togglePlanMode: () => set((s) => ({ planMode: !s.planMode })),
  toggleThinkingMode: () => set((s) => ({ thinkingMode: !s.thinkingMode })),
  setThinkingIntensity: (intensity) => set({ thinkingIntensity: intensity }),

  // Model
  setModel: (model) => set({ selectedModel: model }),

  // Permissions
  setYoloMode: (enabled) => set({ yoloMode: enabled }),
  setPermissions: (permissions) => set({ permissions }),

  addPermission: (toolName, command) => set((s) => {
    const permissions = { ...s.permissions };
    if (command === null) {
      permissions[toolName] = true;
    } else {
      const current = permissions[toolName];
      if (Array.isArray(current)) {
        if (!current.includes(command)) {
          permissions[toolName] = [...current, command];
        }
      } else {
        permissions[toolName] = [command];
      }
    }
    return { permissions };
  }),

  removePermission: (toolName, command) => set((s) => {
    const permissions = { ...s.permissions };
    if (command === null) {
      delete permissions[toolName];
    } else {
      const current = permissions[toolName];
      if (Array.isArray(current)) {
        permissions[toolName] = current.filter((c) => c !== command);
        if ((permissions[toolName] as string[]).length === 0) {
          delete permissions[toolName];
        }
      }
    }
    return { permissions };
  }),

  // WSL
  setWslEnabled: (enabled) => set({ wslEnabled: enabled }),
  setWslDistribution: (distro) => set({ wslDistribution: distro }),
  setNodePath: (path) => set({ nodePath: path }),
  setClaudePath: (path) => set({ claudePath: path }),

  // Platform
  setPlatformInfo: (info) => set({
    platform: info.platform,
    isWindows: info.isWindows,
    wslAlertDismissed: info.wslAlertDismissed,
    wslEnabled: info.wslEnabled,
  }),
  setWslAlertDismissed: (dismissed) => set({ wslAlertDismissed: dismissed }),

  // Display
  setCompactToolOutput: (enabled) => set({ compactToolOutput: enabled }),
  setPreviewHeight: (height) => set({ previewHeight: height }),
  setCompactMcpCalls: (enabled) => set({ compactMcpCalls: enabled }),
  setShowTodoList: (enabled) => set({ showTodoList: enabled }),

  // MCP Servers
  setMcpServers: (servers) => set({ mcpServers: servers }),

  addMcpServer: (server) => set((s) => ({
    mcpServers: [...s.mcpServers, server],
  })),

  updateMcpServer: (id, updates) => set((s) => ({
    mcpServers: s.mcpServers.map((srv) =>
      srv.id === id ? { ...srv, ...updates } : srv
    ),
  })),

  removeMcpServer: (id) => set((s) => ({
    mcpServers: s.mcpServers.filter((srv) => srv.id !== id),
  })),

  toggleMcpServer: (id) => set((s) => ({
    mcpServers: s.mcpServers.map((srv) =>
      srv.id === id ? { ...srv, enabled: !srv.enabled } : srv
    ),
  })),

  // Custom Snippets
  setCustomSnippets: (snippets) => set({ customSnippets: snippets }),

  addCustomSnippet: (snippet) => set((s) => ({
    customSnippets: [...s.customSnippets, snippet],
  })),

  removeCustomSnippet: (id) => set((s) => ({
    customSnippets: s.customSnippets.filter((sn) => sn.id !== id),
  })),

  // Bulk update
  updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
}));
