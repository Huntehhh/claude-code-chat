'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { StatusDot } from '../ui/status-dot';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export type McpServerType = 'stdio' | 'sse' | 'http';
export type McpServerStatus = 'running' | 'disabled' | 'error';

export interface McpServerCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Server name */
  name: string;
  /** Server type (stdio, sse, http) */
  type: McpServerType;
  /** Server status */
  status: McpServerStatus;
  /** Called when edit button is clicked */
  onEdit?: () => void;
  /** Called when toggle button is clicked */
  onToggle?: () => void;
  /** Called when delete button is clicked */
  onDelete?: () => void;
}

const McpServerCard = React.forwardRef<HTMLDivElement, McpServerCardProps>(
  ({ className, name, type, status, onEdit, onToggle, onDelete, ...props }, ref) => {
    const isActive = status === 'running';
    const statusText = status === 'running' ? 'Running' : status === 'disabled' ? 'Disabled' : 'Error';

    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex flex-col gap-3 p-3',
          'bg-[#171717] border border-[#222225] rounded-lg',
          'hover:border-[#333333] transition-all duration-200',
          !isActive && 'opacity-60 hover:opacity-100',
          className
        )}
        {...props}
      >
        {/* Top row: Status + Name + Type Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <StatusDot status={isActive ? 'active' : status === 'error' ? 'error' : 'disabled'} />
            <span className="text-[#fafafa] text-sm font-bold truncate">{name}</span>
          </div>
          <Badge variant={type as 'stdio' | 'sse'} className="shrink-0">
            {type}
          </Badge>
        </div>

        {/* Bottom row: Status text + Action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-[#222225]/50 mt-1">
          <div className="text-[11px] text-[#8b8b94]">{statusText}</div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-[#52525b] hover:text-[#fafafa]"
                onClick={onEdit}
                title="Edit Configuration"
              >
                <Icon name="edit" className="!text-[16px]" />
              </Button>
            )}
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'size-7',
                  isActive ? 'text-[#22c55e]' : 'text-[#52525b] hover:text-[#fafafa]'
                )}
                onClick={onToggle}
                title={isActive ? 'Disable Server' : 'Enable Server'}
              >
                <Icon name={isActive ? 'toggle_on' : 'toggle_off'} className="!text-[18px]" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-[#52525b] hover:text-[#FF7369]"
                onClick={onDelete}
                title="Delete Server"
              >
                <Icon name="delete" className="!text-[16px]" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
McpServerCard.displayName = 'McpServerCard';

export { McpServerCard };
