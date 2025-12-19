'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onClose?: () => void;
  title: string;
  maxWidth?: 'sm' | 'md' | 'lg';
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, open = false, onClose, title, maxWidth = 'sm', children, ...props }, ref) => {
    const maxWidthClasses = {
      sm: 'max-w-[320px]',
      md: 'max-w-[340px]',
      lg: 'max-w-[400px]',
    };

    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onClose?.();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-[4px]"
          onClick={onClose}
        />

        {/* Modal shell */}
        <div
          ref={ref}
          className={cn(
            'relative w-full flex flex-col',
            'bg-[#0f0f0f] border border-[#222225]',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)]',
            'animate-modal-enter',
            'overflow-hidden max-h-[85vh]',
            maxWidthClasses[maxWidth],
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222225] shrink-0">
            <h2 className="text-white text-[16px] font-medium leading-none tracking-tight">
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#8b8b94] hover:text-white"
              onClick={onClose}
            >
              <Icon name="close" size="default" />
            </Button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    );
  }
);
Modal.displayName = 'Modal';

export { Modal };
