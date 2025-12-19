'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { PixelLoader } from './pixel-loader';

export interface CollapsibleCardProps
  extends React.HTMLAttributes<HTMLDetailsElement> {
  icon?: string;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  variant?: 'default' | 'tool' | 'thinking';
  /** Show running state with mini pixel loader */
  isRunning?: boolean;
  /** Custom label for running state (e.g., "Running Read...") */
  runningLabel?: string;
}

const CollapsibleCard = React.forwardRef<HTMLDetailsElement, CollapsibleCardProps>(
  ({ className, icon, title, subtitle, defaultOpen = false, variant = 'default', isRunning = false, runningLabel, children, ...props }, ref) => {
    const variantStyles = {
      default: 'border border-[#222225] rounded-lg bg-[#0f0f0f]',
      tool: 'border border-[#222225] rounded-lg bg-[#0f0f0f]',
      thinking: 'border-l-2 border-[#222225] pl-3 ml-1',
    };

    const headerStyles = {
      default: 'px-3 py-2.5 bg-[#171717]/30 hover:bg-[#171717]/60',
      tool: 'px-3 py-2.5 bg-[#171717]/30 hover:bg-[#171717]/60',
      thinking: 'py-1',
    };

    // Generate running label from title if not provided
    const displayRunningLabel = runningLabel || `Running ${title}...`;

    return (
      <details
        ref={ref}
        className={cn(
          'group overflow-hidden',
          variantStyles[variant],
          isRunning && 'animate-pulse-subtle',
          className
        )}
        open={defaultOpen}
        {...props}
      >
        <summary
          className={cn(
            'flex items-center justify-between cursor-pointer select-none transition-colors',
            headerStyles[variant]
          )}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {icon && (
              <Icon
                name={icon}
                size="sm"
                className={cn('text-[#8b8b94]', isRunning && 'text-[#FFA344]')}
              />
            )}
            <span className={cn('text-sm font-semibold', isRunning ? 'text-[#FFA344]' : 'text-[#8b8b94]')}>
              {title}
            </span>
            {subtitle && !isRunning && (
              <span className="font-mono text-xs text-[#52525b] truncate">
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isRunning ? (
              <PixelLoader
                blockCount={3}
                size="sm"
                label={displayRunningLabel}
                variant="compact"
                speed={0.7}
              />
            ) : (
              <span className="text-[10px] font-medium text-[#52525b] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                Click to expand
              </span>
            )}
            <Icon
              name="expand_more"
              size="sm"
              className="text-[#8b8b94] transition-transform group-open:rotate-180"
            />
          </div>
        </summary>
        <div className={cn(
          variant === 'thinking' ? 'mt-1 text-sm italic text-[#8b8b94]' : 'border-t border-[#222225]'
        )}>
          {children}
        </div>
      </details>
    );
  }
);
CollapsibleCard.displayName = 'CollapsibleCard';

export { CollapsibleCard };
