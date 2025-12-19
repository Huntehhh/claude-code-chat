'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const commandPillVariants = cva(
  'group flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 transition-all text-left cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[#18181b] hover:bg-[#222225] border border-[#222225] hover:border-[#3a3a3e]',
        add: 'bg-transparent hover:bg-[#18181b] border border-dashed border-[#3a3a3e] hover:border-[#FFA344] text-[#8b8b94] hover:text-[#FFA344]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CommandPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof commandPillVariants> {
  command?: string;
  label?: string;
  icon?: React.ReactNode;
}

const CommandPill = React.forwardRef<HTMLButtonElement, CommandPillProps>(
  ({ className, variant, command, label, icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(commandPillVariants({ variant, className }))}
        {...props}
      >
        {icon}
        {command && (
          <span className="font-mono text-xs text-[#FFA344]">{command}</span>
        )}
        {label && <span className="text-xs text-[#d4d4d8]">{label}</span>}
        {children}
      </button>
    );
  }
);
CommandPill.displayName = 'CommandPill';

export { CommandPill, commandPillVariants };
