'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SnippetButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string;
  label: string;
}

const SnippetButton = React.forwardRef<HTMLButtonElement, SnippetButtonProps>(
  ({ className, emoji, label, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-sm',
          'hover:bg-[#18181b] group text-left transition-colors',
          className
        )}
        {...props}
      >
        <span className="text-base">{emoji}</span>
        <span className="text-xs font-medium text-[#d4d4d8] group-hover:text-white">
          {label}
        </span>
      </button>
    );
  }
);
SnippetButton.displayName = 'SnippetButton';

export { SnippetButton };
