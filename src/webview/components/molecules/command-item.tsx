'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CommandItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string;
  command: string;
  description: string;
  isActive?: boolean;
}

const CommandItem = React.forwardRef<HTMLButtonElement, CommandItemProps>(
  ({ className, emoji, command, description, isActive = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-between px-4 py-2 w-full text-left',
          'transition-colors border-l-2',
          isActive
            ? 'bg-[#18181b] border-[#FFA344]'
            : 'border-transparent hover:bg-[#18181b] hover:border-[#FFA344]',
          'group',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg w-5 text-center">{emoji}</span>
          <div className="flex flex-col truncate">
            <span
              className={cn(
                'text-sm font-mono truncate',
                isActive
                  ? 'text-[#FFA344]'
                  : 'text-[#e4e4e7] group-hover:text-[#FFA344]'
              )}
            >
              {command}
            </span>
          </div>
        </div>
        <span
          className={cn(
            'text-xs shrink-0',
            isActive
              ? 'text-[#a1a1aa]'
              : 'text-[#52525b] group-hover:text-[#a1a1aa]'
          )}
        >
          {description}
        </span>
      </button>
    );
  }
);
CommandItem.displayName = 'CommandItem';

export { CommandItem };
