import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#FFA344] text-[#09090b] shadow hover:bg-[#FFA344]/90',
        destructive:
          'bg-[#FF7369] text-white shadow-sm hover:bg-[#FF7369]/90',
        outline:
          'border border-[#222225] bg-transparent text-[#fafafa] shadow-sm hover:bg-[#171717] hover:text-white',
        secondary:
          'bg-[#171717] text-[#fafafa] shadow-sm hover:bg-[#222225]',
        ghost:
          'text-[#8b8b94] hover:bg-white/5 hover:text-[#fafafa]',
        link:
          'text-[#FFA344] underline-offset-4 hover:underline',
        accent:
          'bg-[#FFA344] text-[#09090b] font-bold rounded-full hover:bg-[#FFA344]/90',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
