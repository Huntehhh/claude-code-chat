'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { StatusIndicator } from '../ui/status-indicator';
import { Button } from '../ui/button';

export interface StatusFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'ready' | 'processing' | 'error' | 'success' | 'offline';
  contextUsage?: number;
  onStop?: () => void;
}

const StatusFooter = React.forwardRef<HTMLDivElement, StatusFooterProps>(
  ({ className, status = 'ready', contextUsage, onStop, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'h-[28px] border-t border-[#222225] bg-[#09090b]',
          'flex items-center justify-between px-3 select-none',
          className
        )}
        {...props}
      >
        {/* Left side - Status */}
        <StatusIndicator status={status} />

        {/* Right side - Context usage and stop button */}
        <div className="flex items-center gap-3">
          {contextUsage !== undefined && (
            <span className="text-[11px] font-mono text-[#52525b] tracking-wider">
              {contextUsage}% CONTEXT
            </span>
          )}
          {status === 'processing' && onStop && (
            <Button
              variant="destructive"
              size="sm"
              className="h-6 w-6 p-0 rounded-none"
              onClick={onStop}
              aria-label="Stop"
            >
              <div className="w-2 h-2 bg-white" />
            </Button>
          )}
        </div>
      </div>
    );
  }
);
StatusFooter.displayName = 'StatusFooter';

export { StatusFooter };
