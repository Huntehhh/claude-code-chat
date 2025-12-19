'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const thinkingOverlayVariants = cva(
  'flex flex-col items-center justify-center bg-[rgba(9,9,11,0.85)] backdrop-blur-[2px] border border-[#222225]',
  {
    variants: {
      variant: {
        default: '',
        fullscreen: 'fixed inset-0 z-50',
        panel: 'w-[400px] h-[300px]',
      },
    },
    defaultVariants: {
      variant: 'panel',
    },
  }
);

export interface ThinkingOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof thinkingOverlayVariants> {
  /** Primary message to display */
  message?: string;
  /** Secondary/helper text */
  secondaryMessage?: string;
  /** Whether the overlay is visible */
  open?: boolean;
  /** Custom icon to display instead of asterisk */
  icon?: React.ReactNode;
  /** Hide the pulsing asterisk */
  hideIcon?: boolean;
}

const ThinkingOverlay = React.forwardRef<HTMLDivElement, ThinkingOverlayProps>(
  (
    {
      className,
      variant,
      message = 'Claude is thinking...',
      secondaryMessage = 'This may take a moment',
      open = true,
      icon,
      hideIcon = false,
      ...props
    },
    ref
  ) => {
    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(thinkingOverlayVariants({ variant, className }))}
        role="status"
        aria-live="polite"
        aria-label={message}
        {...props}
      >
        <div className="flex flex-col items-center justify-center gap-3">
          {/* Pulsing Icon */}
          {!hideIcon && (
            <div className="flex items-center justify-center animate-thinking-pulse">
              {icon || (
                <span
                  className={cn(
                    'text-[32px] text-[#FFA344] leading-none select-none',
                    'drop-shadow-[0_0_12px_rgba(255,163,68,0.3)]'
                  )}
                  aria-hidden="true"
                >
                  ✳
                </span>
              )}
            </div>
          )}

          {/* Text Content */}
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <h2 className="text-[#fafafa] text-sm font-medium leading-tight">
              {message}
            </h2>
            {secondaryMessage && (
              <p className="text-[#8b8b94] text-xs font-normal leading-normal">
                {secondaryMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ThinkingOverlay.displayName = 'ThinkingOverlay';

export { ThinkingOverlay, thinkingOverlayVariants };
