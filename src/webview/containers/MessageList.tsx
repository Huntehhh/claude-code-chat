'use client';

import * as React from 'react';
import { useChatStore, type Message } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { MessageBlock, type MessageType, type ToolResult } from '../components/organisms/message-block';
import { ToolUseBlock } from '../components/molecules/tool-use-block';
import { PermissionCard } from '../components/molecules/permission-card';
import { WelcomeState } from '../components/molecules/welcome-state';
import { useVSCodeSender } from '../hooks/useVSCodeMessaging';
import { cn } from '../lib/utils';

// Debounce helper for scroll position saving
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  return React.useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Maps internal message type to MessageBlock type
 */
function mapMessageType(type: Message['type']): MessageType {
  switch (type) {
    case 'user':
      return 'user';
    case 'claude':
      return 'assistant';
    case 'thinking':
      return 'thinking';
    case 'tool-use':
    case 'tool-result':
      return 'tool';
    case 'error':
      return 'error';
    case 'system':
    case 'permission':
    default:
      return 'assistant';
  }
}

/**
 * Extracts tool result data from a message
 */
function getToolResult(msg: Message): ToolResult | undefined {
  if (msg.type !== 'tool-use' && msg.type !== 'tool-result') {
    return undefined;
  }

  // Map tool names to icons
  const toolIcons: Record<string, string> = {
    Read: 'description',
    Write: 'edit_document',
    Edit: 'edit',
    Bash: 'terminal',
    Glob: 'folder_open',
    Grep: 'search',
    Task: 'task',
    WebFetch: 'public',
    WebSearch: 'travel_explore',
    default: 'build',
  };

  const toolName = msg.toolName || 'Unknown Tool';
  const icon = toolIcons[toolName] || toolIcons.default;

  return {
    icon,
    name: toolName,
    command: msg.toolInput ? JSON.stringify(msg.toolInput).slice(0, 100) : undefined,
    output: msg.content,
    error: msg.isError,
  };
}

// =============================================================================
// Component Props
// =============================================================================

export interface MessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show welcome state when empty (default: true) */
  showWelcome?: boolean;
}

// =============================================================================
// MessageList Component
// =============================================================================

const MessageList = React.forwardRef<HTMLDivElement, MessageListProps>(
  ({ className, showWelcome = true, ...props }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { messages, pendingPermissions, scrollPosition, setScrollPosition } = useChatStore();
    const { compactToolOutput } = useSettingsStore();
    const { respondToPermission, saveScrollPosition } = useVSCodeSender();
    const isRestoringScroll = React.useRef(false);
    const lastMessageCount = React.useRef(messages.length);

    // Debounced scroll position save (500ms delay to avoid excessive saves)
    const debouncedSaveScroll = useDebounce(saveScrollPosition, 500);

    // Handle scroll events - track and save position
    const handleScroll = React.useCallback(() => {
      const container = containerRef.current;
      if (container && !isRestoringScroll.current) {
        const position = container.scrollTop;
        setScrollPosition(position);
        debouncedSaveScroll(position);
      }
    }, [setScrollPosition, debouncedSaveScroll]);

    // Restore scroll position when messages are loaded and scrollPosition changes
    React.useEffect(() => {
      const container = containerRef.current;
      if (container && scrollPosition > 0 && messages.length > 0) {
        // Only restore if we haven't already and container can scroll
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0 && container.scrollTop === 0) {
          isRestoringScroll.current = true;
          // Clamp to max scroll in case content changed
          const targetPosition = Math.min(scrollPosition, maxScroll);
          container.scrollTo({ top: targetPosition, behavior: 'instant' });
          // Reset flag after scroll completes
          setTimeout(() => {
            isRestoringScroll.current = false;
          }, 100);
        }
      }
    }, [scrollPosition, messages.length]);

    // Auto-scroll to bottom only when NEW messages arrive (not on initial load)
    React.useEffect(() => {
      const container = containerRef.current;
      if (container && messages.length > lastMessageCount.current) {
        // New message arrived - scroll to bottom
        isRestoringScroll.current = true;
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
        setTimeout(() => {
          isRestoringScroll.current = false;
        }, 500);
      }
      lastMessageCount.current = messages.length;
    }, [messages.length]);

    // Permission handlers
    const handlePermissionApprove = React.useCallback(
      (id: string, alwaysAllow?: boolean) => {
        respondToPermission(id, true, alwaysAllow);
      },
      [respondToPermission]
    );

    const handlePermissionDeny = React.useCallback(
      (id: string) => {
        respondToPermission(id, false);
      },
      [respondToPermission]
    );

    // Empty state
    if (messages.length === 0 && showWelcome) {
      return (
        <div
          ref={ref}
          className={cn(
            'flex h-full items-center justify-center',
            className
          )}
          {...props}
        >
          <WelcomeState
            title="Ready"
            subtitle="Type a message below to start a conversation with Claude"
            icon={
              <span className="text-4xl text-[#FFA344] drop-shadow-[0_0_12px_rgba(255,163,68,0.3)]">
                ✳
              </span>
            }
          />
        </div>
      );
    }

    return (
      <div
        ref={(node) => {
          // Handle both refs
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onScroll={handleScroll}
        className={cn(
          'flex flex-col gap-4 overflow-y-auto',
          'px-4 py-6',
          'scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent',
          className
        )}
        {...props}
      >
        {messages.map((msg, idx) => {
          // Handle permission messages specially
          if (msg.type === 'permission' && msg.permissionId) {
            const permission = pendingPermissions.find(
              (p) => p.id === msg.permissionId
            );
            const isPending = permission?.status === 'pending';
            const state = permission?.status === 'approved'
              ? 'approved'
              : permission?.status === 'denied'
              ? 'denied'
              : 'pending';

            return (
              <PermissionCard
                key={`permission-${msg.permissionId}-${idx}`}
                tool={msg.toolName || 'Permission Required'}
                command={msg.content}
                state={state}
                onAllow={isPending ? () => handlePermissionApprove(msg.permissionId!) : undefined}
                onDeny={isPending ? () => handlePermissionDeny(msg.permissionId!) : undefined}
                onAlwaysAllow={isPending ? () => handlePermissionApprove(msg.permissionId!, true) : undefined}
              />
            );
          }

          // Tool use/result messages - use ToolUseBlock
          if (msg.type === 'tool-use' || msg.type === 'tool-result') {
            return (
              <ToolUseBlock
                key={`tool-${idx}-${msg.timestamp}`}
                toolName={msg.toolName || 'Unknown Tool'}
                input={msg.toolInput || msg.rawInput}
                output={msg.type === 'tool-result' ? msg.content : undefined}
                isError={msg.isError}
                filePath={msg.filePath}
                oldContent={msg.oldContent}
                newContent={msg.newContent}
              />
            );
          }

          // Regular messages
          const messageType = mapMessageType(msg.type);
          const toolResult = getToolResult(msg);

          return (
            <MessageBlock
              key={`msg-${idx}-${msg.timestamp}`}
              type={messageType}
              content={msg.content}
              toolResult={toolResult}
            />
          );
        })}
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';

export { MessageList };
