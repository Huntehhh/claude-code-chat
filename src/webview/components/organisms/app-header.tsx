'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  onSettings?: () => void;
  onHistory?: () => void;
  onNewChat?: () => void;
  onRename?: (newName: string) => void;
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ className, title = 'Claude Code Chat', onSettings, onHistory, onNewChat, onRename, ...props }, ref) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(title);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Update edit value when title prop changes
    React.useEffect(() => {
      setEditValue(title);
    }, [title]);

    // Focus input when editing starts
    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleStartEdit = () => {
      setEditValue(title);
      setIsEditing(true);
    };

    const handleSave = () => {
      const trimmed = editValue.trim();
      if (trimmed && trimmed !== title) {
        onRename?.(trimmed);
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(title);
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    return (
      <header
        ref={ref}
        className={cn(
          'h-12 bg-[#0f0f0f] border-b border-[#222225]',
          'flex items-center justify-between px-3 shrink-0 z-20',
          className
        )}
        {...props}
      >
        {/* Left side - Logo and title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon name="terminal" className="text-[#FFA344] shrink-0" />

          {isEditing ? (
            <div className="flex items-center min-w-0 flex-1 max-w-[300px]">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className={cn(
                  'flex-1 min-w-0 bg-[#171717] text-[#fafafa] text-sm font-semibold tracking-tight',
                  'px-2 py-1 rounded border border-[#FFA344]/50',
                  'focus:outline-none focus:ring-1 focus:ring-[#FFA344]/30',
                  'placeholder:text-[#52525b]'
                )}
                placeholder="Enter chat name..."
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 group">
              <h1 className="text-[#fafafa] text-sm font-semibold tracking-tight truncate">
                {title}
              </h1>
              {onRename && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="shrink-0 p-1 rounded hover:bg-[#222225] text-[#52525b] hover:text-[#8b8b94] opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Rename chat"
                >
                  <Icon name="edit" className="!text-[14px]" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {onSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettings}
              aria-label="Settings"
            >
              <Icon name="settings" className="text-[#8b8b94]" />
            </Button>
          )}
          {onHistory && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onHistory}
              aria-label="History"
            >
              <Icon name="history" className="text-[#8b8b94]" />
            </Button>
          )}
          {onNewChat && (
            <Button
              variant="accent"
              size="sm"
              className="ml-2"
              onClick={onNewChat}
            >
              <Icon name="add" size="sm" className="font-bold" />
              <span>New</span>
            </Button>
          )}
        </div>
      </header>
    );
  }
);
AppHeader.displayName = 'AppHeader';

export { AppHeader };
