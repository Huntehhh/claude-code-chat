'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { ModeToggle } from '../molecules/mode-toggle';
import { StatusIndicator } from '../ui/status-indicator';
import { TokenDisplay } from '../ui/token-display';

export interface ChatInputProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  onStop?: () => void;
  onFileDrop?: (files: FileList) => void;
  isProcessing?: boolean;
  planMode?: boolean;
  thinkMode?: boolean;
  onPlanModeChange?: (enabled: boolean) => void;
  onThinkModeChange?: (enabled: boolean) => void;
  status?: 'ready' | 'processing' | 'error';
  contextUsage?: number;
  placeholder?: string;
  /** Token display data */
  inputTokens?: number;
  outputTokens?: number;
  totalCost?: number;
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  ({
    className,
    value = '',
    onChange,
    onSubmit,
    onStop,
    onFileDrop,
    isProcessing = false,
    planMode = false,
    thinkMode = false,
    onPlanModeChange,
    onThinkModeChange,
    status = 'ready',
    contextUsage,
    placeholder = 'Describe your code task...',
    inputTokens,
    outputTokens,
    totalCost,
    ...props
  }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [isDragOver, setIsDragOver] = React.useState(false);
    const dragCounterRef = React.useRef(0);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
        e.preventDefault();
        onSubmit?.();
      }
    };

    const handleDragEnter = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFileDrop?.(e.dataTransfer.files);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'w-full bg-[#0f0f0f] border-t border-[#222225] shrink-0 z-20 flex flex-col',
          className
        )}
        {...props}
      >
        {/* Input area */}
        <div className="px-3 pt-3 pb-2 flex flex-col gap-2">
          <div
            className="relative group"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isProcessing ? 'Processing...' : placeholder}
              disabled={isProcessing}
              className={cn(
                'min-h-[56px] transition-all',
                isDragOver && 'border-2 border-dashed border-[#FFA344] opacity-60'
              )}
              style={{ borderRadius: 0 }}
            />

            {/* Drag-over overlay */}
            {isDragOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgba(255,163,68,0.08)] border-2 border-dashed border-[#FFA344] pointer-events-none z-10">
                <Icon name="upload" className="!text-[32px] text-[#FFA344] mb-2 drop-shadow-[0_0_8px_rgba(255,163,68,0.3)]" />
                <span className="text-[14px] font-medium text-[#FFA344]">Drop file</span>
              </div>
            )}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Left side: Mode toggles + Status indicator */}
            <div className="flex items-center gap-3">
              {onPlanModeChange && (
                <ModeToggle
                  label="Plan"
                  active={planMode}
                  onClick={() => onPlanModeChange(!planMode)}
                />
              )}
              {onThinkModeChange && (
                <ModeToggle
                  label="Think"
                  active={thinkMode}
                  onClick={() => onThinkModeChange(!thinkMode)}
                />
              )}
              {/* Status indicator inline */}
              <StatusIndicator
                status={isProcessing ? 'processing' : status}
                size="sm"
              />
            </div>

            {/* Right side: Token display + Context usage + Send button */}
            <div className="flex items-center gap-3">
              {inputTokens !== undefined && outputTokens !== undefined && (
                <TokenDisplay
                  inputTokens={inputTokens}
                  outputTokens={outputTokens}
                  totalCost={totalCost}
                  isStreaming={isProcessing}
                />
              )}
              {contextUsage !== undefined && (
                <span className="text-[11px] font-mono text-[#52525b] tracking-wider">
                  {contextUsage}%
                </span>
              )}
              <Button
                variant="accent"
                size="icon"
                className="rounded-full shadow-lg shadow-[#FFA344]/10"
                onClick={isProcessing ? onStop : onSubmit}
                disabled={!isProcessing && !value.trim()}
              >
                <Icon
                  name={isProcessing ? 'stop' : 'arrow_upward'}
                  size="sm"
                  className="font-bold"
                />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
ChatInput.displayName = 'ChatInput';

export { ChatInput };
