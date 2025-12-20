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
  /** Max lines to show before truncating (default: 15) */
  maxPreviewLines?: number;
  onOpenDiff?: () => void;
  /** Callback when the filename is clicked */
  onOpenFile?: (filePath: string) => void;
}

// GitHub/VS Code diff colors (official)
const DIFF_COLORS = {
  add: {
    bg: 'rgba(35, 134, 54, 0.15)',      // Subtle green background
    bgStrong: 'rgba(35, 134, 54, 0.30)', // Line number background
    text: '#7ee787',                     // Muted green text
  },
  remove: {
    bg: 'rgba(248, 81, 73, 0.10)',       // Subtle red background
    bgStrong: 'rgba(248, 81, 73, 0.25)', // Line number background
    text: '#ffa198',                     // Muted coral/salmon text
  },
};

const DiffView = React.forwardRef<HTMLDivElement, DiffViewProps>(
  ({
    className,
    filename,
    lines,
    additions = 0,
    deletions = 0,
    defaultOpen = true,
    maxPreviewLines = 15,
    onOpenDiff,
    onOpenFile,
    ...props
  }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const shouldTruncate = lines.length > maxPreviewLines;
    const displayLines = shouldTruncate && !isExpanded
      ? lines.slice(0, maxPreviewLines)
      : lines;
    const hiddenCount = lines.length - maxPreviewLines;

    return (
      <div
        ref={ref}
        className={cn(
          'border border-[#333] rounded-sm bg-[#161b22] w-full',
          className
        )}
        {...props}
      >
        {/* Header - compact like official */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#333]">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="edit" size="xs" className="text-[#666] shrink-0" />
            <button
              type="button"
              onClick={() => onOpenFile?.(filename)}
              className="font-mono text-[11px] text-[#8b949e] truncate hover:text-[#c9d1d9] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              {filename}
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] shrink-0 ml-2">
            {additions > 0 && <span style={{ color: DIFF_COLORS.add.text }}>+{additions}</span>}
            {deletions > 0 && <span style={{ color: DIFF_COLORS.remove.text }}>-{deletions}</span>}
          </div>
        </div>

        {/* Diff content */}
        <div className="font-mono text-[11px] leading-[1.4]">
          {lines.length === 0 && (
            <div className="px-3 py-2 text-[#666]">No changes</div>
          )}
          {displayLines.map((line, index) => (
            <div
              key={index}
              className="flex"
              style={{
                backgroundColor: line.type === 'add'
                  ? DIFF_COLORS.add.bg
                  : line.type === 'remove'
                    ? DIFF_COLORS.remove.bg
                    : 'transparent',
              }}
            >
              {/* Line number */}
              <div
                className="w-8 text-right pr-1.5 select-none text-[#484f58] text-[10px] shrink-0"
                style={{
                  backgroundColor: line.type === 'add'
                    ? DIFF_COLORS.add.bgStrong
                    : line.type === 'remove'
                      ? DIFF_COLORS.remove.bgStrong
                      : 'transparent',
                }}
              >
                {line.lineNumber || line.newLineNumber || ''}
              </div>
              {/* +/- indicator */}
              <div
                className="w-4 text-center select-none shrink-0 text-[10px]"
                style={{
                  color: line.type === 'add'
                    ? DIFF_COLORS.add.text
                    : line.type === 'remove'
                      ? DIFF_COLORS.remove.text
                      : '#484f58',
                }}
              >
                {line.type === 'add' && '+'}
                {line.type === 'remove' && '-'}
              </div>
              {/* Content */}
              <div
                className="pl-1 pr-2 py-px whitespace-pre select-text flex-1"
                style={{
                  color: line.type === 'add'
                    ? DIFF_COLORS.add.text
                    : line.type === 'remove'
                      ? DIFF_COLORS.remove.text
                      : '#8b949e',
                }}
              >
                {line.content || ' '}
              </div>
            </div>
          ))}

          {/* Expand/collapse button */}
          {shouldTruncate && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full py-1.5 text-[10px] text-[#58a6ff] hover:text-[#79c0ff] bg-[#161b22] border-t border-[#333] cursor-pointer"
            >
              {isExpanded ? '▲ Show less' : `▼ Show ${hiddenCount} more lines`}
            </button>
          )}
        </div>
      </div>
    );
  }
);
DiffView.displayName = 'DiffView';

export { DiffView };
