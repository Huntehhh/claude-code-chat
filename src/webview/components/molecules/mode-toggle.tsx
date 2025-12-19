'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ModeToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  active?: boolean;
}

const ModeToggle = React.forwardRef<HTMLButtonElement, ModeToggleProps>(
  ({ className, label, active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'group flex items-center gap-1.5 px-3 h-7 rounded-full',
          'bg-[#171717] border border-[#222225]',
          'hover:border-[#FFA344]/50',
          'text-[#8b8b94] hover:text-[#fafafa]',
          'transition-all cursor-pointer select-none',
          active && 'border-[#FFA344]/50 text-[#fafafa]',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-colors',
            active ? 'bg-[#FFA344]' : 'bg-[#52525b] group-hover:bg-[#FFA344]'
          )}
        />
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  }
);
ModeToggle.displayName = 'ModeToggle';

export { ModeToggle };
