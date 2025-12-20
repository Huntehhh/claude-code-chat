'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Chip, AddChip } from '../ui/chip';

export interface ChipInputProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of chip values */
  values: string[];
  /** Called when values change */
  onChange: (values: string[]) => void;
  /** Placeholder for new chip input */
  placeholder?: string;
  /** Show values in monospace font */
  mono?: boolean;
}

const ChipInput = React.forwardRef<HTMLDivElement, ChipInputProps>(
  ({ className, values, onChange, placeholder = 'Add argument', mono = true, ...props }, ref) => {
    const [isAdding, setIsAdding] = React.useState(false);
    const [newValue, setNewValue] = React.useState('');
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleRemove = (index: number) => {
      const newValues = [...values];
      newValues.splice(index, 1);
      onChange(newValues);
    };

    const handleAdd = () => {
      if (newValue.trim()) {
        onChange([...values, newValue.trim()]);
        setNewValue('');
      }
      setIsAdding(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      } else if (e.key === 'Escape') {
        setNewValue('');
        setIsAdding(false);
      }
    };

    React.useEffect(() => {
      if (isAdding && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isAdding]);

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap gap-[6px]', className)}
        {...props}
      >
        {values.map((value, index) => (
          <Chip
            key={`${value}-${index}`}
            label={value}
            mono={mono}
            onRemove={() => handleRemove(index)}
          />
        ))}
        {isAdding ? (
          <div className="flex items-center gap-1 bg-[#222225] rounded-full pl-3 pr-1 py-1">
            <input
              ref={inputRef}
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAdd}
              placeholder={placeholder}
              className={cn(
                'bg-transparent border-none outline-none text-xs text-[#fafafa] placeholder:text-[#52525b] w-20',
                mono && 'font-mono'
              )}
            />
          </div>
        ) : (
          <AddChip onClick={() => setIsAdding(true)} />
        )}
      </div>
    );
  }
);
ChipInput.displayName = 'ChipInput';

export { ChipInput };
