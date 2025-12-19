import { create } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export type ModalType =
  | 'settings'
  | 'history'
  | 'mcpServers'
  | 'modelSelector'
  | 'slashCommands'
  | 'filePicker'
  | 'install'
  | 'thinkingIntensity';

// =============================================================================
// Store Interface
// =============================================================================

interface UIState {
  // Modal states - single active modal pattern
  activeModal: ModalType | null;

  // Thinking overlay (not a modal, full-screen overlay)
  isThinkingOverlayVisible: boolean;

  // Todo panel
  todoCollapsed: boolean;

  // File picker state
  fileSearchTerm: string;
  selectedFileIndex: number;

  // Slash command picker state
  slashSearchTerm: string;
  selectedCommandIndex: number;

  // History panel state
  historySearchTerm: string;

  // Drag and drop state
  isDraggingFile: boolean;

  // Input focus state
  isInputFocused: boolean;

  // Context menu state
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTarget: string | null;

  // =========================================================================
  // Actions
  // =========================================================================

  // Modal control
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  toggleModal: (modal: ModalType) => void;

  // Legacy modal methods (for backwards compatibility)
  openSettings: () => void;
  closeSettings: () => void;
  toggleHistory: () => void;
  openMCPModal: () => void;
  closeMCPModal: () => void;

  // Thinking overlay
  showThinkingOverlay: () => void;
  hideThinkingOverlay: () => void;

  // Todo panel
  toggleTodoPanel: () => void;
  setTodoCollapsed: (collapsed: boolean) => void;

  // File picker
  setFileSearchTerm: (term: string) => void;
  setSelectedFileIndex: (index: number) => void;
  resetFilePicker: () => void;

  // Slash commands
  setSlashSearchTerm: (term: string) => void;
  setSelectedCommandIndex: (index: number) => void;
  resetSlashPicker: () => void;

  // History
  setHistorySearchTerm: (term: string) => void;

  // Drag and drop
  setDraggingFile: (dragging: boolean) => void;
  setFileDropzoneActive: (active: boolean) => void; // Legacy alias

  // Input focus
  setInputFocused: (focused: boolean) => void;

  // Context menu
  showContextMenu: (x: number, y: number, target: string) => void;
  hideContextMenu: () => void;
}

// =============================================================================
// Store Implementation
// =============================================================================

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  activeModal: null,
  isThinkingOverlayVisible: false,
  todoCollapsed: false,

  // File picker state
  fileSearchTerm: '',
  selectedFileIndex: 0,

  // Slash commands state
  slashSearchTerm: '',
  selectedCommandIndex: 0,

  // History state
  historySearchTerm: '',

  // Drag and drop
  isDraggingFile: false,

  // Input focus
  isInputFocused: false,

  // Context menu
  contextMenuPosition: null,
  contextMenuTarget: null,

  // =========================================================================
  // Action implementations
  // =========================================================================

  // Modal control
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleModal: (modal) => set((s) => ({
    activeModal: s.activeModal === modal ? null : modal,
  })),

  // Legacy modal methods
  openSettings: () => set({ activeModal: 'settings' }),
  closeSettings: () => set((s) => s.activeModal === 'settings' ? { activeModal: null } : {}),
  toggleHistory: () => set((s) => ({
    activeModal: s.activeModal === 'history' ? null : 'history',
  })),
  openMCPModal: () => set({ activeModal: 'mcpServers' }),
  closeMCPModal: () => set((s) => s.activeModal === 'mcpServers' ? { activeModal: null } : {}),

  // Thinking overlay
  showThinkingOverlay: () => set({ isThinkingOverlayVisible: true }),
  hideThinkingOverlay: () => set({ isThinkingOverlayVisible: false }),

  // Todo panel
  toggleTodoPanel: () => set((s) => ({ todoCollapsed: !s.todoCollapsed })),
  setTodoCollapsed: (collapsed) => set({ todoCollapsed: collapsed }),

  // File picker
  setFileSearchTerm: (term) => set({ fileSearchTerm: term, selectedFileIndex: 0 }),
  setSelectedFileIndex: (index) => set({ selectedFileIndex: index }),
  resetFilePicker: () => set({ fileSearchTerm: '', selectedFileIndex: 0 }),

  // Slash commands
  setSlashSearchTerm: (term) => set({ slashSearchTerm: term, selectedCommandIndex: 0 }),
  setSelectedCommandIndex: (index) => set({ selectedCommandIndex: index }),
  resetSlashPicker: () => set({ slashSearchTerm: '', selectedCommandIndex: 0 }),

  // History
  setHistorySearchTerm: (term) => set({ historySearchTerm: term }),

  // Drag and drop
  setDraggingFile: (dragging) => set({ isDraggingFile: dragging }),
  setFileDropzoneActive: (active) => set({ isDraggingFile: active }), // Legacy alias

  // Input focus
  setInputFocused: (focused) => set({ isInputFocused: focused }),

  // Context menu
  showContextMenu: (x, y, target) => set({
    contextMenuPosition: { x, y },
    contextMenuTarget: target,
  }),
  hideContextMenu: () => set({
    contextMenuPosition: null,
    contextMenuTarget: null,
  }),
}));

// =============================================================================
// Selector Hooks (for convenience)
// =============================================================================

export const useIsModalOpen = (modal: ModalType) => {
  return useUIStore((state) => state.activeModal === modal);
};

export const useActiveModal = () => {
  return useUIStore((state) => state.activeModal);
};

// Legacy selectors for backwards compatibility
export const useIsSettingsOpen = () => useUIStore((s) => s.activeModal === 'settings');
export const useIsHistoryOpen = () => useUIStore((s) => s.activeModal === 'history');
export const useIsMCPModalOpen = () => useUIStore((s) => s.activeModal === 'mcpServers');
export const useIsFilePickerOpen = () => useUIStore((s) => s.activeModal === 'filePicker');
export const useIsSlashCommandsOpen = () => useUIStore((s) => s.activeModal === 'slashCommands');
export const useIsModelSelectorOpen = () => useUIStore((s) => s.activeModal === 'modelSelector');
export const useIsInstallModalOpen = () => useUIStore((s) => s.activeModal === 'install');
export const useIsThinkingIntensityOpen = () => useUIStore((s) => s.activeModal === 'thinkingIntensity');
