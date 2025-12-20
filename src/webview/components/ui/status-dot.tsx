'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const statusDotVariants = cva(
  'shrink-0 rounded-full transition-colors',
  {
    variants: {
      status: {
        active: 'bg-[#22c55e] shadow-[0_0_4px_rgba(34,197,94,0.4)]',
        disabled: 'bg-[#52525b]',
        error: 'bg-[#FF7369] shadow-[0_0_4px_rgba(255,115,105,0.4)]',
        warning: 'bg-[#FFA344] shadow-[0_0_4px_rgba(255,163,68,0.4)]',
      },
      size: {
        sm: 'size-1.5',
        default: 'size-2',
        lg: 'size-2.5',
      },
    },
    defaultVariants: {
      status: 'disabled',
      size: 'default',
    },
  }
);

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusDotVariants> {}

const StatusDot = React.forwardRef<HTMLDivElement, StatusDotProps>(
  ({ className, status, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusDotVariants({ status, size }), className)}
        role="status"
        aria-label={status === 'active' ? 'Active' : status === 'disabled' ? 'Disabled' : status}
        {...props}
      />
    );
  }
);
StatusDot.displayName = 'StatusDot';

export { StatusDot, statusDotVariants };
