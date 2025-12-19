'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';

/**
 * Format ISO timestamp to readable format
 * Converts "2025-12-18T16:42:13.628Z" to "2025-12-18 16:42:13"
 */
function formatTimestamp(timestamp: string): string {
  try {
    // Remove milliseconds and Z, replace T with space
    return timestamp
      .replace(/\.\d+Z?$/, '') // Remove .628Z or .628
      .replace(/Z$/, '')       // Remove trailing Z if no milliseconds
      .replace('T', ' ');      // Replace T with space
  } catch {
    return timestamp;
  }
}

export type ConversationSource = 'chat' | 'cli';

export interface Checkpoint {
  id: string;
  sha: string;
  message: string;
  timestamp: string;
}

export interface ConversationItemProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  source: ConversationSource;
  timestamp: string;
  messageCount: number;
  preview: string;
  checkpoints?: Checkpoint[];
  isActive?: boolean;
  onSelect?: () => void;
  onRestoreCheckpoint?: (checkpoint: Checkpoint) => void;
}

const ConversationItem = React.forwardRef<HTMLDivElement, ConversationItemProps>(
  (
    {
      className,
      title,
      source,
      timestamp,
      messageCount,
      preview,
      checkpoints = [],
      isActive = false,
      onSelect,
      onRestoreCheckpoint,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col border-l-2',
          isActive ? 'border-[#FFA344] bg-[#171717]/50' : 'border-transparent',
          className
        )}
        {...props}
      >
        {/* Main Conversation Row */}
        <div
          className="group/item relative px-3 py-3 hover:bg-[#171717] cursor-pointer transition-colors border-t border-[#222225]/30 first:border-t-0"
          onClick={onSelect}
        >
          {/* Title */}
          <div className="flex justify-between items-start mb-1.5">
            <h3
              className={cn(
                'text-[14px] font-medium truncate pr-2 transition-colors',
                isActive ? 'text-white' : 'text-gray-200 group-hover/item:text-white'
              )}
            >
              {title}
            </h3>
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {/* Source Badge */}
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border',
                source === 'chat'
                  ? 'bg-[#FFA344]/15 text-[#FFA344] border-[#FFA344]/20'
                  : 'bg-[#9A6DD7]/15 text-[#9A6DD7] border-[#9A6DD7]/20'
              )}
            >
              {source === 'chat' ? 'Chat' : 'CLI'}
            </span>

            <span className="text-[11px] text-[#8b8b94]">{formatTimestamp(timestamp)}</span>
            <span className="text-[11px] text-[#8b8b94]">•</span>
            <span className="flex items-center gap-0.5 text-[11px] text-[#8b8b94]">
              <Icon
                name={source === 'chat' ? 'chat_bubble_outline' : 'terminal'}
                className="!text-[12px]"
              />
              {messageCount}
            </span>
          </div>

          {/* Preview */}
          <p className="text-[12px] text-[#8b8b94] line-clamp-2 leading-tight">
            {preview}
          </p>
        </div>

        {/* Checkpoint Browser */}
        <div className={cn(checkpoints.length > 0 ? 'pb-2' : 'pb-0')}>
          <details
            className="group/accordion"
            open={isExpanded}
            onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
          >
            <summary className="flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-[#171717] select-none list-none">
              <div className="flex items-center gap-2">
                <Icon
                  name="chevron_right"
                  className="!text-[16px] text-[#8b8b94] group-open/accordion:rotate-90 transition-transform duration-200"
                />
                <span className="text-[11px] font-medium text-[#8b8b94] uppercase tracking-wider">
                  Checkpoints
                </span>
                <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#27272a] text-[10px] text-[#8b8b94] font-mono">
                  {checkpoints.length}
                </span>
              </div>
            </summary>

            {/* Checkpoint List */}
            <div className="flex flex-col mt-1">
              {checkpoints.length === 0 ? (
                <div className="px-3 pl-[34px] py-1">
                  <span className="text-[11px] text-[#52525b] italic">
                    No checkpoints yet
                  </span>
                </div>
              ) : (
                checkpoints.map((checkpoint) => (
                  <div
                    key={checkpoint.id}
                    className="group/checkpoint relative flex items-center gap-3 py-1.5 px-3 pl-[34px] hover:bg-[#171717] cursor-pointer"
                  >
                    <span className="font-mono text-[11px] text-[#8b8b94]">
                      {checkpoint.sha}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="text-[12px] text-gray-300 truncate">
                        {checkpoint.message}
                      </span>
                      <span className="text-[10px] text-[#52525b]">
                        {formatTimestamp(checkpoint.timestamp)}
                      </span>
                    </div>
                    {/* Restore Button */}
                    <button
                      type="button"
                      className="opacity-0 group-hover/checkpoint:opacity-100 absolute right-2 bg-[#FFA344]/10 hover:bg-[#FFA344]/20 text-[#FFA344] text-[10px] font-medium px-2 py-0.5 rounded border border-[#FFA344]/20 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestoreCheckpoint?.(checkpoint);
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }
);
ConversationItem.displayName = 'ConversationItem';

export { ConversationItem };
