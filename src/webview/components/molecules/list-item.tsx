'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: string | React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  active?: boolean;
  selected?: boolean;
  variant?: 'default' | 'file' | 'conversation' | 'command' | 'server';
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  ({
    className,
    icon,
    iconColor,
    title,
    subtitle,
    meta,
    actions,
    active = false,
    selected = false,
    variant = 'default',
    onClick,
    ...props
  }, ref) => {
    const renderIcon = () => {
      if (!icon) return null;

      if (typeof icon === 'string') {
        return (
          <div className={cn(
            'flex items-center justify-center shrink-0 w-8 h-8 rounded bg-[#1e1e1e] border border-[#222225]',
            variant === 'server' && 'bg-[#2A2A2D] text-white'
          )}>
            <Icon name={icon} size="default" className={iconColor} />
          </div>
        );
      }

      return icon;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'group relative flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
          'hover:bg-[#18181b]',
          active && 'bg-[#FFA344]/10',
          selected && 'bg-[#171717]',
          active && 'border-l-2 border-[#FFA344]',
          !active && 'border-l-2 border-transparent',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FFA344]" />
        )}

        {/* Icon */}
        {renderIcon()}

        {/* Content */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className={cn(
            'text-[14px] font-medium leading-tight truncate',
            active ? 'text-white' : 'text-[#E4E4E7] group-hover:text-white'
          )}>
            {title}
          </span>
          {subtitle && (
            <span className="text-[12px] text-[#52525b] leading-tight truncate">
              {subtitle}
            </span>
          )}
        </div>

        {/* Meta info */}
        {meta && (
          <div className="flex items-center gap-2 shrink-0 text-[#8b8b94]">
            {meta}
          </div>
        )}

        {/* Actions (hover visible) */}
        {actions && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

export { ListItem };
