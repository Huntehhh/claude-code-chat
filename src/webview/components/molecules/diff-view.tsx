'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

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
  /** Callback when the filename is clicked */
  onOpenFile?: (filePath: string) => void;
}

const DiffView = React.forwardRef<HTMLDivElement, DiffViewProps>(
  ({ className, filename, lines, additions = 0, deletions = 0, defaultOpen = true, onOpenDiff, onOpenFile, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'border border-[#333] rounded-sm bg-[#1a1a1a] w-full',
          className
        )}
        {...props}
      >
        {/* Header - compact like official */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a1a] border-b border-[#333]">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="edit" size="xs" className="text-[#666] shrink-0" />
            <button
              type="button"
              onClick={() => onOpenFile?.(filename)}
              className="font-mono text-[11px] text-[#888] truncate hover:text-[#aaa] cursor-pointer bg-transparent border-none p-0"
            >
              {filename}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] shrink-0 ml-2">
            {additions > 0 && <span className="text-[#3fb950]">+{additions}</span>}
            {deletions > 0 && <span className="text-[#f85149]">-{deletions}</span>}
          </div>
        </div>

        {/* Diff content - no scrollbars, compact lines */}
        <div className="font-mono text-[11px] font-light leading-tight">
          {lines.length === 0 && (
            <div className="px-3 py-2 text-[#666]">No changes</div>
          )}
          {lines.map((line, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                // Muted green background for additions (like official)
                line.type === 'add' && 'bg-[rgba(46,160,67,0.15)]',
                // Darker red background for removals (like official)
                line.type === 'remove' && 'bg-[rgba(248,81,73,0.15)]',
                line.type === 'context' && 'bg-transparent'
              )}
            >
              {/* Line number - narrower */}
              <div className={cn(
                'w-8 text-right pr-1.5 select-none text-[#484848] text-[10px] shrink-0',
                line.type === 'add' && 'bg-[rgba(46,160,67,0.25)]',
                line.type === 'remove' && 'bg-[rgba(248,81,73,0.25)]'
              )}>
                {line.lineNumber || line.newLineNumber || ''}
              </div>
              {/* +/- indicator - narrower */}
              <div className={cn(
                'w-4 text-center select-none shrink-0 text-[10px]',
                line.type === 'add' && 'text-[#3fb950]',
                line.type === 'remove' && 'text-[#f85149]'
              )}>
                {line.type === 'add' && '+'}
                {line.type === 'remove' && '-'}
              </div>
              {/* Content - compact, no extra padding */}
              <div className={cn(
                'pl-1 pr-2 py-px whitespace-pre select-text flex-1',
                line.type === 'add' && 'text-[#3fb950]',
                line.type === 'remove' && 'text-[#f85149]',
                line.type === 'context' && 'text-[#8b949e]'
              )}>
                {line.content || ' '}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
DiffView.displayName = 'DiffView';

export { DiffView };
