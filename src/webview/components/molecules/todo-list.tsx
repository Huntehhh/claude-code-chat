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
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const pendingCount = items.filter((i) => i.status !== 'completed').length;

    return (
      <div
        ref={ref}
        className={cn(
          'bg-[#0f0f0f] border border-[#222225]',
          className
        )}
        {...props}
      >
        {/* Header */}
        <button
          type="button"
          className="flex items-center justify-between w-full px-3 py-2 cursor-pointer bg-[#0f0f0f] hover:bg-white/5 transition-colors select-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Icon name="assignment" size="xs" className="text-white" />
            <span className="text-[13px] font-medium text-white">To-do</span>
            <Badge variant="chat" className="min-w-[20px] text-center">
              {pendingCount}
            </Badge>
          </div>
          <Icon
            name="expand_more"
            size="sm"
            className={cn(
              'text-[#8b8b94] transition-transform duration-200',
              isOpen ? 'rotate-0' : '-rotate-90'
            )}
          />
        </button>

        {/* Content */}
        {isOpen && (
          <div className="max-h-[150px] overflow-y-auto px-3 pb-2 border-t border-[#222225]/50">
            <div className="flex flex-col gap-1 pt-1">
              {items.map((item) => {
                const { name, className: iconClassName } = getStatusIcon(item.status);
                const isCompleted = item.status === 'completed';

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(
                      'flex items-start gap-2.5 py-1 text-left w-full hover:bg-white/5 rounded transition-colors',
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
          </div>
        )}
      </div>
    );
  }
);
TodoList.displayName = 'TodoList';

export { TodoList };
