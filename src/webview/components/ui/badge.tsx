import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[#171717] text-[#8b8b94] border border-[#2a2a2e] rounded',
        // Message type badges
        chat:
          'bg-[#FFA344]/15 text-[#FFA344] border border-[#FFA344]/20 rounded',
        cli:
          'bg-[#9A6DD7]/15 text-[#9A6DD7] border border-[#9A6DD7]/20 rounded',
        // MCP server type badges
        http:
          'bg-[#FFA344]/10 text-[#FFA344] border border-[#FFA344]/20 rounded-[3px]',
        sse:
          'bg-[#a1a1a1]/10 text-[#a1a1a1] border border-[#a1a1a1]/20 rounded-[3px]',
        stdio:
          'bg-[#8b8b94]/10 text-[#8b8b94] border border-[#8b8b94]/20 rounded-[3px]',
        // Permission type badges
        read:
          'bg-[#171717] text-[#8b8b94] border border-[#2a2a2e] rounded',
        write:
          'bg-[#171717] text-[#8b8b94] border border-[#2a2a2e] rounded',
        exec:
          'bg-[#171717] text-[#8b8b94] border border-[#2a2a2e] rounded',
        // Tool badge (for permission dialogs)
        tool:
          'h-6 px-3 rounded-full bg-[#171717] text-[#FFA344] border border-white/5 shadow-sm',
        // Semantic badges
        outline:
          'border border-[#222225] text-[#8b8b94] rounded',
        success:
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded',
        error:
          'bg-[#FF7369]/10 text-[#FF7369] border border-[#FF7369]/20 rounded',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
