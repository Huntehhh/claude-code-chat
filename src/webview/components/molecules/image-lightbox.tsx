'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Icon } from '../ui/icon';

export interface ImageLightboxProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether the lightbox is open */
  open: boolean;
  /** Callback when the lightbox should close */
  onClose: () => void;
}

const ImageLightbox = React.forwardRef<HTMLDivElement, ImageLightboxProps>(
  ({ src, alt = 'Image preview', open, onClose }, ref) => {
    // Close on escape key
    React.useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Close button */}
        <button
          type="button"
          className={cn(
            'absolute top-4 right-4 z-10',
            'flex items-center justify-center size-10 rounded-full',
            'bg-[#171717]/80 hover:bg-[#222225] border border-[#333]',
            'text-[#8b8b94] hover:text-white transition-all cursor-pointer'
          )}
          onClick={onClose}
          aria-label="Close preview"
        >
          <Icon name="close" className="!text-[20px]" />
        </button>

        {/* Image container */}
        <div
          className="relative z-10 max-w-[90vw] max-h-[90vh] p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
          />
        </div>
      </div>
    );
  }
);

ImageLightbox.displayName = 'ImageLightbox';

export { ImageLightbox };
