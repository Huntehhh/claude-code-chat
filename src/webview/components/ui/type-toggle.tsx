'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TypeToggleOption<T extends string = string> {
  value: T;
  label: string;
}

export interface TypeToggleProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Available options */
  options: TypeToggleOption<T>[];
  /** Currently selected value */
  value: T;
  /** Called when selection changes */
  onChange: (value: T) => void;
  /** Full width toggle */
  fullWidth?: boolean;
}

function TypeToggleInner<T extends string = string>(
  { className, options, value, onChange, fullWidth = true, ...props }: TypeToggleProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex bg-[#222225] p-1 rounded-lg',
        fullWidth && 'w-full',
        className
      )}
      role="radiogroup"
      {...props}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium rounded text-center transition-all',
              isSelected
                ? 'bg-[#FFA344] text-[#0f0f0f] shadow-sm'
                : 'text-[#8b8b94] hover:text-[#fafafa]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Use type assertion for forwardRef with generics
const TypeToggle = React.forwardRef(TypeToggleInner) as <T extends string = string>(
  props: TypeToggleProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export { TypeToggle };
