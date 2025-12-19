'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export interface CheckpointItemProps extends React.HTMLAttributes<HTMLDivElement> {
  hash: string;
  description: string;
  timestamp: string;
  onRestore?: () => void;
}

const CheckpointItem = React.forwardRef<HTMLDivElement, CheckpointItemProps>(
  ({ className, hash, description, timestamp, onRestore, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group/checkpoint relative flex items-center gap-3 py-1.5 px-3 pl-[34px]',
          'hover:bg-[#171717] cursor-pointer',
          className
        )}
        {...props}
      >
        <span className="font-mono text-[11px] text-[#8b8b94]">{hash}</span>
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="text-[12px] text-gray-300 truncate">{description}</span>
          <span className="text-[10px] text-[#52525b]">{timestamp}</span>
        </div>
        {onRestore && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'opacity-0 group-hover/checkpoint:opacity-100',
              'absolute right-2',
              'bg-[#FFA344]/10 hover:bg-[#FFA344]/20',
              'text-[#FFA344] text-[10px] font-medium',
              'px-2 py-0.5 h-auto',
              'border border-[#FFA344]/20',
              'transition-all'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRestore();
            }}
          >
            Restore
          </Button>
        )}
      </div>
    );
  }
);
CheckpointItem.displayName = 'CheckpointItem';

export { CheckpointItem };
