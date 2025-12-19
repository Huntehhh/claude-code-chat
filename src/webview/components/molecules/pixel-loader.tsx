'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const pixelLoaderVariants = cva(
  'flex items-center',
  {
    variants: {
      variant: {
        default: 'gap-2.5',
        inline: 'gap-2.5',
        compact: 'gap-1.5',
      },
      size: {
        sm: '',
        default: '',
        lg: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const pixelBlockVariants = cva(
  'border border-[#222225] transition-all',
  {
    variants: {
      size: {
        sm: 'w-[6px] h-[6px]',
        default: 'w-[8px] h-[8px]',
        lg: 'w-[10px] h-[10px]',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface PixelLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pixelLoaderVariants> {
  /** Text label next to the loader */
  label?: string;
  /** Number of pixel blocks (3 for mini, 5 for full) */
  blockCount?: 3 | 5;
  /** Custom color for active pixels */
  color?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Hide the label text */
  hideLabel?: boolean;
  /** Animation speed multiplier (1 = normal, 0.5 = faster) */
  speed?: number;
}

const PixelLoader = React.forwardRef<HTMLDivElement, PixelLoaderProps>(
  (
    {
      className,
      variant,
      size = 'default',
      label = 'Tinkering...',
      blockCount = 5,
      color = '#FFA344',
      hideLabel = false,
      speed = 1,
      ...props
    },
    ref
  ) => {
    const blocks = Array.from({ length: blockCount }, (_, i) => i);

    // Calculate animation duration and delays
    const cycleDuration = blockCount === 3 ? 1000 : 1500;
    const staggerDelay = blockCount === 3 ? 80 : 100;

    return (
      <div
        ref={ref}
        className={cn(pixelLoaderVariants({ variant, size, className }))}
        role="status"
        aria-label={label}
        {...props}
      >
        <div className={cn('flex', blockCount === 3 ? 'gap-[3px]' : 'gap-1')}>
          {blocks.map((index) => (
            <div
              key={index}
              className={cn(pixelBlockVariants({ size }), 'animate-pixel-wave')}
              style={{
                animationDuration: `${cycleDuration * speed}ms`,
                animationDelay: `${index * staggerDelay * speed}ms`,
                '--pixel-color': color,
                '--pixel-glow': `0 0 6px ${color}66`,
              } as React.CSSProperties}
              aria-hidden="true"
            />
          ))}
        </div>
        {!hideLabel && (
          <span
            className={cn(
              'italic',
              size === 'sm' && 'text-[10px]',
              size === 'default' && 'text-[14px]',
              size === 'lg' && 'text-[16px]',
              'text-[#8b8b94]'
            )}
          >
            {label}
          </span>
        )}
      </div>
    );
  }
);

PixelLoader.displayName = 'PixelLoader';

export { PixelLoader, pixelLoaderVariants, pixelBlockVariants };
