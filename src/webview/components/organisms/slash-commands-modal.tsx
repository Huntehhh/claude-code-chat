'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Modal } from './modal';
import { Icon } from '../ui/icon';
import { CommandPill } from '../ui/command-pill';
import { SnippetButton } from '../ui/snippet-button';
import { CommandItem } from '../molecules/command-item';
import { Kbd } from '../ui/kbd';

export interface CustomCommand {
  id: string;
  command: string;
  label: string;
}

export interface Snippet {
  id: string;
  emoji: string;
  label: string;
}

export interface CliCommand {
  id: string;
  emoji: string;
  command: string;
  description: string;
}

export interface SlashCommandsModalProps {
  open?: boolean;
  onClose?: () => void;
  customCommands?: CustomCommand[];
  snippets?: Snippet[];
  cliCommands?: CliCommand[];
  activeCommandId?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onAddCommand?: () => void;
  onSelectCustomCommand?: (command: CustomCommand) => void;
  onSelectSnippet?: (snippet: Snippet) => void;
  onSelectCliCommand?: (command: CliCommand) => void;
}

const DEFAULT_SNIPPETS: Snippet[] = [
  { id: '1', emoji: '⚡', label: 'Performance' },
  { id: '2', emoji: '🔒', label: 'Security' },
  { id: '3', emoji: '🔍', label: 'Review' },
  { id: '4', emoji: '📖', label: 'Explain' },
  { id: '5', emoji: '🐛', label: 'Debug' },
  { id: '6', emoji: '🔄', label: 'Refactor' },
  { id: '7', emoji: '🧪', label: 'Test' },
  { id: '8', emoji: '📝', label: 'Document' },
];

const DEFAULT_CLI_COMMANDS: CliCommand[] = [
  { id: 'clear', emoji: '🧹', command: '/clear', description: 'Clear history' },
  { id: 'compact', emoji: '📦', command: '/compact', description: 'Compress context' },
  { id: 'config', emoji: '⚙️', command: '/config', description: 'Edit settings' },
  { id: 'cost', emoji: '💰', command: '/cost', description: 'Show usage cost' },
  { id: 'doctor', emoji: '🩺', command: '/doctor', description: 'Check health' },
  { id: 'help', emoji: '❓', command: '/help', description: 'Show commands' },
  { id: 'init', emoji: '🚀', command: '/init', description: 'Initialize project' },
  { id: 'login', emoji: '🔑', command: '/login', description: 'Auth provider' },
  { id: 'memory', emoji: '🧠', command: '/memory', description: 'Context dump' },
  { id: 'model', emoji: '🤖', command: '/model', description: 'Switch LLM' },
];

const SlashCommandsModal: React.FC<SlashCommandsModalProps> = ({
  open = false,
  onClose,
  customCommands = [],
  snippets = DEFAULT_SNIPPETS,
  cliCommands = DEFAULT_CLI_COMMANDS,
  activeCommandId,
  searchValue = '',
  onSearchChange,
  onAddCommand,
  onSelectCustomCommand,
  onSelectSnippet,
  onSelectCliCommand,
}) => {
  // Filter based on search
  const filteredSnippets = React.useMemo(() => {
    if (!searchValue) return snippets;
    const lower = searchValue.toLowerCase();
    return snippets.filter((s) => s.label.toLowerCase().includes(lower));
  }, [snippets, searchValue]);

  const filteredCliCommands = React.useMemo(() => {
    if (!searchValue) return cliCommands;
    const lower = searchValue.toLowerCase();
    return cliCommands.filter(
      (c) =>
        c.command.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
    );
  }, [cliCommands, searchValue]);

  const filteredCustomCommands = React.useMemo(() => {
    if (!searchValue) return customCommands;
    const lower = searchValue.toLowerCase();
    return customCommands.filter(
      (c) =>
        c.command.toLowerCase().includes(lower) ||
        c.label.toLowerCase().includes(lower)
    );
  }, [customCommands, searchValue]);

  return (
    <Modal open={open} onClose={onClose} title="Commands" maxWidth="sm">
      {/* Search Input with "/" badge */}
      <div className="p-3 border-b border-[#222225] shrink-0 bg-[#0f0f0f] sticky top-0 z-10">
        <div className="relative flex items-center w-full group">
          <div className="absolute left-3 flex items-center justify-center w-5 h-5 rounded-sm bg-[#222225] text-[#8b8b94] text-xs font-mono font-bold">
            /
          </div>
          <input
            autoFocus
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full bg-[#18181b] border border-[#222225] text-sm text-white rounded-sm py-2 pl-10 pr-3 focus:outline-none focus:border-[#FFA344] focus:ring-1 focus:ring-[#FFA344]/20 placeholder-[#52525b] transition-all"
            placeholder="Search commands..."
            style={{ borderRadius: '2px' }}
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto flex-1 flex flex-col pb-4">
        {/* Custom Commands Section */}
        {(filteredCustomCommands.length > 0 || !searchValue) && (
          <div className="px-3 pt-4">
            <h3 className="text-[#8b8b94] text-[11px] uppercase tracking-wider font-semibold mb-2 px-1">
              Custom Commands
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {filteredCustomCommands.map((cmd) => (
                <CommandPill
                  key={cmd.id}
                  command={cmd.command}
                  label={cmd.label}
                  onClick={() => onSelectCustomCommand?.(cmd)}
                />
              ))}
              <CommandPill
                variant="add"
                onClick={onAddCommand}
                icon={<Icon name="add" className="!text-[14px]" />}
                label="Add"
              />
            </div>
          </div>
        )}

        {/* Built-in Snippets Section */}
        {filteredSnippets.length > 0 && (
          <div className="px-3 pt-4">
            <h3 className="text-[#8b8b94] text-[11px] uppercase tracking-wider font-semibold mb-2 px-1">
              Snippets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredSnippets.map((snippet) => (
                <SnippetButton
                  key={snippet.id}
                  emoji={snippet.emoji}
                  label={snippet.label}
                  onClick={() => onSelectSnippet?.(snippet)}
                />
              ))}
            </div>
          </div>
        )}

        {/* CLI Commands Section */}
        {filteredCliCommands.length > 0 && (
          <div className="pt-4">
            <h3 className="text-[#8b8b94] text-[11px] uppercase tracking-wider font-semibold mb-2 px-4">
              CLI Commands
            </h3>
            <div className="flex flex-col">
              {filteredCliCommands.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  emoji={cmd.emoji}
                  command={cmd.command}
                  description={cmd.description}
                  isActive={activeCommandId === cmd.id}
                  onClick={() => onSelectCliCommand?.(cmd)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Shortcuts hint */}
      <div className="px-4 py-2 border-t border-[#222225] bg-[#0f0f0f] flex items-center justify-between text-[10px] text-[#52525b]">
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <Kbd>↑↓</Kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> Select
          </span>
        </div>
        <span>v1.0.4</span>
      </div>
    </Modal>
  );
};

export { SlashCommandsModal };
