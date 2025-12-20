'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { DiffView, type DiffLine } from './diff-view';

// Tool icon mapping
const toolIcons: Record<string, string> = {
  Read: 'description',
  read: 'description',
  Write: 'edit_document',
  write: 'edit_document',
  Edit: 'edit',
  edit: 'edit',
  Bash: 'terminal',
  bash: 'terminal',
  Grep: 'search',
  grep: 'search',
  Glob: 'folder_open',
  glob: 'folder_open',
  Task: 'task',
  task: 'task',
  default: 'build',
};

export interface ToolUseBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  toolName: string;
  input?: Record<string, unknown> | string;
  output?: string;
  isError?: boolean;
  filePath?: string;
  /** For Edit operations - old content before edit */
  oldContent?: string;
  /** For Edit operations - new content after edit */
  newContent?: string;
  /** Number of lines to show in preview (default: 2 for IN, 1 for OUT) */
  previewLines?: { in: number; out: number };
  /** Callback when a file path is clicked */
  onOpenFile?: (filePath: string) => void;
}

/**
 * Get description label for tool (used as subtitle in header)
 */
function getToolDescription(toolName: string, input: Record<string, unknown> | string | undefined): string | undefined {
  if (!input || typeof input === 'string') return undefined;

  const lowerName = toolName.toLowerCase();

  // Bash shows description as header label
  if (lowerName === 'bash' && input.description) {
    return input.description as string;
  }

  return undefined;
}

/**
 * Check if this tool should hide the IN section
 */
function shouldHideInSection(toolName: string): boolean {
  const lowerName = toolName.toLowerCase();
  // Read tool shows file path in header only - no IN section needed
  return lowerName === 'read';
}

/**
 * Format input for display - extract the most relevant info
 */
function formatInput(toolName: string, input: Record<string, unknown> | string | undefined): string {
  if (!input) return '';
  if (typeof input === 'string') return input;

  // Extract relevant fields based on tool type
  const lowerName = toolName.toLowerCase();

  if (lowerName === 'read') {
    // Read tool - file path is shown in header, no IN content needed
    return '';
  }
  if (lowerName === 'write') {
    // Write tool - show content being written (not the file path)
    return input.content as string || '';
  }
  if (lowerName === 'edit') {
    // Edit tool - handled separately with diff view
    return '';
  }
  if (lowerName === 'bash') {
    // Show command as the main input, description is shown as header label
    return input.command as string || JSON.stringify(input);
  }
  if (lowerName === 'grep') {
    const pattern = input.pattern as string || '';
    const path = input.path as string || input.include as string || '.';
    return `${pattern} in ${path}`;
  }
  if (lowerName === 'glob') {
    return input.pattern as string || JSON.stringify(input);
  }

  // MCP or other tools - show JSON
  return JSON.stringify(input, null, 2);
}

/**
 * Get file path from tool input for header display
 */
function getFilePath(toolName: string, input: Record<string, unknown> | string | undefined, explicitFilePath?: string): string | undefined {
  if (explicitFilePath) return explicitFilePath;
  if (!input || typeof input === 'string') return undefined;

  const lowerName = toolName.toLowerCase();
  if (lowerName === 'read' || lowerName === 'write' || lowerName === 'edit') {
    return input.file_path as string || input.path as string || undefined;
  }
  return undefined;
}

/**
 * Truncate text to N lines
 */
function truncateLines(text: string, maxLines: number): { text: string; truncated: boolean } {
  const lines = text.split('\n');
  if (lines.length <= maxLines) {
    return { text, truncated: false };
  }
  return {
    text: lines.slice(0, maxLines).join('\n'),
    truncated: true,
  };
}

/**
 * Compute diff lines from old and new strings
 * Uses simple line-by-line comparison
 */
function computeDiffLines(oldStr: string, newStr: string): { lines: DiffLine[]; additions: number; deletions: number } {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const result: DiffLine[] = [];
  let additions = 0;
  let deletions = 0;

  // Simple diff algorithm - mark all old as removed, all new as added
  // For more sophisticated diff, would need a proper diff library
  let oldIdx = 0;
  let newIdx = 0;
  let lineNum = 1;

  // Find common prefix
  while (oldIdx < oldLines.length && newIdx < newLines.length && oldLines[oldIdx] === newLines[newIdx]) {
    result.push({ type: 'context', lineNumber: lineNum, content: oldLines[oldIdx] });
    oldIdx++;
    newIdx++;
    lineNum++;
  }

  // Mark remaining old lines as removed
  const removedStart = oldIdx;
  while (oldIdx < oldLines.length) {
    // Check if this line exists later in newLines (it's just moved)
    const foundInNew = newLines.slice(newIdx).indexOf(oldLines[oldIdx]);
    if (foundInNew === -1) {
      result.push({ type: 'remove', lineNumber: removedStart + (oldIdx - removedStart) + 1, content: oldLines[oldIdx] });
      deletions++;
    }
    oldIdx++;
  }

  // Reset and mark remaining new lines as added
  oldIdx = removedStart;
  while (newIdx < newLines.length) {
    // Check if this line existed in old (it was context or already processed)
    const wasInOld = oldLines.slice(0, removedStart).indexOf(newLines[newIdx]);
    if (wasInOld === -1) {
      result.push({ type: 'add', newLineNumber: lineNum, content: newLines[newIdx] });
      additions++;
    }
    newIdx++;
    lineNum++;
  }

  // Find common suffix and add as context
  // (simplified - just return what we have)

  return { lines: result, additions, deletions };
}

const ToolUseBlock = React.forwardRef<HTMLDivElement, ToolUseBlockProps>(
  ({
    className,
    toolName,
    input,
    output,
    isError = false,
    filePath,
    oldContent,
    newContent,
    previewLines = { in: 2, out: 1 },
    onOpenFile,
    ...props
  }, ref) => {
    const [inExpanded, setInExpanded] = React.useState(false);
    const [outExpanded, setOutExpanded] = React.useState(false);

    // Get icon for tool
    const icon = toolIcons[toolName] || toolIcons.default;

    // Check if this is an Edit tool with diff data
    const isEditTool = toolName.toLowerCase() === 'edit' || toolName.toLowerCase() === 'multiedit';
    const hasFullDiff = oldContent !== undefined && newContent !== undefined && oldContent !== newContent;

    // Extract old_string/new_string from rawInput for inline diff display
    const editOldString = isEditTool && input && typeof input === 'object'
      ? (input as Record<string, unknown>).old_string as string | undefined
      : undefined;
    const editNewString = isEditTool && input && typeof input === 'object'
      ? (input as Record<string, unknown>).new_string as string | undefined
      : undefined;
    const hasInlineDiff = isEditTool && editOldString !== undefined && editNewString !== undefined;

    const isEditWithDiff = hasFullDiff;

    // Compute diff if needed - use full file diff or inline strings
    const diffData = React.useMemo(() => {
      if (hasFullDiff) {
        return computeDiffLines(oldContent!, newContent!);
      }
      if (hasInlineDiff && editOldString && editNewString) {
        return computeDiffLines(editOldString, editNewString);
      }
      return null;
    }, [hasFullDiff, hasInlineDiff, oldContent, newContent, editOldString, editNewString]);

    // Format input for display
    const formattedInput = formatInput(toolName, input);
    const { text: inPreview, truncated: inTruncated } = truncateLines(formattedInput, previewLines.in);

    // Get description label for header (e.g., Bash descriptions)
    const descriptionLabel = getToolDescription(toolName, input);

    // Get file path for header display (Read/Write/Edit tools)
    const headerFilePath = getFilePath(toolName, input, filePath);

    // Check if we should hide IN section (e.g., Read tool)
    const hideInSection = shouldHideInSection(toolName);

    // Format output
    const outputText = output || '';
    const { text: outPreview, truncated: outTruncated } = truncateLines(outputText, previewLines.out);

    // Check if this is an MCP tool
    const isMcp = toolName.startsWith('mcp_') || toolName.startsWith('mcp__');

    // Render DiffView for Edit operations with diff data (either full file or inline)
    if ((isEditWithDiff || hasInlineDiff) && diffData) {
      return (
        <DiffView
          ref={ref}
          className={className}
          filename={headerFilePath || filePath || 'unknown'}
          lines={diffData.lines}
          additions={diffData.additions}
          deletions={diffData.deletions}
          defaultOpen={true}
          onOpenFile={onOpenFile}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex gap-3 animate-fade-in', className)}
        {...props}
      >
        {/* Content */}
        <div className="flex flex-col gap-1 pt-0.5 w-full min-w-0 ml-2">
          {/* Tool name header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#FFA344] select-none">•</span>
            <Icon name={isMcp ? 'memory' : icon} className="text-[#8b8b94] !text-[16px]" />
            <span className="text-[14px] font-medium text-[#fafafa]">
              {toolName}
            </span>
            {descriptionLabel && (
              <span className="text-[13px] text-[#e4e4e7]">
                {descriptionLabel}
              </span>
            )}
            {headerFilePath && !descriptionLabel && (
              <button
                type="button"
                onClick={() => onOpenFile?.(headerFilePath)}
                className="text-[12px] text-[#FFA344] truncate hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                {headerFilePath}
              </button>
            )}
          </div>

          {/* IN section - hidden for Read tool */}
          {formattedInput && !hideInSection && (
            <div className="ml-6 mt-1">
              <button
                type="button"
                onClick={() => setInExpanded(!inExpanded)}
                className="flex items-start gap-3 w-full text-left group"
              >
                <span className="text-[11px] font-mono text-[#52525b] select-none shrink-0 pt-0.5">IN</span>
                <div className="flex-1 min-w-0">
                  <pre className={cn(
                    'text-[12px] font-mono text-[#a1a1aa] whitespace-pre-wrap break-all',
                    !inExpanded && inTruncated && 'line-clamp-2'
                  )}>
                    {inExpanded ? formattedInput : inPreview}
                    {!inExpanded && inTruncated && (
                      <span className="text-[#52525b]">...</span>
                    )}
                  </pre>
                </div>
                {inTruncated && (
                  <Icon
                    name={inExpanded ? 'expand_less' : 'expand_more'}
                    className="text-[#52525b] group-hover:text-[#8b8b94] shrink-0 !text-[16px]"
                  />
                )}
              </button>
            </div>
          )}

          {/* OUT section */}
          {outputText && (
            <div className="ml-6 mt-1">
              <button
                type="button"
                onClick={() => setOutExpanded(!outExpanded)}
                className="flex items-start gap-3 w-full text-left group"
              >
                <span className="text-[11px] font-mono text-[#52525b] select-none shrink-0 pt-0.5">OUT</span>
                <div className="flex-1 min-w-0">
                  <pre className={cn(
                    'text-[12px] font-mono whitespace-pre-wrap break-all',
                    isError ? 'text-[#FF7369]' : 'text-[#8b8b94]',
                    !outExpanded && outTruncated && 'line-clamp-1'
                  )}>
                    {outExpanded ? outputText : outPreview}
                    {!outExpanded && outTruncated && (
                      <span className="text-[#52525b]">...</span>
                    )}
                  </pre>
                </div>
                {outTruncated && (
                  <Icon
                    name={outExpanded ? 'expand_less' : 'expand_more'}
                    className="text-[#52525b] group-hover:text-[#8b8b94] shrink-0 !text-[16px]"
                  />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ToolUseBlock.displayName = 'ToolUseBlock';

export { ToolUseBlock };
