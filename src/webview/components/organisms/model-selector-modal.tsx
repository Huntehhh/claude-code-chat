'use client';

import * as React from 'react';
import { Modal } from './modal';
import { RadioOption } from '../molecules/radio-option';

export type ModelOption = 'opus' | 'sonnet' | 'default';

export interface ModelSelectorModalProps {
  open?: boolean;
  onClose?: () => void;
  selectedModel?: ModelOption;
  onSelectModel?: (model: ModelOption) => void;
  onConfigure?: () => void;
}

const MODEL_OPTIONS: Array<{
  value: ModelOption;
  label: string;
  description: string | React.ReactNode;
}> = [
  { value: 'opus', label: 'Opus', description: 'Most capable' },
  { value: 'sonnet', label: 'Sonnet', description: 'Fast & capable' },
];

const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  open = false,
  onClose,
  selectedModel = 'sonnet',
  onSelectModel,
  onConfigure,
}) => {
  return (
    <Modal open={open} onClose={onClose} title="Select Model" maxWidth="sm">
      <div className="flex flex-col p-2 space-y-1">
        {MODEL_OPTIONS.map((option) => (
          <RadioOption
            key={option.value}
            name="model"
            value={option.value}
            label={option.label}
            description={option.description}
            checked={selectedModel === option.value}
            onChange={() => onSelectModel?.(option.value)}
          />
        ))}
        {/* Default option with Configure link */}
        <RadioOption
          name="model"
          value="default"
          label="Default"
          description={
            <span>
              Your configured model{' '}
              <button
                type="button"
                className="text-[#FFA344] hover:text-[#ffb366] hover:underline font-normal bg-transparent border-0 p-0 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigure?.();
                }}
              >
                Configure
              </button>
            </span>
          }
          checked={selectedModel === 'default'}
          onChange={() => onSelectModel?.('default')}
        />
      </div>
      <div className="pb-2" />
    </Modal>
  );
};

export { ModelSelectorModal };
