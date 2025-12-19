import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CodeInlineProps
  extends React.HTMLAttributes<HTMLElement> {}

const CodeInline = React.forwardRef<HTMLElement, CodeInlineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <code
        ref={ref}
        className={cn(
          'bg-white/10 px-1 py-0.5 rounded text-[13px] font-mono',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  }
);
CodeInline.displayName = 'CodeInline';

export { CodeInline };
