'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const tinkeringIndicatorVariants = cva(
  'flex items-center',
  {
    variants: {
      variant: {
        default: '',
        inline: 'gap-2.5',
        centered: 'flex-col gap-2 justify-center',
      },
      size: {
        sm: '',
        default: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'inline',
      size: 'default',
    },
  }
);

const asteriskVariants = cva(
  'select-none leading-none inline-block animate-tinkering',
  {
    variants: {
      size: {
        sm: 'text-[12px]',
        default: 'text-[16px]',
        lg: 'text-[32px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface TinkeringIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tinkeringIndicatorVariants> {
  /** Text to display next to the indicator */
  label?: string;
  /** Secondary text (for centered variant) */
  secondaryLabel?: string;
  /** Custom color for the asterisk */
  color?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Hide the label text */
  hideLabel?: boolean;
}

const TinkeringIndicator = React.forwardRef<HTMLDivElement, TinkeringIndicatorProps>(
  (
    {
      className,
      variant,
      size,
      label = 'Tinkering...',
      secondaryLabel,
      color = '#FFA344',
      hideLabel = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(tinkeringIndicatorVariants({ variant, size, className }))}
        role="status"
        aria-label={label}
        {...props}
      >
        <span
          className={cn(asteriskVariants({ size }))}
          style={{ color }}
          aria-hidden="true"
        >
          ✳
        </span>
        {!hideLabel && variant !== 'centered' && (
          <span
            className={cn(
              'italic',
              size === 'sm' && 'text-[12px]',
              size === 'default' && 'text-[14px]',
              size === 'lg' && 'text-[16px]',
              'text-[#8b8b94]'
            )}
          >
            {label}
          </span>
        )}
        {variant === 'centered' && (
          <>
            {!hideLabel && (
              <span
                className={cn(
                  'font-medium',
                  size === 'sm' && 'text-[12px]',
                  size === 'default' && 'text-[14px]',
                  size === 'lg' && 'text-[16px]',
                  'text-[#fafafa]'
                )}
              >
                {label}
              </span>
            )}
            {secondaryLabel && (
              <span className="text-[12px] text-[#8b8b94]">{secondaryLabel}</span>
            )}
          </>
        )}
      </div>
    );
  }
);

TinkeringIndicator.displayName = 'TinkeringIndicator';

export { TinkeringIndicator, tinkeringIndicatorVariants, asteriskVariants };
