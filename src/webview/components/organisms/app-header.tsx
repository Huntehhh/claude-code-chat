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
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ className, title = 'Claude Code Chat', onSettings, onHistory, onNewChat, ...props }, ref) => {
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
        <div className="flex items-center gap-2">
          <Icon name="terminal" className="text-[#FFA344]" />
          <h1 className="text-[#fafafa] text-sm font-semibold tracking-tight">
            {title}
          </h1>
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
