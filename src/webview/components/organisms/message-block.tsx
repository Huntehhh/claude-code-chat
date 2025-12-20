'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { FileMention } from '../ui/file-mention';
import { CodeInline } from '../ui/code-inline';
import { CollapsibleCard } from '../molecules/collapsible-card';
import { MarkdownRenderer } from '../../lib/markdown';
import { useUIStore } from '../../stores/uiStore';

export type MessageType = 'user' | 'assistant' | 'thinking' | 'tool' | 'error';

export interface ToolResult {
  icon: string;
  name: string;
  command?: string;
  output?: string;
  error?: boolean;
}

export interface MessageBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  type: MessageType;
  content: string;
  toolResult?: ToolResult;
  fileMentions?: string[];
  imageUrl?: string;
  showThinking?: boolean;
  thinkingContent?: string;
}

const MessageBlock = React.forwardRef<HTMLDivElement, MessageBlockProps>(
  ({
    className,
    type,
    content,
    toolResult,
    fileMentions = [],
    imageUrl,
    showThinking = false,
    thinkingContent,
    ...props
  }, ref) => {
    const { openLightbox } = useUIStore();

    // User message
    if (type === 'user') {
      return (
        <div
          ref={ref}
          className={cn('group flex flex-col gap-2 animate-fade-in', className)}
          {...props}
        >
          <div className="text-[14px] text-[#fafafa] leading-relaxed bg-black/20 -mx-2 px-2 py-1 rounded">
            {/* Render content with file mentions */}
            {content}
            {fileMentions.map((path, i) => (
              <FileMention key={i} path={path} className="ml-1" />
            ))}
          </div>
          {imageUrl && (
            <div className="relative w-fit mt-1">
              <button
                type="button"
                onClick={() => openLightbox(imageUrl, 'User uploaded image')}
                className="block rounded border border-[#222225] hover:border-[#FFA344]/50 transition-colors cursor-pointer shadow-sm overflow-hidden"
              >
                <img
                  src={imageUrl}
                  alt="User uploaded"
                  className="max-w-[200px] max-h-[150px] object-cover"
                />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Thinking block
    if (type === 'thinking' || showThinking) {
      return (
        <div ref={ref} className={cn('animate-fade-in', className)} {...props}>
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer select-none text-[#8b8b94] hover:text-[#fafafa] transition-colors w-fit py-1">
              <span className="text-xs font-medium">Thinking</span>
              <Icon
                name="expand_more"
                size="sm"
                className="transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="pl-3 ml-1 mt-1 border-l-2 border-[#222225] text-sm italic text-[#8b8b94]">
              {thinkingContent || content}
            </div>
          </details>
        </div>
      );
    }

    // Tool result
    if (type === 'tool' && toolResult) {
      return (
        <div ref={ref} className={cn('animate-fade-in', className)} {...props}>
          <CollapsibleCard
            icon={toolResult.icon}
            title={toolResult.name}
            subtitle={toolResult.command}
            variant="tool"
          >
            <div className="p-3 font-mono text-xs bg-[#09090b]/50">
              <div className="flex gap-4">
                <span className="text-[#52525b] select-none">OUT</span>
                <div
                  className={cn(
                    'whitespace-pre-wrap',
                    toolResult.error ? 'text-[#FF7369]' : 'text-[#8b8b94]'
                  )}
                >
                  {toolResult.output || toolResult.error}
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </div>
      );
    }

    // Error message
    if (type === 'error') {
      return (
        <div
          ref={ref}
          className={cn(
            'animate-fade-in rounded-lg p-3 bg-[#FF7369]/10 border border-[#FF7369]/20',
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-2">
            <Icon name="error" className="text-[#FF7369] shrink-0 mt-0.5" />
            <div className="text-[14px] text-[#FF7369] leading-relaxed">{content}</div>
          </div>
        </div>
      );
    }

    // Assistant message (default)
    return (
      <div
        ref={ref}
        className={cn('flex gap-3 animate-fade-in', className)}
        {...props}
      >
        {/* Accent bar */}
        <div className="shrink-0 w-[2px] self-stretch bg-[#FFA344] rounded-full my-1 ml-0.5" />

        {/* Content */}
        <div className="flex flex-col gap-2 pt-0.5 w-full">
          <div className="flex gap-2">
            <span className="text-[#FFA344] leading-relaxed select-none shrink-0">•</span>
            <div className="text-[15px] text-[#fafafa] leading-relaxed min-w-0 flex-1">
              <MarkdownRenderer content={content} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MessageBlock.displayName = 'MessageBlock';

export { MessageBlock };
