'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Icon } from './icon';

const chipVariants = cva(
  'group inline-flex items-center gap-1.5 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#222225] text-[#8b8b94] border border-transparent hover:border-[#333333]/50',
        outline: 'bg-transparent border border-dashed border-[#333333] text-[#8b8b94] hover:text-[#FFA344] hover:border-[#FFA344]/50',
      },
      size: {
        default: 'pl-3 pr-2 py-1.5 rounded-full text-xs',
        sm: 'pl-2 pr-1.5 py-1 rounded-full text-[11px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  /** Chip label */
  label: string;
  /** Called when remove button is clicked */
  onRemove?: () => void;
  /** Show as monospace font */
  mono?: boolean;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, size, label, onRemove, mono = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant, size }), className)}
        {...props}
      >
        <span className={cn('select-none', mono && 'font-mono')}>{label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center justify-center size-4 rounded-full text-[#8b8b94] hover:bg-[#FF7369] hover:text-white transition-colors"
            aria-label={`Remove ${label}`}
          >
            <Icon name="close" className="!text-[14px]" />
          </button>
        )}
      </div>
    );
  }
);
Chip.displayName = 'Chip';

// Add Chip button variant
export interface AddChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {}

const AddChip = React.forwardRef<HTMLButtonElement, AddChipProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          chipVariants({ variant: 'outline', size }),
          'cursor-pointer',
          className
        )}
        {...props}
      >
        <Icon name="add" className="!text-[14px]" />
        <span>Add</span>
      </button>
    );
  }
);
AddChip.displayName = 'AddChip';

export { Chip, AddChip, chipVariants };
