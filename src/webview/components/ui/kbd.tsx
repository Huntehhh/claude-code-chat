import * as React from 'react';
import { cn } from '../../lib/utils';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** Multiple keys to display with separator */
  keys?: string[];
  /** Separator between keys */
  separator?: string;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, keys, separator = '+', ...props }, ref) => {
    if (keys && keys.length > 0) {
      return (
        <span className="inline-flex items-center gap-1">
          {keys.map((key, index) => (
            <React.Fragment key={key}>
              <kbd
                ref={index === 0 ? ref : undefined}
                className={cn(
                  'inline-flex items-center justify-center min-w-[16px] px-1',
                  'bg-[#1e1e1e] border border-[#222225] rounded text-center',
                  'font-mono text-[10px] text-[#8b8b94]',
                  className
                )}
                {...props}
              >
                {key}
              </kbd>
              {index < keys.length - 1 && (
                <span className="text-[#52525b] text-[10px]">{separator}</span>
              )}
            </React.Fragment>
          ))}
        </span>
      );
    }

    return (
      <kbd
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center min-w-[16px] px-1',
          'bg-[#1e1e1e] border border-[#222225] rounded text-center',
          'font-mono text-[10px] text-[#8b8b94]',
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = 'Kbd';

export { Kbd };
