'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { ThinkIntensitySlider, type ThinkLevel } from '../molecules/think-intensity-slider';
import type { ThinkingIntensity } from '../../stores/settingsStore';
import { Icon } from '../ui/icon';

export interface ThinkingIntensityModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  currentIntensity: ThinkingIntensity;
  onConfirm: (intensity: ThinkingIntensity) => void;
}

// Map ThinkLevel (0-3) to ThinkingIntensity strings
const LEVEL_TO_INTENSITY: Record<ThinkLevel, ThinkingIntensity> = {
  0: 'think',
  1: 'think-hard',
  2: 'think-harder',
  3: 'ultrathink',
};

const INTENSITY_TO_LEVEL: Record<ThinkingIntensity, ThinkLevel> = {
  'think': 0,
  'think-hard': 1,
  'think-harder': 2,
  'ultrathink': 3,
};

const ThinkingIntensityModal = React.forwardRef<HTMLDivElement, ThinkingIntensityModalProps>(
  ({ className, open, onClose, currentIntensity, onConfirm, ...props }, ref) => {
    const [selectedLevel, setSelectedLevel] = React.useState<ThinkLevel>(
      INTENSITY_TO_LEVEL[currentIntensity] ?? 1
    );

    // Sync selected level when current intensity changes
    React.useEffect(() => {
      const newLevel = INTENSITY_TO_LEVEL[currentIntensity] ?? 1;
      console.log('[ThinkingIntensity] Syncing selectedLevel from prop:', {
        currentIntensity,
        newLevel
      });
      setSelectedLevel(newLevel);
    }, [currentIntensity]);

    const handleConfirm = React.useCallback((level: ThinkLevel) => {
      console.log('[ThinkingIntensity] Confirmed level:', level, '→', LEVEL_TO_INTENSITY[level]);
      onConfirm(LEVEL_TO_INTENSITY[level]);
      onClose();
    }, [onConfirm, onClose]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative z-10 w-[320px] bg-[#0f0f0f] border border-[#222225] shadow-xl',
            className
          )}
          {...props}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222225]">
            <h3 className="text-[14px] font-semibold text-[#fafafa]">Thinking Intensity</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[#8b8b94] hover:text-[#fafafa] transition-colors"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <ThinkIntensitySlider
              value={selectedLevel}
              onChange={setSelectedLevel}
              onConfirm={handleConfirm}
              showConfirmButton={true}
            />
          </div>
        </div>
      </div>
    );
  }
);

ThinkingIntensityModal.displayName = 'ThinkingIntensityModal';

export { ThinkingIntensityModal };
