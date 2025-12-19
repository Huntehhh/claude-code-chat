'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const dropdownTriggerVariants = cva(
  'list-none flex items-center cursor-pointer select-none outline-none transition-all duration-150',
  {
    variants: {
      variant: {
        default: 'bg-[#171717] border border-[#222225] hover:bg-[#1f1f1f] hover:border-[#333]',
        ghost: 'bg-transparent hover:bg-[#171717]',
      },
      size: {
        default: 'h-[28px] px-2 text-[11px]',
        sm: 'h-6 px-1.5 text-[10px]',
        lg: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const dropdownMenuVariants = cva(
  'absolute z-50 flex flex-col bg-[#0f0f0f] border border-[#222225] shadow-[0_4px_16px_rgba(0,0,0,0.4)] py-1',
  {
    variants: {
      position: {
        above: 'bottom-full left-0 mb-1',
        below: 'top-full left-0 mt-1',
      },
    },
    defaultVariants: {
      position: 'above',
    },
  }
);

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string | number;
}

export interface DropdownProps
  extends Omit<React.HTMLAttributes<HTMLDetailsElement>, 'onChange'>,
    VariantProps<typeof dropdownTriggerVariants> {
  /** Options to display in the dropdown */
  options: DropdownOption[];
  /** Currently selected value */
  value?: string;
  /** Callback when selection changes */
  onChange?: (value: string) => void;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Menu position relative to trigger */
  menuPosition?: 'above' | 'below';
  /** Minimum width for the dropdown menu */
  menuMinWidth?: number;
  /** Show checkmark on selected item */
  showCheckmark?: boolean;
}

const Dropdown = React.forwardRef<HTMLDetailsElement, DropdownProps>(
  (
    {
      className,
      variant,
      size,
      options,
      value,
      onChange,
      placeholder = 'Select...',
      menuPosition = 'above',
      menuMinWidth = 120,
      showCheckmark = true,
      ...props
    },
    ref
  ) => {
    const detailsRef = React.useRef<HTMLDetailsElement>(null);
    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      // Close the details element
      if (detailsRef.current) {
        detailsRef.current.open = false;
      }
    };

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) {
          detailsRef.current.open = false;
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <details
        ref={(node) => {
          (detailsRef as React.MutableRefObject<HTMLDetailsElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn('relative', className)}
        {...props}
      >
        <summary
          className={cn(
            dropdownTriggerVariants({ variant, size }),
            'font-medium text-[#a1a1a1]'
          )}
        >
          {selectedOption?.label || placeholder}
          <span className="text-[10px] text-[#52525b] ml-1">▾</span>
        </summary>
        <div
          className={cn(dropdownMenuVariants({ position: menuPosition }))}
          style={{ minWidth: menuMinWidth }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'h-8 px-3 text-[13px] text-[#fafafa] flex items-center justify-between w-full text-left transition-colors',
                  'border-l-2',
                  isSelected
                    ? 'border-[#FFA344] bg-[#171717]'
                    : 'border-transparent hover:bg-[#171717]'
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span className="flex items-center gap-2">
                  {option.label}
                  {option.badge !== undefined && (
                    <span className="bg-[#171717] text-[#8b8b94] text-[10px] px-1.5 py-0.5 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </span>
                {showCheckmark && isSelected && (
                  <span className="text-[#FFA344] text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </details>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export { Dropdown, dropdownTriggerVariants, dropdownMenuVariants };
