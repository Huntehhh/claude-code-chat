import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const iconVariants = cva(
  'material-symbols-outlined select-none',
  {
    variants: {
      size: {
        xs: 'text-[14px]',
        sm: 'text-[16px]',
        default: 'text-[20px]',
        lg: 'text-[24px]',
        xl: 'text-[32px]',
      },
      filled: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      filled: false,
    },
  }
);

export interface IconProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof iconVariants> {
  name: string;
}

const Icon = React.forwardRef<HTMLSpanElement, IconProps>(
  ({ className, name, size, filled, style, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(iconVariants({ size, filled }), className)}
        style={{
          fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0",
          ...style,
        }}
        {...props}
      >
        {name}
      </span>
    );
  }
);
Icon.displayName = 'Icon';

export { Icon, iconVariants };
