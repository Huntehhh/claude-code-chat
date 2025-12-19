'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

export type ThinkLevel = 0 | 1 | 2 | 3;

const THINK_LABELS: Record<ThinkLevel, string> = {
  0: 'Think',
  1: 'Hard',
  2: 'Harder',
  3: 'Ultra',
};

export interface ThinkIntensitySliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: ThinkLevel;
  onChange?: (value: ThinkLevel) => void;
  onConfirm?: (value: ThinkLevel) => void;
  showConfirmButton?: boolean;
}

const ThinkIntensitySlider = React.forwardRef<HTMLDivElement, ThinkIntensitySliderProps>(
  (
    {
      className,
      value = 1,
      onChange,
      onConfirm,
      showConfirmButton = true,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<ThinkLevel>(value);

    React.useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (newValue: ThinkLevel) => {
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(parseInt(e.target.value, 10) as ThinkLevel);
    };

    const handleLabelClick = (level: ThinkLevel) => {
      handleChange(level);
    };

    // Calculate fill percentage based on value (0-3 mapped to 0-100%)
    const fillPercentage = (internalValue / 3) * 100;

    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-6', className)}
        {...props}
      >
        {/* Description */}
        <p className="text-[#8b8b94] text-[12px] leading-relaxed">
          Higher = deeper reasoning, more tokens
        </p>

        {/* Slider Container */}
        <div className="flex flex-col gap-4">
          {/* Slider Track */}
          <div className="relative h-6 flex items-center group">
            {/* Hidden native input for accessibility */}
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={internalValue}
              onChange={handleSliderChange}
              aria-label="Thinking Depth"
              className="absolute w-full h-full opacity-0 z-20 cursor-pointer"
            />

            {/* Track Background */}
            <div className="w-full h-[4px] bg-[#222225] rounded-full absolute z-0 top-1/2 -translate-y-1/2" />

            {/* Active Fill */}
            <div
              className="h-[4px] bg-[#FFA344] shadow-[0_0_8px_rgba(245,158,11,0.2)] rounded-full absolute z-0 top-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ width: `${fillPercentage}%` }}
            />

            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[20px] h-[20px] bg-[#fafafa] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] z-10 pointer-events-none transition-all duration-200"
              style={{ left: `${fillPercentage}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex justify-between text-[12px] font-normal px-[2px]">
            {([0, 1, 2, 3] as ThinkLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleLabelClick(level)}
                className={cn(
                  'bg-transparent border-0 cursor-pointer transition-colors p-0',
                  level === internalValue
                    ? 'text-[#fafafa] font-medium'
                    : 'text-[#8b8b94] hover:text-white'
                )}
              >
                {THINK_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        {showConfirmButton && (
          <Button
            variant="primary"
            className="w-full h-12 rounded-none text-sm font-bold"
            onClick={() => onConfirm?.(internalValue)}
          >
            Confirm
          </Button>
        )}
      </div>
    );
  }
);
ThinkIntensitySlider.displayName = 'ThinkIntensitySlider';

export { ThinkIntensitySlider };
