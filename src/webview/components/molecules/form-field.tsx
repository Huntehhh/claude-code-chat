import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, helper, error, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col gap-1', className)}
        {...props}
      >
        {label && (
          <label className="text-[13px] text-gray-300">{label}</label>
        )}
        {children}
        {helper && !error && (
          <span className="text-[11px] text-[#52525b]">{helper}</span>
        )}
        {error && (
          <span className="text-[11px] text-[#FF7369]">{error}</span>
        )}
      </div>
    );
  }
);
FormField.displayName = 'FormField';

export { FormField };
