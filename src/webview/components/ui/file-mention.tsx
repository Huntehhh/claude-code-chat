'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FileMentionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  path: string;
  /** Callback when the file mention is clicked */
  onOpenFile?: (filePath: string) => void;
}

const FileMention = React.forwardRef<HTMLButtonElement, FileMentionProps>(
  ({ className, path, onClick, onOpenFile, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onOpenFile) {
        onOpenFile(path);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono',
          'bg-[#FFA344]/10 text-[#FFA344]',
          'hover:bg-[#FFA344]/20 hover:underline transition-colors cursor-pointer',
          className
        )}
        onClick={handleClick}
        {...props}
      >
        @{path}
      </button>
    );
  }
);
FileMention.displayName = 'FileMention';

export { FileMention };
