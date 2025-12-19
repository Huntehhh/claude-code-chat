'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';

export interface DiffLine {
  type: 'context' | 'add' | 'remove';
  lineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffViewProps extends React.HTMLAttributes<HTMLDivElement> {
  filename: string;
  lines: DiffLine[];
  additions?: number;
  deletions?: number;
  defaultOpen?: boolean;
  onOpenDiff?: () => void;
}

const DiffView = React.forwardRef<HTMLDivElement, DiffViewProps>(
  ({ className, filename, lines, additions = 0, deletions = 0, defaultOpen = true, onOpenDiff, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border border-[#222225] bg-[#0f0f0f] overflow-hidden w-full',
          className
        )}
        {...props}
      >
        <details className="group" open={defaultOpen}>
          {/* Header */}
          <summary className="flex items-center justify-between px-3 py-2.5 bg-[#171717]/30 cursor-pointer hover:bg-[#171717]/60 transition-colors select-none">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Icon name="edit" size="sm" className="text-[#8b8b94]" />
              <span className="text-sm font-semibold text-[#8b8b94]">Edit</span>
              <span className="font-mono text-xs text-[#FFA344] truncate hover:underline cursor-pointer">
                {filename}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-medium text-[#52525b] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                Click to expand
              </span>
              <Icon
                name="expand_more"
                size="sm"
                className="text-[#8b8b94] transition-transform group-open:rotate-180"
              />
            </div>
          </summary>

          <div className="border-t border-[#222225] font-mono text-xs">
            {/* File path bar */}
            <div className="bg-[#09090b] px-3 py-2 border-b border-[#222225] text-[#52525b] flex items-center gap-2 select-none">
              <Icon name="description" size="xs" />
              <span className="hover:text-[#FFA344] transition-colors cursor-pointer">
                {filename}
              </span>
            </div>

            {/* Diff lines */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {lines.map((line, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      line.type === 'add' && 'bg-[rgba(255,163,68,0.1)] text-[#FFA344]',
                      line.type === 'remove' && 'bg-[rgba(255,115,105,0.1)] text-[#FF7369]',
                      line.type === 'context' && 'text-[#52525b] opacity-60'
                    )}
                  >
                    {/* Line number */}
                    <div
                      className={cn(
                        'w-10 text-right pr-3 select-none border-r',
                        line.type === 'add' && 'border-[#FFA344]/20 bg-[#171717] text-[#52525b]',
                        line.type === 'remove' && 'border-[#FF7369]/20 bg-[#171717] text-[#52525b]',
                        line.type === 'context' && 'border-[#222225] bg-[#171717]/30'
                      )}
                    >
                      {line.lineNumber || line.newLineNumber}
                    </div>
                    {/* Content */}
                    <div className="px-4 py-0.5 whitespace-pre select-text">
                      {line.type !== 'context' && (
                        <span className="select-none inline-block w-3 -ml-3">
                          {line.type === 'add' ? '+' : '-'}
                        </span>
                      )}
                      {line.type === 'remove' && (
                        <span className="line-through decoration-1">{line.content}</span>
                      )}
                      {line.type !== 'remove' && line.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with stats */}
            {(additions > 0 || deletions > 0 || onOpenDiff) && (
              <div className="px-3 py-2 border-t border-[#222225] bg-[#09090b] flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px]">
                  {additions > 0 && (
                    <span className="text-[#FFA344]">+{additions}</span>
                  )}
                  {deletions > 0 && (
                    <span className="text-[#FF7369]">-{deletions}</span>
                  )}
                </div>
                {onOpenDiff && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[#8b8b94] hover:text-[#fafafa]"
                    onClick={onOpenDiff}
                  >
                    <Icon name="open_in_new" size="xs" />
                    <span className="text-[10px] ml-1">Open Diff</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </details>
      </div>
    );
  }
);
DiffView.displayName = 'DiffView';

export { DiffView };
