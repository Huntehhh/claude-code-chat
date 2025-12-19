import { create } from 'zustand';

export type ThinkingIntensity = 'think' | 'think-hard' | 'think-harder' | 'ultrathink';

interface SettingsState {
  planMode: boolean;
  thinkingMode: boolean;
  thinkingIntensity: ThinkingIntensity;
  selectedModel: string;
  yoloMode: boolean;
  permissions: Record<string, boolean | string[]>;

  togglePlanMode: () => void;
  toggleThinkingMode: () => void;
  setThinkingIntensity: (intensity: ThinkingIntensity) => void;
  setModel: (model: string) => void;
  setYoloMode: (enabled: boolean) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  planMode: false,
  thinkingMode: true,
  thinkingIntensity: 'think-hard',
  selectedModel: 'Opus',
  yoloMode: false,
  permissions: {},

  togglePlanMode: () => set((s) => ({ planMode: !s.planMode })),
  toggleThinkingMode: () => set((s) => ({ thinkingMode: !s.thinkingMode })),
  setThinkingIntensity: (intensity) => set({ thinkingIntensity: intensity }),
  setModel: (model) => set({ selectedModel: model }),
  setYoloMode: (enabled) => set({ yoloMode: enabled }),
  updateSettings: (settings) => set((s) => ({ ...s, ...settings })),
}));
