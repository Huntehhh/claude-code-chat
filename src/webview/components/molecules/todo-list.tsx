'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Badge } from '../ui/badge';

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
}

export interface TodoListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TodoItem[];
  defaultOpen?: boolean;
  onItemClick?: (item: TodoItem) => void;
}

const getStatusIcon = (status: TodoStatus): { name: string; className: string } => {
  switch (status) {
    case 'in_progress':
      return { name: 'emergency', className: 'text-[#FFA344] animate-pulse' };
    case 'completed':
      return { name: 'check_circle', className: 'text-[#8b8b94]' };
    case 'pending':
    default:
      return { name: 'hourglass_empty', className: 'text-[#8b8b94]' };
  }
};

const TodoList = React.forwardRef<HTMLDivElement, TodoListProps>(
  ({ className, items, defaultOpen = true, onItemClick, ...props }, ref) => {
    // Always show all items - no collapsing

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1',
          className
        )}
        {...props}
      >
        {/* Todo items - no header, displayed inline */}
        {items.map((item) => {
          const { name, className: iconClassName } = getStatusIcon(item.status);
          const isCompleted = item.status === 'completed';

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                'flex items-start gap-2.5 py-0.5 text-left w-full hover:bg-white/5 rounded transition-colors',
                isCompleted && 'opacity-60'
              )}
              onClick={() => onItemClick?.(item)}
            >
              <Icon
                name={name}
                size="xs"
                className={cn('mt-0.5', iconClassName)}
              />
              <span
                className={cn(
                  'text-[13px] leading-tight',
                  isCompleted
                    ? 'text-[#8b8b94] line-through'
                    : 'text-white'
                )}
              >
                {item.content}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);
TodoList.displayName = 'TodoList';

export { TodoList };
