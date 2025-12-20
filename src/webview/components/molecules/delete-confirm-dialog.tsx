'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';

export interface DeleteConfirmDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog should close */
  onClose: () => void;
  /** Called when delete is confirmed */
  onConfirm: () => void;
  /** Name of the item being deleted */
  itemName: string;
  /** Dialog title */
  title?: string;
  /** Custom message (overrides default) */
  message?: string;
}

const DeleteConfirmDialog = React.forwardRef<HTMLDivElement, DeleteConfirmDialogProps>(
  (
    {
      className,
      open,
      onClose,
      onConfirm,
      itemName,
      title = 'Delete Server?',
      message,
      ...props
    },
    ref
  ) => {
    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onClose();
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

    const displayMessage = message || `This will remove ${itemName} from your configuration.`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative flex flex-col items-center w-[280px]',
            'bg-[#171717] border border-[#222225] rounded-xl',
            'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
            'p-6 text-center',
            'animate-modal-enter',
            className
          )}
          {...props}
        >
          {/* Warning Icon */}
          <div className="flex items-center justify-center mb-3">
            <Icon name="warning" className="!text-[32px] text-[#FFA344]" />
          </div>

          {/* Title */}
          <h3 className="text-[#fafafa] text-[16px] font-bold leading-tight">
            {title}
          </h3>

          {/* Message */}
          <p className="text-[#8b8b94] text-[13px] font-normal leading-normal mt-2">
            This will remove <span className="text-[#fafafa]">{itemName}</span> from your configuration.
          </p>

          {/* Buttons */}
          <div className="flex w-full mt-4 gap-3">
            <Button
              variant="secondary"
              className="flex-1 h-8 text-[13px] bg-[#222225] hover:bg-[#333333] text-[#8b8b94]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-8 text-[13px] font-bold"
              onClick={onConfirm}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }
);
DeleteConfirmDialog.displayName = 'DeleteConfirmDialog';

export { DeleteConfirmDialog };
