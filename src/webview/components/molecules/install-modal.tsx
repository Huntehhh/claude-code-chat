'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';

export type InstallState = 'initial' | 'installing' | 'success';

export interface InstallModalProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: InstallState;
  onInstall?: () => void;
  onClose?: () => void;
  onViewDocs?: () => void;
}

const InstallModal = React.forwardRef<HTMLDivElement, InstallModalProps>(
  (
    { className, state = 'initial', onInstall, onClose, onViewDocs, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative w-[300px] bg-[#0f0f0f] border border-[#222225]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
          'flex flex-col overflow-hidden animate-modal-enter',
          className
        )}
        {...props}
      >
        {/* Close Button */}
        <button
          type="button"
          className="absolute top-3 right-3 text-[#8b8b94] hover:text-white transition-colors duration-200 z-10"
          onClick={onClose}
        >
          <Icon name="close" size="sm" />
        </button>

        {/* Initial State */}
        {state === 'initial' && (
          <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center">
            {/* Download Icon */}
            <div className="mb-5 text-[#FFA344]">
              <Icon name="download" className="!text-[40px]" />
            </div>

            {/* Text */}
            <h2 className="text-white text-[18px] font-medium leading-tight mb-2">
              Install Claude Code
            </h2>
            <p className="text-[#8b8b94] text-[13px] leading-normal mb-8">
              Required for this extension
            </p>

            {/* Install Button */}
            <Button
              variant="primary"
              className="w-full h-[44px] rounded-none text-sm font-bold tracking-wide"
              onClick={onInstall}
            >
              Install Now
            </Button>

            {/* Documentation Link */}
            <button
              type="button"
              className="mt-4 text-[#8b8b94] hover:text-[#fafafa] text-[13px] underline decoration-[#8b8b94]/50 transition-colors duration-200 bg-transparent border-0 cursor-pointer"
              onClick={onViewDocs}
            >
              View documentation
            </button>
          </div>
        )}

        {/* Installing State */}
        {state === 'installing' && (
          <div className="flex flex-col items-center justify-center min-h-[240px] px-6 py-10 text-center">
            {/* Spinner */}
            <div className="mb-6 relative w-[40px] h-[40px]">
              <svg
                className="animate-spin w-full h-full text-[#FFA344]"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-100"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  fill="currentColor"
                />
              </svg>
            </div>

            {/* Text */}
            <h2 className="text-white text-[14px] font-medium leading-tight mb-2">
              Installing...
            </h2>
            <p className="text-[#8b8b94] text-[12px] leading-normal">
              This may take a minute
            </p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="flex flex-col items-center justify-center min-h-[240px] px-6 py-10 text-center">
            {/* Success Icon with draw animation */}
            <div className="mb-5 text-[#FFA344] animate-checkmark">
              <svg
                fill="none"
                height="40"
                viewBox="0 0 40 40"
                width="40"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  className="opacity-100"
                  cx="20"
                  cy="20"
                  r="18"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path
                  d="M11 20L17 26L29 14"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  className="checkmark-path"
                />
              </svg>
            </div>

            {/* Text */}
            <h2 className="text-white text-[18px] font-medium leading-tight mb-2">
              Installation Complete
            </h2>
            <p className="text-[#8b8b94] text-[13px] leading-normal">
              Start chatting
            </p>
          </div>
        )}
      </div>
    );
  }
);
InstallModal.displayName = 'InstallModal';

export { InstallModal };
