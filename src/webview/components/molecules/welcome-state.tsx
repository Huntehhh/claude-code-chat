'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const welcomeStateVariants = cva(
  'flex flex-col items-center gap-2 transition-opacity duration-500',
  {
    variants: {
      variant: {
        default: 'opacity-100',
        faded: 'opacity-60',
      },
      size: {
        default: '',
        compact: 'gap-1',
        spacious: 'gap-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const welcomeTitleVariants = cva(
  'font-bold tracking-tight',
  {
    variants: {
      size: {
        default: 'text-2xl',
        sm: 'text-xl',
        lg: 'text-3xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

export interface WelcomeStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof welcomeStateVariants> {
  /** Main title text */
  title?: string;
  /** Subtitle/description text */
  subtitle?: string;
  /** Optional icon to display above title */
  icon?: React.ReactNode;
  /** Title size variant */
  titleSize?: 'default' | 'sm' | 'lg';
}

const WelcomeState = React.forwardRef<HTMLDivElement, WelcomeStateProps>(
  (
    {
      className,
      variant,
      size,
      title = 'Ready',
      subtitle = 'Type a message below',
      icon,
      titleSize = 'default',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(welcomeStateVariants({ variant, size, className }))}
        {...props}
      >
        {icon && <div className="mb-2">{icon}</div>}
        <h2 className={cn(welcomeTitleVariants({ size: titleSize }), 'text-[#fafafa]')}>
          {title}
        </h2>
        <p className="text-sm font-normal text-[#8b8b94]">{subtitle}</p>
      </div>
    );
  }
);

WelcomeState.displayName = 'WelcomeState';

export { WelcomeState, welcomeStateVariants, welcomeTitleVariants };
