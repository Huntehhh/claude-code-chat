import { create } from 'zustand';

interface UIState {
  isSettingsOpen: boolean;
  isHistoryOpen: boolean;
  isMCPModalOpen: boolean;
  todoCollapsed: boolean;
  isFileDropzoneActive: boolean;

  openSettings: () => void;
  closeSettings: () => void;
  toggleHistory: () => void;
  openMCPModal: () => void;
  closeMCPModal: () => void;
  toggleTodoPanel: () => void;
  setFileDropzoneActive: (active: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSettingsOpen: false,
  isHistoryOpen: false,
  isMCPModalOpen: false,
  todoCollapsed: false,
  isFileDropzoneActive: false,

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleHistory: () => set((s) => ({ isHistoryOpen: !s.isHistoryOpen })),
  openMCPModal: () => set({ isMCPModalOpen: true }),
  closeMCPModal: () => set({ isMCPModalOpen: false }),
  toggleTodoPanel: () => set((s) => ({ todoCollapsed: !s.todoCollapsed })),
  setFileDropzoneActive: (active) => set({ isFileDropzoneActive: active }),
}));
