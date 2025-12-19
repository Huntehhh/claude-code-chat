'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';

const permissionCardVariants = cva(
  'relative w-full overflow-hidden rounded-lg border p-[14px] animate-slide-up',
  {
    variants: {
      state: {
        pending: 'border-[rgba(255,163,68,0.2)] bg-[rgba(255,163,68,0.06)]',
        approved: 'border-[rgba(255,163,68,0.2)] bg-[rgba(255,163,68,0.08)]',
        denied: 'border-[#FF7369]/20 bg-[#FF7369]/5',
      },
    },
    defaultVariants: {
      state: 'pending',
    },
  }
);

export interface PermissionCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof permissionCardVariants> {
  tool: string;
  command: string;
  state?: 'pending' | 'approved' | 'denied';
  onAllow?: () => void;
  onAlwaysAllow?: () => void;
  onDeny?: () => void;
}

const PermissionCard = React.forwardRef<HTMLDivElement, PermissionCardProps>(
  (
    {
      className,
      tool,
      command,
      state = 'pending',
      onAllow,
      onAlwaysAllow,
      onDeny,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(permissionCardVariants({ state }), className)}
        {...props}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Icon name="warning" className="text-[#FFA344]" />
            <h2 className="text-sm font-medium text-white leading-tight">
              Permission needed
            </h2>
          </div>
          <button
            aria-label="More options"
            className="flex items-center justify-center w-7 h-7 -mr-1 rounded hover:bg-[#FFA344]/10 text-[#8b8b94] transition-colors"
          >
            <Icon name="more_vert" size="sm" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Tool Badge */}
          <Badge variant="tool" className="self-start">
            {tool.toUpperCase()}
          </Badge>

          {/* Command Preview */}
          <div className="w-full bg-[#0f0f0f] border border-[#222225] p-3 overflow-x-auto">
            <code className="text-[13px] font-mono text-[#a1a1a1] whitespace-nowrap">
              {command}
            </code>
          </div>
        </div>

        {/* Action Buttons or Status */}
        {state === 'pending' ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeny}
              className="px-3 h-8 text-[#FF7369] hover:bg-[#FF7369]/10"
            >
              Deny
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onAllow}
              className="px-4 h-8"
            >
              Allow
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onAlwaysAllow}
              className="px-4 h-8 shadow-md shadow-[#FFA344]/20"
            >
              Always Allow
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end h-8">
            <div className="flex items-center gap-1.5 text-[#FFA344] select-none">
              <Icon name="check" size="sm" className="font-bold" />
              <span className="text-sm font-medium">
                {state === 'approved' ? 'Allowed' : 'Denied'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
PermissionCard.displayName = 'PermissionCard';

export { PermissionCard, permissionCardVariants };
