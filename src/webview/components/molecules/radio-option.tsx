'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface RadioOptionProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

const RadioOption = React.forwardRef<HTMLInputElement, RadioOptionProps>(
  ({ className, label, description, checked, ...props }, ref) => {
    return (
      <label
        className={cn(
          'group/item relative flex items-start gap-3 p-3 cursor-pointer select-none',
          'transition-all duration-150 border-l-[3px] border-transparent',
          'hover:bg-[#1a1a1a]',
          checked && 'bg-[#171717] border-[#FFA344]',
          className
        )}
      >
        <div className="mt-0.5 flex-shrink-0">
          <input
            ref={ref}
            type="radio"
            className={cn(
              'custom-radio h-4 w-4 appearance-none rounded-full border border-[#222225] bg-transparent',
              'focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer'
            )}
            checked={checked}
            {...props}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-white text-[14px] font-medium leading-tight mb-0.5">
            {label}
          </span>
          {description && (
            <span className="text-[#8b8b94] text-[13px] font-normal leading-tight">
              {description}
            </span>
          )}
        </div>
      </label>
    );
  }
);
RadioOption.displayName = 'RadioOption';

export { RadioOption };
