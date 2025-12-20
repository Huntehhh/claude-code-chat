import { create } from 'zustand';

export type ModalType =
  | 'settings'
  | 'history'
  | 'mcpServers'
  | 'modelSelector'
  | 'slashCommands'
  | 'filePicker'
  | 'install'
  | 'thinkingIntensity';

interface ToastState {
  message: string;
  visible: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

export interface ThinkingState {
  isActive: boolean;
  isExpanded: boolean;
  content: string;
  startTime: number | null;
}

export interface LightboxState {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
}

interface UIState {
  activeModal: ModalType | null;
  thinking: ThinkingState;
  isThinkingOverlayVisible: boolean;
  toast: ToastState;
  lightbox: LightboxState;
  todoCollapsed: boolean;
  fileSearchTerm: string;
  selectedFileIndex: number;
  slashSearchTerm: string;
  selectedCommandIndex: number;
  historySearchTerm: string;
  isDraggingFile: boolean;
  isInputFocused: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTarget: string | null;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  toggleModal: (modal: ModalType) => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleHistory: () => void;
  openMCPModal: () => void;
  closeMCPModal: () => void;
  startThinking: () => void;
  stopThinking: () => void;
  updateThinkingContent: (content: string) => void;
  toggleThinkingExpanded: () => void;
  setThinkingExpanded: (expanded: boolean) => void;
  showThinkingOverlay: () => void;
  hideThinkingOverlay: () => void;
  toggleTodoPanel: () => void;
  setTodoCollapsed: (collapsed: boolean) => void;
  setFileSearchTerm: (term: string) => void;
  setSelectedFileIndex: (index: number) => void;
  resetFilePicker: () => void;
  setSlashSearchTerm: (term: string) => void;
  setSelectedCommandIndex: (index: number) => void;
  resetSlashPicker: () => void;
  setHistorySearchTerm: (term: string) => void;
  setDraggingFile: (dragging: boolean) => void;
  setFileDropzoneActive: (active: boolean) => void;
  setInputFocused: (focused: boolean) => void;
  showContextMenu: (x: number, y: number, target: string) => void;
  hideContextMenu: () => void;
  showToast: (message: string, duration?: number) => void;
  hideToast: () => void;
  openLightbox: (src: string, alt?: string) => void;
  closeLightbox: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeModal: null,
  thinking: { isActive: false, isExpanded: false, content: '', startTime: null },
  isThinkingOverlayVisible: false,
  todoCollapsed: false,
  toast: { message: '', visible: false, timeoutId: null },
  lightbox: { isOpen: false, imageSrc: '', imageAlt: '' },
  fileSearchTerm: '',
  selectedFileIndex: 0,
  slashSearchTerm: '',
  selectedCommandIndex: 0,
  historySearchTerm: '',
  isDraggingFile: false,
  isInputFocused: false,
  contextMenuPosition: null,
  contextMenuTarget: null,

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleModal: (modal) => set((s) => ({ activeModal: s.activeModal === modal ? null : modal })),
  openSettings: () => set({ activeModal: 'settings' }),
  closeSettings: () => set((s) => s.activeModal === 'settings' ? { activeModal: null } : {}),
  toggleHistory: () => set((s) => ({ activeModal: s.activeModal === 'history' ? null : 'history' })),
  openMCPModal: () => set({ activeModal: 'mcpServers' }),
  closeMCPModal: () => set((s) => s.activeModal === 'mcpServers' ? { activeModal: null } : {}),

  startThinking: () => set({ thinking: { isActive: true, isExpanded: false, content: '', startTime: Date.now() }, isThinkingOverlayVisible: true }),
  stopThinking: () => set((s) => ({ thinking: { ...s.thinking, isActive: false, startTime: null }, isThinkingOverlayVisible: false })),
  updateThinkingContent: (content) => set((s) => ({ thinking: { ...s.thinking, content } })),
  toggleThinkingExpanded: () => set((s) => ({ thinking: { ...s.thinking, isExpanded: !s.thinking.isExpanded } })),
  setThinkingExpanded: (expanded) => set((s) => ({ thinking: { ...s.thinking, isExpanded: expanded } })),
  showThinkingOverlay: () => set({ thinking: { isActive: true, isExpanded: false, content: '', startTime: Date.now() }, isThinkingOverlayVisible: true }),
  hideThinkingOverlay: () => set((s) => ({ thinking: { ...s.thinking, isActive: false, startTime: null }, isThinkingOverlayVisible: false })),

  toggleTodoPanel: () => set((s) => ({ todoCollapsed: !s.todoCollapsed })),
  setTodoCollapsed: (collapsed) => set({ todoCollapsed: collapsed }),
  setFileSearchTerm: (term) => set({ fileSearchTerm: term, selectedFileIndex: 0 }),
  setSelectedFileIndex: (index) => set({ selectedFileIndex: index }),
  resetFilePicker: () => set({ fileSearchTerm: '', selectedFileIndex: 0 }),
  setSlashSearchTerm: (term) => set({ slashSearchTerm: term, selectedCommandIndex: 0 }),
  setSelectedCommandIndex: (index) => set({ selectedCommandIndex: index }),
  resetSlashPicker: () => set({ slashSearchTerm: '', selectedCommandIndex: 0 }),
  setHistorySearchTerm: (term) => set({ historySearchTerm: term }),
  setDraggingFile: (dragging) => set({ isDraggingFile: dragging }),
  setFileDropzoneActive: (active) => set({ isDraggingFile: active }),
  setInputFocused: (focused) => set({ isInputFocused: focused }),
  showContextMenu: (x, y, target) => set({ contextMenuPosition: { x, y }, contextMenuTarget: target }),
  hideContextMenu: () => set({ contextMenuPosition: null, contextMenuTarget: null }),

  showToast: (message, duration = 3000) => {
    const state = get();
    if (state.toast.timeoutId) clearTimeout(state.toast.timeoutId);
    const timeoutId = setTimeout(() => set((s) => ({ toast: { ...s.toast, visible: false, timeoutId: null } })), duration);
    set({ toast: { message, visible: true, timeoutId } });
  },
  hideToast: () => {
    const state = get();
    if (state.toast.timeoutId) clearTimeout(state.toast.timeoutId);
    set({ toast: { message: '', visible: false, timeoutId: null } });
  },
  openLightbox: (src, alt = 'Image preview') => set({ lightbox: { isOpen: true, imageSrc: src, imageAlt: alt } }),
  closeLightbox: () => set({ lightbox: { isOpen: false, imageSrc: '', imageAlt: '' } }),
}));

export const useIsModalOpen = (modal: ModalType) => useUIStore((s) => s.activeModal === modal);
export const useActiveModal = () => useUIStore((s) => s.activeModal);
export const useThinking = () => useUIStore((s) => s.thinking);
export const useIsThinking = () => useUIStore((s) => s.thinking.isActive);
export const useThinkingContent = () => useUIStore((s) => s.thinking.content);
export const useIsThinkingExpanded = () => useUIStore((s) => s.thinking.isExpanded);
export const useIsSettingsOpen = () => useUIStore((s) => s.activeModal === 'settings');
export const useIsHistoryOpen = () => useUIStore((s) => s.activeModal === 'history');
export const useIsMCPModalOpen = () => useUIStore((s) => s.activeModal === 'mcpServers');
export const useIsFilePickerOpen = () => useUIStore((s) => s.activeModal === 'filePicker');
export const useIsSlashCommandsOpen = () => useUIStore((s) => s.activeModal === 'slashCommands');
export const useIsModelSelectorOpen = () => useUIStore((s) => s.activeModal === 'modelSelector');
export const useIsInstallModalOpen = () => useUIStore((s) => s.activeModal === 'install');
export const useIsThinkingIntensityOpen = () => useUIStore((s) => s.activeModal === 'thinkingIntensity');
export const useLightbox = () => useUIStore((s) => s.lightbox);
