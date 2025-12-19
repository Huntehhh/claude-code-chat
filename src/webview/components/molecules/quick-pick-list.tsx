'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface QuickPickItem {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  thumbnail?: string;
}

export interface QuickPickListProps extends React.HTMLAttributes<HTMLDivElement> {
  items: QuickPickItem[];
  selectedId?: string;
  onSelect?: (item: QuickPickItem) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  showKeyboardHints?: boolean;
}

const QuickPickList = React.forwardRef<HTMLDivElement, QuickPickListProps>(
  (
    {
      className,
      items,
      selectedId,
      onSelect,
      searchValue = '',
      onSearchChange,
      placeholder = 'Search...',
      showKeyboardHints = true,
      ...props
    },
    ref
  ) => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    // Filter items based on search
    const filteredItems = React.useMemo(() => {
      if (!searchValue) return items;
      const lower = searchValue.toLowerCase();
      return items.filter(
        (item) =>
          item.label.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      );
    }, [items, searchValue]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[activeIndex]) {
            onSelect?.(filteredItems[activeIndex]);
          }
          break;
      }
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col', className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Search Area */}
        <div className="relative w-full border-b border-[#222225]">
          <div className="flex items-center px-3 py-3">
            <Icon name="search" className="text-[#8b8b94] mr-2" size="sm" />
            <input
              autoFocus
              className="w-full bg-transparent border-none p-0 text-[#E4E4E7] placeholder-[#52525b] text-sm focus:ring-0 focus:outline-none leading-normal"
              placeholder={placeholder}
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
        </div>

        {/* Item List */}
        <ul className="flex flex-col max-h-[320px] overflow-y-auto py-1">
          {filteredItems.map((item, index) => {
            const isActive = index === activeIndex || item.id === selectedId;
            return (
              <li
                key={item.id}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors',
                  isActive ? 'bg-[#FFA344]/10' : 'hover:bg-[#18181b]'
                )}
                onClick={() => onSelect?.(item)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FFA344]" />
                )}

                {/* Icon or Thumbnail */}
                <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded bg-[#1e1e1e] border border-[#222225] overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.label}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                    />
                  ) : item.icon ? (
                    <Icon
                      name={item.icon}
                      className={item.iconColor || 'text-blue-400'}
                      size="sm"
                    />
                  ) : (
                    <Icon name="description" className="text-[#8b8b94]" size="sm" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span
                    className={cn(
                      'text-sm font-medium leading-tight truncate',
                      isActive ? 'text-white' : 'text-[#E4E4E7]'
                    )}
                  >
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-xs text-[#52525b] leading-tight truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Footer / Keyboard Hints */}
        {showKeyboardHints && (
          <div className="px-3 py-2 border-t border-[#222225] bg-[#0f0f0f] flex justify-between items-center text-[10px] text-[#52525b]">
            <div className="flex gap-2">
              <span className="flex items-center gap-1">
                <kbd className="bg-[#1e1e1e] border border-[#222225] rounded px-1 min-w-[16px] text-center font-sans">
                  ↵
                </kbd>{' '}
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-[#1e1e1e] border border-[#222225] rounded px-1 min-w-[16px] text-center font-sans">
                  ↑↓
                </kbd>{' '}
                nav
              </span>
            </div>
            <div>
              <span className="flex items-center gap-1">
                <kbd className="bg-[#1e1e1e] border border-[#222225] rounded px-1 min-w-[16px] text-center font-sans">
                  esc
                </kbd>{' '}
                close
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
QuickPickList.displayName = 'QuickPickList';

export { QuickPickList };
