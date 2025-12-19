import React, { useEffect } from 'react';
import { useVSCodeMessaging, useVSCodeSender } from './hooks/useVSCodeMessaging';
import { useChatStore } from './stores/chatStore';
import { useSettingsStore } from './stores/settingsStore';

export default function App() {
  useVSCodeMessaging();
  const { requestReady } = useVSCodeSender();

  const { chatName, isProcessing, messages } = useChatStore();
  const { planMode, thinkingMode, selectedModel } = useSettingsStore();

  useEffect(() => {
    requestReady();
  }, []);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Header - placeholder for HeaderBar organism */}
      <header className="flex items-center justify-between border-b border-border px-4 py-2">
        <h1 className="text-lg font-semibold">{chatName}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{selectedModel}</span>
          {planMode && (
            <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">Plan</span>
          )}
          {thinkingMode && (
            <span className="rounded bg-accent px-2 py-0.5 text-xs">Think</span>
          )}
        </div>
      </header>

      {/* Messages area - placeholder for MessageList organism */}
      <main className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Start a conversation with Claude</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-3 ${
                  msg.type === 'user'
                    ? 'ml-auto max-w-[80%] bg-primary text-primary-foreground'
                    : msg.type === 'error'
                      ? 'bg-destructive/20 text-destructive-foreground'
                      : msg.type === 'thinking'
                        ? 'bg-muted/50 italic text-muted-foreground'
                        : 'bg-card text-card-foreground'
                }`}
              >
                {msg.toolName && (
                  <div className="mb-1 text-xs font-medium opacity-70">{msg.toolName}</div>
                )}
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Input area - placeholder for ChatInput organism */}
      <footer className="border-t border-border p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={isProcessing ? 'Processing...' : 'Type a message...'}
            disabled={isProcessing}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            disabled={isProcessing}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isProcessing ? 'Stop' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  );
}
