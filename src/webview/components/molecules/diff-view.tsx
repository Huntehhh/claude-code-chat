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

// VS Code/Claude Code diff colors - more muted/pastel
const DIFF_COLORS = {
  add: {
    bg: 'rgba(35, 134, 54, 0.12)',       // Very subtle green background
    bgStrong: 'rgba(35, 134, 54, 0.20)', // Line number background
    text: '#89d185',                      // Muted pastel green (like VS Code)
  },
  remove: {
    bg: 'rgba(218, 54, 51, 0.10)',        // Very subtle red background
    bgStrong: 'rgba(218, 54, 51, 0.18)', // Line number background
    text: '#d9a0a0',                      // Muted pastel red/salmon
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
    const [isHovered, setIsHovered] = React.useState(false);

    const shouldTruncate = lines.length > maxPreviewLines;
    const displayLines = shouldTruncate && !isExpanded
      ? lines.slice(0, maxPreviewLines)
      : lines;

    return (
      <div
        ref={ref}
        className={cn(
          'border border-[#333] rounded-sm bg-[#161b22] w-full overflow-hidden',
          className
        )}
        {...props}
      >
        {/* Header - compact like official */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#161b22] border-b border-[#333]">
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
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

        {/* Diff content - clickable to expand when truncated */}
        <div
          className={cn(
            'font-mono text-[11px] leading-[1.4] relative overflow-hidden',
            shouldTruncate && !isExpanded && 'cursor-pointer'
          )}
          onClick={shouldTruncate && !isExpanded ? () => setIsExpanded(true) : undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {lines.length === 0 && (
            <div className="px-3 py-2 text-[#666]">No changes</div>
          )}
          {displayLines.map((line, index) => (
            <div
              key={index}
              className="flex overflow-hidden"
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
              {/* Content - with overflow hidden */}
              <div
                className="pl-1 pr-2 py-px whitespace-pre select-text flex-1 overflow-hidden text-ellipsis"
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

          {/* Hover vignette/gradient overlay when truncated and not expanded */}
          {shouldTruncate && !isExpanded && (
            <div
              className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none transition-opacity duration-150"
              style={{
                background: 'linear-gradient(to top, rgba(22, 27, 34, 0.95), rgba(22, 27, 34, 0))',
                opacity: isHovered ? 0.9 : 0.7,
              }}
            />
          )}
        </div>

        {/* Collapse button when expanded */}
        {shouldTruncate && isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="w-full py-1 text-[10px] text-[#58a6ff] hover:text-[#79c0ff] bg-[#161b22] border-t border-[#333] cursor-pointer"
          >
            ▲ Collapse
          </button>
        )}
      </div>
    );
  }
);
DiffView.displayName = 'DiffView';

// Memoize to prevent re-renders when props haven't changed
const MemoizedDiffView = React.memo(DiffView);
MemoizedDiffView.displayName = 'DiffView';

export { MemoizedDiffView as DiffView };
