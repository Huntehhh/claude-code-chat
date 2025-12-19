'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Modal } from './modal';
import { Toggle } from '../ui/toggle';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export interface PermissionRule {
  id: string;
  type: 'read' | 'write' | 'exec';
  pattern: string;
}

export interface SettingsModalProps {
  open?: boolean;
  onClose?: () => void;
  // WSL Settings
  wslEnabled?: boolean;
  onWslEnabledChange?: (enabled: boolean) => void;
  wslDistribution?: string;
  onWslDistributionChange?: (value: string) => void;
  nodePath?: string;
  onNodePathChange?: (value: string) => void;
  claudePath?: string;
  onClaudePathChange?: (value: string) => void;
  // Permissions
  permissions?: PermissionRule[];
  onAddRule?: () => void;
  onRemoveRule?: (id: string) => void;
  yoloMode?: boolean;
  onYoloModeChange?: (enabled: boolean) => void;
  // Display
  compactToolOutput?: boolean;
  onCompactToolOutputChange?: (enabled: boolean) => void;
  previewHeight?: number;
  onPreviewHeightChange?: (height: number) => void;
  compactMcpCalls?: boolean;
  onCompactMcpCallsChange?: (enabled: boolean) => void;
  showTodoList?: boolean;
  onShowTodoListChange?: (enabled: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open = false,
  onClose,
  // WSL
  wslEnabled = false,
  onWslEnabledChange,
  wslDistribution = '',
  onWslDistributionChange,
  nodePath = '',
  onNodePathChange,
  claudePath = '',
  onClaudePathChange,
  // Permissions
  permissions = [],
  onAddRule,
  onRemoveRule,
  yoloMode = false,
  onYoloModeChange,
  // Display
  compactToolOutput = true,
  onCompactToolOutputChange,
  previewHeight = 150,
  onPreviewHeightChange,
  compactMcpCalls = false,
  onCompactMcpCallsChange,
  showTodoList = true,
  onShowTodoListChange,
}) => {
  return (
    <Modal open={open} onClose={onClose} title="Settings" maxWidth="md">
      <div className="p-3 flex flex-col gap-6">
        {/* Section: WSL Configuration */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-[#8b8b94] uppercase tracking-[0.5px]">
            WSL Configuration
          </h3>

          {/* Enable WSL Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-200">Enable WSL</span>
            <Toggle
              checked={wslEnabled}
              onCheckedChange={onWslEnabledChange}
            />
          </div>

          {/* Dependent Inputs */}
          {wslEnabled && (
            <div className="flex flex-col gap-3 pl-1 border-l-2 border-[#222225] ml-1">
              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-300">WSL Distribution</label>
                <Input
                  value={wslDistribution}
                  onChange={(e) => onWslDistributionChange?.(e.target.value)}
                  placeholder="e.g. Ubuntu-20.04"
                  className="h-8"
                />
                <span className="text-[11px] text-[#52525b]">
                  Target distribution for execution
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-300">Node.js Path</label>
                <Input
                  value={nodePath}
                  onChange={(e) => onNodePathChange?.(e.target.value)}
                  placeholder="/usr/bin/node"
                  className="h-8"
                />
                <span className="text-[11px] text-[#52525b]">
                  Absolute path to node executable
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[13px] text-gray-300">Claude Path</label>
                <Input
                  value={claudePath}
                  onChange={(e) => onClaudePathChange?.(e.target.value)}
                  placeholder="~/.claude"
                  className="h-8"
                />
                <span className="text-[11px] text-[#52525b]">
                  Config directory location
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section: Permissions */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-medium text-[#8b8b94] uppercase tracking-[0.5px]">
            Permissions
          </h3>

          {/* Permission List */}
          {permissions.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
              {permissions.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between group py-1"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="bg-[#171717] text-[10px] font-bold text-gray-400 px-1.5 py-0.5 rounded border border-[#2a2a2e] uppercase tracking-wider">
                      {rule.type}
                    </span>
                    <span className="text-xs font-mono text-gray-300 truncate">
                      {rule.pattern}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-[#52525b] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    onClick={() => onRemoveRule?.(rule.id)}
                  >
                    <Icon name="delete" className="!text-[16px]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 text-[#52525b]">
              <Icon name="lock" className="!text-[16px]" />
              <span className="text-xs">No permissions set</span>
            </div>
          )}

          {/* Add Rule Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 text-[#FFA344] text-xs font-medium hover:text-[#FFA344]/80 transition-colors w-fit px-1 -ml-1 py-1 rounded hover:bg-[#FFA344]/5"
            onClick={onAddRule}
          >
            <Icon name="add" className="!text-[16px]" />
            Add Rule
          </button>

          {/* YOLO Mode Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-sm text-gray-200">Enable YOLO Mode</span>
              <span className="text-[10px] text-[#52525b]">
                Auto-approve all tool execution
              </span>
            </div>
            <Toggle
              variant="danger"
              checked={yoloMode}
              onCheckedChange={onYoloModeChange}
            />
          </div>
        </div>

        {/* Section: Display */}
        <div className="flex flex-col gap-3 pb-2">
          <h3 className="text-xs font-medium text-[#8b8b94] uppercase tracking-[0.5px]">
            Display
          </h3>

          {/* Compact tool output with preview height input */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-200">Compact tool output</span>
            <div className="flex items-center gap-2">
              {/* Preview height input */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] text-[#8b8b94]">Preview height</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={previewHeight}
                    onChange={(e) => onPreviewHeightChange?.(parseInt(e.target.value, 10) || 150)}
                    className="w-[60px] h-6 bg-[#171717] border border-[#222225] text-[12px] text-[#fafafa] text-right px-2 focus:border-[#FFA344] focus:ring-0 focus:outline-none"
                    style={{ borderRadius: 0 }}
                    min={50}
                    max={500}
                  />
                  <span className="text-[11px] text-[#52525b]">px</span>
                </div>
              </div>
              <Toggle
                checked={compactToolOutput}
                onCheckedChange={onCompactToolOutputChange}
              />
            </div>
          </div>

          {/* Compact MCP tool calls (renamed from "Hide MCP tool calls") */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-200">Compact MCP tool calls</span>
            <Toggle
              checked={compactMcpCalls}
              onCheckedChange={onCompactMcpCallsChange}
            />
          </div>

          {/* Show to-do list (renamed from "Show Tasks panel") */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-200">Show to-do list</span>
            <Toggle
              checked={showTodoList}
              onCheckedChange={onShowTodoListChange}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export { SettingsModal };
