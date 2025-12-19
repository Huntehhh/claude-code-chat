'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div
        className={cn(
          'flex items-center w-full h-9 bg-[#171717] rounded border border-[#222225]',
          'focus-within:border-[#FFA344]/50 focus-within:ring-1 focus-within:ring-[#FFA344]/20',
          'transition-all',
          className
        )}
      >
        <Icon
          name="search"
          size="sm"
          className="text-[#8b8b94] pl-2.5"
        />
        <input
          ref={ref}
          type="text"
          className={cn(
            'w-full bg-transparent border-none text-[13px] text-white',
            'placeholder-[#52525b] focus:ring-0 h-full py-1 pl-2 pr-3'
          )}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';

export { SearchInput };
