'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const imageThumbnailVariants = cva(
  'relative w-[48px] h-[48px] border bg-cover bg-center bg-no-repeat cursor-pointer transition-all duration-150 ease-out group',
  {
    variants: {
      variant: {
        default: 'border-[#222225] hover:border-[rgba(255,163,68,0.5)] hover:brightness-105',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ImageAttachmentItem {
  /** Unique identifier for the image */
  id: string;
  /** Image source URL or data URL */
  src: string;
  /** Alt text for accessibility */
  alt?: string;
}

export interface ImageAttachmentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof imageThumbnailVariants> {
  /** Array of images to display */
  images: ImageAttachmentItem[];
  /** Maximum visible thumbnails before showing overflow badge */
  maxVisible?: number;
  /** Callback when remove button is clicked */
  onRemove?: (id: string) => void;
  /** Callback when thumbnail is clicked */
  onImageClick?: (id: string) => void;
}

const ImageAttachment = React.forwardRef<HTMLDivElement, ImageAttachmentProps>(
  (
    {
      className,
      variant,
      images,
      maxVisible = 4,
      onRemove,
      onImageClick,
      ...props
    },
    ref
  ) => {
    const visibleImages = images.slice(0, maxVisible);
    const overflowCount = images.length - maxVisible;

    return (
      <div
        ref={ref}
        className={cn('flex flex-row gap-[6px]', className)}
        {...props}
      >
        {visibleImages.map((image, index) => {
          const isLastVisible = index === maxVisible - 1;
          const showOverflow = isLastVisible && overflowCount > 0;

          return (
            <div
              key={image.id}
              className={cn(imageThumbnailVariants({ variant }))}
              style={{ backgroundImage: `url('${image.src}')` }}
              onClick={() => onImageClick?.(image.id)}
              role="button"
              tabIndex={0}
              aria-label={image.alt || `Image ${index + 1}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onImageClick?.(image.id);
                }
              }}
            >
              {/* Remove Button */}
              <button
                type="button"
                className={cn(
                  'absolute -top-[6px] -right-[6px] z-10',
                  'w-4 h-4 rounded-full',
                  'bg-[#FF7369] hover:brightness-110',
                  'flex items-center justify-center',
                  'shadow-[0_1px_3px_rgba(0,0,0,0.3)]',
                  'transition-all duration-150',
                  'focus:outline-none focus:ring-2 focus:ring-[#FF7369]/50'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(image.id);
                }}
                aria-label={`Remove ${image.alt || 'image'}`}
              >
                <span className="text-white text-[10px] font-bold leading-none">
                  ×
                </span>
              </button>

              {/* Overflow Badge */}
              {showOverflow && (
                <div
                  className={cn(
                    'absolute bottom-0 right-0 m-0.5',
                    'bg-[rgba(0,0,0,0.7)] backdrop-blur-[1px]',
                    'text-white text-[10px] font-semibold',
                    'px-[3px] py-[1px] rounded-[2px]',
                    'leading-none'
                  )}
                >
                  +{overflowCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);

ImageAttachment.displayName = 'ImageAttachment';

export { ImageAttachment, imageThumbnailVariants };
