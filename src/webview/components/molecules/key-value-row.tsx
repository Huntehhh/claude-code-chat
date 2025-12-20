'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface KeyValueRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Key field value */
  keyValue: string;
  /** Value field value */
  valueValue: string;
  /** Called when key changes */
  onKeyChange: (key: string) => void;
  /** Called when value changes */
  onValueChange: (value: string) => void;
  /** Called when delete button is clicked */
  onDelete?: () => void;
  /** Key field placeholder */
  keyPlaceholder?: string;
  /** Value field placeholder */
  valuePlaceholder?: string;
  /** Whether value should be masked (password-style) */
  maskValue?: boolean;
}

const KeyValueRow = React.forwardRef<HTMLDivElement, KeyValueRowProps>(
  (
    {
      className,
      keyValue,
      valueValue,
      onKeyChange,
      onValueChange,
      onDelete,
      keyPlaceholder = 'KEY',
      valuePlaceholder = 'value',
      maskValue = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('flex gap-2 items-center group', className)}
        {...props}
      >
        <Input
          type="text"
          value={keyValue}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder={keyPlaceholder}
          className="w-[120px] h-8 text-xs font-mono text-[#FFA344] rounded"
        />
        <Input
          type={maskValue ? 'password' : 'text'}
          value={valueValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={valuePlaceholder}
          className="flex-1 min-w-0 h-8 text-xs text-[#8b8b94] rounded"
        />
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 opacity-0 group-hover:opacity-100 text-[#8b8b94] hover:text-[#FF7369] transition-all"
            onClick={onDelete}
            aria-label="Delete row"
          >
            <Icon name="delete" className="!text-[18px]" />
          </Button>
        )}
      </div>
    );
  }
);
KeyValueRow.displayName = 'KeyValueRow';

export { KeyValueRow };
