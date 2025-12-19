'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { ConversationItem, type ConversationItemProps, type Checkpoint } from '../molecules/conversation-item';

export interface Conversation {
  id: string;
  title: string;
  source: 'chat' | 'cli';
  timestamp: string;
  messageCount: number;
  preview: string;
  checkpoints?: Checkpoint[];
}

export interface HistoryPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string;
  onSelectConversation?: (conversation: Conversation) => void;
  onRestoreCheckpoint?: (conversation: Conversation, checkpoint: Checkpoint) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const HistoryPanel = React.forwardRef<HTMLDivElement, HistoryPanelProps>(
  (
    {
      className,
      open = false,
      onClose,
      conversations = [],
      activeConversationId,
      onSelectConversation,
      onRestoreCheckpoint,
      searchValue = '',
      onSearchChange,
      ...props
    },
    ref
  ) => {
    // Filter conversations based on search
    const filteredConversations = React.useMemo(() => {
      if (!searchValue) return conversations;
      const lower = searchValue.toLowerCase();
      return conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(lower) ||
          c.preview.toLowerCase().includes(lower)
      );
    }, [conversations, searchValue]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div
          ref={ref}
          className={cn(
            'animate-slide-in flex flex-col w-[320px] h-full bg-[#0f0f0f]',
            'border-l border-[#222225]',
            'shadow-[-4px_0_16px_rgba(0,0,0,0.3),inset_1px_0_0_0_rgba(255,255,255,0.03)]',
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-[#222225]">
            <h2 className="text-[16px] font-semibold text-white tracking-tight">
              History
            </h2>
            <button
              type="button"
              className="flex items-center justify-center size-8 rounded hover:bg-[#171717] text-[#8b8b94] transition-colors cursor-pointer group"
              onClick={onClose}
            >
              <Icon
                name="close"
                size="sm"
                className="group-hover:text-white transition-colors"
              />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-3 shrink-0">
            <div className="flex items-center w-full h-9 bg-[#171717] rounded border border-[#222225] focus-within:border-[#FFA344]/50 focus-within:ring-1 focus-within:ring-[#FFA344]/20 transition-all">
              <Icon name="search" className="text-[#8b8b94] pl-2.5 !text-[18px]" />
              <input
                className="w-full bg-transparent border-none text-[13px] text-white placeholder-[#52525b] focus:ring-0 h-full py-1 pl-2 pr-3"
                placeholder="Search conversations..."
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <Icon name="history" className="text-[#52525b] !text-[32px] mb-2" />
                <p className="text-[13px] text-[#52525b]">
                  {searchValue ? 'No conversations found' : 'No conversation history'}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  title={conversation.title}
                  source={conversation.source}
                  timestamp={conversation.timestamp}
                  messageCount={conversation.messageCount}
                  preview={conversation.preview}
                  checkpoints={conversation.checkpoints}
                  isActive={conversation.id === activeConversationId}
                  onSelect={() => onSelectConversation?.(conversation)}
                  onRestoreCheckpoint={(checkpoint) =>
                    onRestoreCheckpoint?.(conversation, checkpoint)
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }
);
HistoryPanel.displayName = 'HistoryPanel';

export { HistoryPanel };
