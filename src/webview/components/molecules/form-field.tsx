import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const formFieldVariants = cva('flex flex-col', {
  variants: {
    spacing: {
      default: 'gap-1',
      compact: 'gap-0.5',
      spacious: 'gap-2',
    },
  },
  defaultVariants: {
    spacing: 'default',
  },
});

const labelVariants = cva('', {
  variants: {
    variant: {
      default: 'text-[13px] text-gray-300',
      uppercase: 'text-[11px] font-semibold text-[#52525b] uppercase tracking-wider',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface FormFieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof formFieldVariants> {
  label?: string;
  helper?: string;
  error?: string;
  /** Label style variant */
  labelVariant?: 'default' | 'uppercase';
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, spacing, label, helper, error, labelVariant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(formFieldVariants({ spacing }), className)}
        {...props}
      >
        {label && (
          <label className={labelVariants({ variant: labelVariant })}>{label}</label>
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

export { FormField, formFieldVariants, labelVariants };
