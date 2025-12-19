'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FileMentionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  path: string;
}

const FileMention = React.forwardRef<HTMLButtonElement, FileMentionProps>(
  ({ className, path, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono',
          'bg-[#FFA344]/10 text-[#FFA344]',
          'hover:bg-[#FFA344]/20 transition-colors cursor-pointer',
          className
        )}
        onClick={onClick}
        {...props}
      >
        @{path}
      </button>
    );
  }
);
FileMention.displayName = 'FileMention';

export { FileMention };
