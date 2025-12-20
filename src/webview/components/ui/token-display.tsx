'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Icon } from './icon';

// =============================================================================
// TokenBadge Variants (CVA)
// =============================================================================

const tokenBadgeVariants = cva(
  // Base styles
  'group relative flex h-6 cursor-pointer select-none items-center justify-center gap-[6px] px-[6px] transition-all duration-150',
  {
    variants: {
      state: {
        idle: [
          'rounded-none bg-[#171717] border border-[#222225]',
          'hover:border-[#FFA344]/50 hover:text-white',
          'active:bg-[#1a1a1a] active:border-[#FFA344]',
        ].join(' '),
        streaming: [
          'rounded-full bg-transparent',
          'border border-[#FFA344]/45',
          'shadow-[0_0_8px_rgba(255,163,68,0.2)]',
        ].join(' '),
      },
    },
    defaultVariants: {
      state: 'idle',
    },
  }
);

// =============================================================================
// TokenRow Component (Molecule)
// =============================================================================

interface TokenRowProps {
  label: string;
  value: string | number;
  variant?: 'token' | 'cost' | 'total';
  className?: string;
}

const TokenRow: React.FC<TokenRowProps> = ({
  label,
  value,
  variant = 'token',
  className,
}) => {
  const valueStyles = {
    token: 'text-[#FFA344] font-normal',
    cost: 'text-[#8b8b94] font-normal',
    total: 'text-[#fafafa] font-medium',
  };

  const labelStyles = {
    token: 'font-normal',
    cost: 'font-normal',
    total: 'font-medium',
  };

  return (
    <div
      className={cn(
        'flex justify-between items-center text-[13px]',
        variant === 'total' && 'mt-1',
        className
      )}
    >
      <span className={cn('text-[#fafafa]', labelStyles[variant])}>{label}</span>
      <span className={cn('font-mono', valueStyles[variant])}>{value}</span>
    </div>
  );
};

// =============================================================================
// TokenSection Component (Molecule)
// =============================================================================

interface TokenSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const TokenSection: React.FC<TokenSectionProps> = ({
  title,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <h3 className="text-[#8b8b94] text-[11px] font-normal uppercase tracking-[0.5px]">
        {title}
      </h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
};

// =============================================================================
// TokenDisplay Component (Organism)
// =============================================================================

export interface TokenDisplayProps
  extends Omit<React.HTMLAttributes<HTMLDetailsElement>, 'children'>,
    VariantProps<typeof tokenBadgeVariants> {
  /** Total input/prompt tokens */
  inputTokens: number;
  /** Total output/completion tokens */
  outputTokens: number;
  /** Total cost in USD (optional) */
  totalCost?: number;
  /** Whether streaming/processing is active */
  isStreaming?: boolean;
  /** Format for displaying token counts */
  formatTokens?: (count: number) => string;
  /** Link click handler for settings */
  onSettingsClick?: () => void;
}

/**
 * Format large numbers with k/M suffix
 */
const defaultFormatTokens = (count: number): string => {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}k`;
  }
  return count.toLocaleString();
};

/**
 * Format number with thousands separators
 */
const formatWithCommas = (count: number): string => {
  return count.toLocaleString();
};

/**
 * Format cost in USD
 */
const formatCost = (cost: number): string => {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
};

const TokenDisplay = React.forwardRef<HTMLDetailsElement, TokenDisplayProps>(
  (
    {
      className,
      state,
      inputTokens,
      outputTokens,
      totalCost,
      isStreaming = false,
      formatTokens = defaultFormatTokens,
      onSettingsClick,
      ...props
    },
    ref
  ) => {
    const detailsRef = React.useRef<HTMLDetailsElement>(null);
    const totalTokens = inputTokens + outputTokens;
    const currentState = isStreaming ? 'streaming' : (state ?? 'idle');

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          detailsRef.current &&
          !detailsRef.current.contains(event.target as Node)
        ) {
          detailsRef.current.open = false;
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <details
        ref={(node) => {
          (
            detailsRef as React.MutableRefObject<HTMLDetailsElement | null>
          ).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn('relative', className)}
        {...props}
      >
        {/* Badge Trigger */}
        <summary
          className={cn(
            tokenBadgeVariants({ state: currentState }),
            'list-none' // Remove default marker
          )}
        >
          {/* Token Icon */}
          <Icon
            name="monetization_on"
            filled
            className={cn(
              'text-[14px]',
              currentState === 'streaming'
                ? 'text-[#FFA344] scale-105'
                : 'text-[#FFA344]'
            )}
          />

          {/* Token Count */}
          <span
            className={cn(
              'font-mono text-[11px] font-medium leading-none transition-colors duration-150',
              currentState === 'streaming'
                ? 'text-[#FFA344]'
                : 'text-[#8b8b94] group-hover:text-[#fafafa]'
            )}
          >
            {formatTokens(totalTokens)}
          </span>

          {/* Chevron */}
          <Icon
            name="expand_more"
            className={cn(
              'text-[10px] pt-[1px] transition-colors duration-150',
              currentState === 'streaming'
                ? 'text-[#FFA344]/80'
                : 'text-[#8b8b94] group-hover:text-[#fafafa]'
            )}
          />
        </summary>

        {/* Popover Panel */}
        <div
          className={cn(
            'absolute z-50 bottom-full left-0 mb-2',
            'w-[280px] bg-[#0f0f0f] border border-[#FFA344]',
            'shadow-[0_4px_16px_rgba(0,0,0,0.4)] p-3'
          )}
        >
          {/* Section: Current Conversation */}
          <TokenSection title="Current Conversation">
            <TokenRow
              label="Prompt tokens:"
              value={formatWithCommas(inputTokens)}
              variant="token"
            />
            <TokenRow
              label="Completion tokens:"
              value={formatWithCommas(outputTokens)}
              variant="token"
            />
            <TokenRow
              label="Total:"
              value={formatWithCommas(totalTokens)}
              variant="total"
            />
          </TokenSection>

          {/* Separator */}
          <div className="h-px w-full bg-[#222225] my-3" />

          {/* Section: Pricing (only if totalCost provided) */}
          {totalCost !== undefined && (
            <>
              <TokenSection title="Pricing">
                <TokenRow
                  label="Total cost:"
                  value={formatCost(totalCost)}
                  variant="total"
                />
              </TokenSection>

              {/* Separator */}
              <div className="h-px w-full bg-[#222225] my-3" />
            </>
          )}

          {/* Footer Link */}
          {onSettingsClick && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onSettingsClick();
                if (detailsRef.current) {
                  detailsRef.current.open = false;
                }
              }}
              className="block text-[12px] text-[#FFA344] hover:text-[#fafafa] transition-colors duration-200"
            >
              Manage token settings
            </button>
          )}
        </div>
      </details>
    );
  }
);

TokenDisplay.displayName = 'TokenDisplay';

export { TokenDisplay, tokenBadgeVariants, TokenRow, TokenSection };
