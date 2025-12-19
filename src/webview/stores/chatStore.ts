import { create } from 'zustand';

export interface Message {
  type: 'user' | 'claude' | 'tool-use' | 'tool-result' | 'permission' | 'error' | 'thinking';
  content: string;
  timestamp: number;
  toolName?: string;
  permissionId?: string;
  isError?: boolean;
}

interface ChatState {
  messages: Message[];
  isProcessing: boolean;
  sessionId: string | null;
  chatName: string;
  totalTokensInput: number;
  totalTokensOutput: number;

  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setProcessing: (processing: boolean) => void;
  updateTokens: (input: number, output: number) => void;
  setChatName: (name: string) => void;
  setSessionId: (id: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isProcessing: false,
  sessionId: null,
  chatName: 'Claude Code Chat',
  totalTokensInput: 0,
  totalTokensOutput: 0,

  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  clearMessages: () => set({ messages: [], totalTokensInput: 0, totalTokensOutput: 0 }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  updateTokens: (input, output) =>
    set((s) => ({
      totalTokensInput: s.totalTokensInput + input,
      totalTokensOutput: s.totalTokensOutput + output,
    })),
  setChatName: (name) => set({ chatName: name }),
  setSessionId: (id) => set({ sessionId: id }),
}));
