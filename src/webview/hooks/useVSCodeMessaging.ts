import { useEffect } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { vscode } from '../lib/vscode';

interface VSCodeMessage {
  type: string;
  data?: unknown;
}

export function useVSCodeMessaging() {
  const { addMessage, setProcessing, updateTokens, clearMessages, setChatName, setSessionId } =
    useChatStore();
  const { updateSettings } = useSettingsStore();

  useEffect(() => {
    const handleMessage = (event: MessageEvent<VSCodeMessage>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'ready': {
          const data = msg.data as {
            chatName?: string;
            selectedModel?: string;
            sessionId?: string;
          };
          setChatName(data.chatName || 'Claude Code Chat');
          if (data.selectedModel) {
            updateSettings({ selectedModel: data.selectedModel });
          }
          if (data.sessionId) {
            setSessionId(data.sessionId);
          }
          break;
        }
        case 'setProcessing': {
          const data = msg.data as { isProcessing: boolean };
          setProcessing(data.isProcessing);
          break;
        }
        case 'userInput': {
          addMessage({ type: 'user', content: msg.data as string, timestamp: Date.now() });
          break;
        }
        case 'output': {
          addMessage({ type: 'claude', content: msg.data as string, timestamp: Date.now() });
          break;
        }
        case 'thinking': {
          addMessage({ type: 'thinking', content: msg.data as string, timestamp: Date.now() });
          break;
        }
        case 'error': {
          addMessage({ type: 'error', content: msg.data as string, timestamp: Date.now() });
          break;
        }
        case 'toolUse': {
          const data = msg.data as { toolName: string; toolInfo: string };
          addMessage({
            type: 'tool-use',
            content: data.toolInfo,
            toolName: data.toolName,
            timestamp: Date.now(),
          });
          break;
        }
        case 'toolResult': {
          const data = msg.data as { toolName: string; result: string; isError?: boolean };
          addMessage({
            type: 'tool-result',
            content: data.result,
            toolName: data.toolName,
            isError: data.isError,
            timestamp: Date.now(),
          });
          break;
        }
        case 'permissionRequest': {
          const data = msg.data as { id: string; tool: string; input: unknown };
          addMessage({
            type: 'permission',
            content: JSON.stringify(data.input),
            permissionId: data.id,
            toolName: data.tool,
            timestamp: Date.now(),
          });
          break;
        }
        case 'updateTokens': {
          const data = msg.data as { currentInputTokens?: number; currentOutputTokens?: number };
          updateTokens(data.currentInputTokens || 0, data.currentOutputTokens || 0);
          break;
        }
        case 'settingsData': {
          updateSettings(msg.data as Record<string, unknown>);
          break;
        }
        case 'newSession': {
          clearMessages();
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addMessage, setProcessing, updateTokens, clearMessages, setChatName, setSessionId, updateSettings]);
}

export const useVSCodeSender = () => ({
  sendMessage: (text: string, planMode: boolean, thinkingMode: boolean) => {
    vscode.postMessage({ type: 'sendMessage', text, planMode, thinkingMode });
  },
  stopProcess: () => vscode.postMessage({ type: 'stopRequest' }),
  newSession: () => vscode.postMessage({ type: 'newSession' }),
  respondToPermission: (id: string, approved: boolean, alwaysAllow?: boolean) => {
    vscode.postMessage({ type: 'permissionResponse', id, approved, alwaysAllow });
  },
  openFile: (filePath: string) => vscode.postMessage({ type: 'openFile', filePath }),
  openDiff: (oldContent: string, newContent: string, filePath: string) => {
    vscode.postMessage({ type: 'openDiff', oldContent, newContent, filePath });
  },
  loadConversation: (filename: string, source?: 'local' | 'claude') => {
    vscode.postMessage({ type: 'loadConversation', filename, source });
  },
  updateSettings: (settings: Record<string, unknown>) =>
    vscode.postMessage({ type: 'updateSettings', settings }),
  requestReady: () => vscode.postMessage({ type: 'ready' }),
});
