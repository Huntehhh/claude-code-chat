'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface ServerCardProps extends React.HTMLAttributes<HTMLButtonElement> {
  emoji: string;
  title: string;
  description: string;
  onAdd?: () => void;
}

const ServerCard = React.forwardRef<HTMLButtonElement, ServerCardProps>(
  ({ className, emoji, title, description, onAdd, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'flex flex-col gap-1 p-2.5 rounded text-left',
          'bg-[#161618] border border-[#222225]/50',
          'hover:bg-[#1c1c1f] hover:border-[#FFA344]/30',
          'group transition-all',
          className
        )}
        onClick={onAdd}
        {...props}
      >
        <div className="flex items-center justify-between w-full">
          <span className="text-[20px] leading-none grayscale group-hover:grayscale-0 transition-all">
            {emoji}
          </span>
          <Icon
            name="add_circle"
            size="xs"
            className="text-[#8b8b94] opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
        <div>
          <div className="text-white text-[13px] font-medium mt-1">{title}</div>
          <div className="text-[#8b8b94] text-[11px] leading-tight mt-0.5 truncate">
            {description}
          </div>
        </div>
      </button>
    );
  }
);
ServerCard.displayName = 'ServerCard';

export { ServerCard };
