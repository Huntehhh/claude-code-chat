import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const statusIndicatorVariants = cva(
  'rounded-full',
  {
    variants: {
      status: {
        ready: 'bg-emerald-500',
        processing: 'bg-[#FFA344] animate-status-pulse',
        error: 'bg-[#FF7369]',
        success: 'bg-emerald-500',
        offline: 'bg-[#52525b]',
      },
      size: {
        sm: 'w-1.5 h-1.5',
        default: 'w-[6px] h-[6px]',
        lg: 'w-2 h-2',
      },
    },
    defaultVariants: {
      status: 'ready',
      size: 'default',
    },
  }
);

const statusTextVariants = cva(
  'text-[11px] font-mono uppercase tracking-wider',
  {
    variants: {
      status: {
        ready: 'text-[#52525b]',
        processing: 'text-[#8b8b94]',
        error: 'text-[#FF7369]',
        success: 'text-emerald-400',
        offline: 'text-[#52525b]',
      },
    },
    defaultVariants: {
      status: 'ready',
    },
  }
);

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  label?: string;
  showLabel?: boolean;
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, status, size, label, showLabel = true, ...props }, ref) => {
    const statusLabels: Record<string, string> = {
      ready: 'Ready',
      processing: 'Processing...',
      error: 'Error',
      success: 'Success',
      offline: 'Offline',
    };

    const displayLabel = label || statusLabels[status || 'ready'];

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <div className={cn(statusIndicatorVariants({ status, size }))} />
        {showLabel && (
          <span className={cn(statusTextVariants({ status }))}>
            {displayLabel}
          </span>
        )}
      </div>
    );
  }
);
StatusIndicator.displayName = 'StatusIndicator';

export { StatusIndicator, statusIndicatorVariants, statusTextVariants };
