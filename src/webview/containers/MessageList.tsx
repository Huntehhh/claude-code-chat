'use client';

import * as React from 'react';
import { useChatStore, type Message } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { MessageBlock, type MessageType, type ToolResult } from '../components/organisms/message-block';
import { ToolUseBlock } from '../components/molecules/tool-use-block';
import { PermissionCard } from '../components/molecules/permission-card';
import { WelcomeState } from '../components/molecules/welcome-state';
import { TodoList, type TodoItem as TodoListItem, type TodoStatus } from '../components/molecules/todo-list';
import { Badge } from '../components/ui/badge';
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
    const { messages, pendingPermissions, scrollPosition, setScrollPosition, hasMoreMessages, isLoadingMore } = useChatStore();
    const { compactToolOutput } = useSettingsStore();
    const { respondToPermission, saveScrollPosition, openFile, loadMoreMessages } = useVSCodeSender();
    const isRestoringScroll = React.useRef(false);
    const lastMessageCount = React.useRef(messages.length);
    const prevScrollHeightRef = React.useRef<number>(0);
    const wasLoadingMoreRef = React.useRef(false);

    // Debounced scroll position save (500ms delay to avoid excessive saves)
    const debouncedSaveScroll = useDebounce(saveScrollPosition, 500);

    // Track scroll height before loading more messages (for prepend position preservation)
    React.useEffect(() => {
      if (isLoadingMore && !wasLoadingMoreRef.current) {
        // Just started loading more - save current scroll height
        const container = containerRef.current;
        if (container) {
          prevScrollHeightRef.current = container.scrollHeight;
        }
      }
      wasLoadingMoreRef.current = isLoadingMore;
    }, [isLoadingMore]);

    // Handle scroll events - track position and trigger infinite scroll
    const handleScroll = React.useCallback(() => {
      const container = containerRef.current;
      if (container && !isRestoringScroll.current) {
        const position = container.scrollTop;
        setScrollPosition(position);
        debouncedSaveScroll(position);

        // Infinite scroll: Load more when near top (within 100px)
        if (position < 100 && hasMoreMessages && !isLoadingMore) {
          console.log('[Infinite Scroll] Loading more messages...');
          loadMoreMessages();
        }
      }
    }, [setScrollPosition, debouncedSaveScroll, hasMoreMessages, isLoadingMore, loadMoreMessages]);

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

    // Handle message count changes - scroll to bottom for NEW messages, preserve position for prepended
    React.useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const messageCountDiff = messages.length - lastMessageCount.current;

      if (messageCountDiff > 0) {
        // More messages now than before
        if (prevScrollHeightRef.current > 0) {
          // Messages were prepended (loaded older messages)
          // Adjust scroll position to maintain view of the same content
          isRestoringScroll.current = true;
          const heightDiff = container.scrollHeight - prevScrollHeightRef.current;
          container.scrollTo({ top: heightDiff, behavior: 'instant' });
          prevScrollHeightRef.current = 0; // Reset
          setTimeout(() => {
            isRestoringScroll.current = false;
          }, 100);
        } else {
          // Messages were appended (new messages arrived at bottom)
          // Scroll to bottom to show new content
          isRestoringScroll.current = true;
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth',
          });
          setTimeout(() => {
            isRestoringScroll.current = false;
          }, 500);
        }
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
          'flex flex-col gap-4 overflow-y-auto overflow-x-hidden',
          'px-4 py-6',
          'scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent',
          className
        )}
        {...props}
      >
        {/* Loading indicator at top for infinite scroll */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4 text-[#8b8b94] text-sm">
            <span className="animate-pulse">Loading older messages...</span>
          </div>
        )}
        {hasMoreMessages && !isLoadingMore && (
          <div className="flex items-center justify-center py-2 text-[#52525b] text-xs">
            <span>Scroll up for older messages</span>
          </div>
        )}
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
            // Special handling for TodoWrite - render as a proper todo list
            if (msg.toolName === 'TodoWrite' && msg.toolInput) {
              const rawTodos = (msg.toolInput as Record<string, unknown>).todos;
              if (Array.isArray(rawTodos) && rawTodos.length > 0) {
                const todoItems: TodoListItem[] = rawTodos.map((t, i) => ({
                  id: `todo-${idx}-${i}`,
                  content: (t as { content?: string; activeForm?: string }).activeForm ||
                           (t as { content?: string }).content || String(t),
                  status: ((t as { status?: string }).status || 'pending') as TodoStatus,
                }));
                const pendingCount = todoItems.filter((t) => t.status !== 'completed').length;
                return (
                  <div key={`todowrite-${idx}-${msg.timestamp}`} className="flex gap-3 animate-fade-in ml-2">
                    <div className="flex flex-col gap-1 pt-0.5 w-full min-w-0">
                      {/* Header label with count */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#FFA344] select-none">•</span>
                        <span className="material-symbols-outlined text-[#8b8b94] !text-[16px]">assignment</span>
                        <span className="text-[14px] font-medium text-[#fafafa]">Update Todos</span>
                        <Badge variant="chat" className="min-w-[20px] text-center">
                          {pendingCount}
                        </Badge>
                      </div>
                      <TodoList
                        items={todoItems}
                        defaultOpen={true}
                        className="ml-6"
                      />
                    </div>
                  </div>
                );
              }
            }

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
                onOpenFile={openFile}
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
