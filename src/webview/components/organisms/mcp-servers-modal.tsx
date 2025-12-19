'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Modal } from './modal';
import { Toggle } from '../ui/toggle';
import { Icon } from '../ui/icon';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ServerCard } from '../molecules/server-card';

export type ServerType = 'http' | 'sse' | 'stdio';

export interface McpServer {
  id: string;
  name: string;
  type: ServerType;
  enabled: boolean;
  url?: string;
  command?: string;
  args?: string;
}

export interface PopularServer {
  emoji: string;
  name: string;
  description: string;
}

export interface McpServersModalProps {
  open?: boolean;
  onClose?: () => void;
  servers?: McpServer[];
  onToggleServer?: (id: string, enabled: boolean) => void;
  onRemoveServer?: (id: string) => void;
  onAddServer?: (server: Omit<McpServer, 'id' | 'enabled'>) => void;
  onOpenConfig?: (configType: 'local-mcp' | 'global-mcp' | 'local-settings' | 'global-settings') => void;
  popularServers?: PopularServer[];
  onAddPopularServer?: (server: PopularServer) => void;
}

const DEFAULT_POPULAR_SERVERS: PopularServer[] = [
  { emoji: '📚', name: 'Context7', description: 'Enhanced context window management' },
  { emoji: '🧠', name: 'Memory', description: 'Persistent knowledge graph' },
  { emoji: '🔗', name: 'Sequential', description: 'Multi-step task planner' },
  { emoji: '🎭', name: 'Puppeteer', description: 'Browser automation & scraping' },
  { emoji: '🌐', name: 'Fetch', description: 'Simple HTTP request utility' },
  { emoji: '📁', name: 'Filesystem', description: 'Direct file access & manipulation' },
];

const TYPE_BADGE_STYLES: Record<ServerType, string> = {
  http: 'bg-[#FFA344]/10 text-[#FFA344] border-[#FFA344]/20',
  sse: 'bg-[#a1a1a1]/10 text-[#a1a1a1] border-[#a1a1a1]/20',
  stdio: 'bg-[#8b8b94]/10 text-[#8b8b94] border-[#8b8b94]/20',
};

const McpServersModal: React.FC<McpServersModalProps> = ({
  open = false,
  onClose,
  servers = [],
  onToggleServer,
  onRemoveServer,
  onAddServer,
  onOpenConfig,
  popularServers = DEFAULT_POPULAR_SERVERS,
  onAddPopularServer,
}) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newServerName, setNewServerName] = React.useState('');
  const [newServerType, setNewServerType] = React.useState<ServerType>('stdio');
  const [newServerUrl, setNewServerUrl] = React.useState('');
  const [newServerCommand, setNewServerCommand] = React.useState('');
  const [newServerArgs, setNewServerArgs] = React.useState('');

  const resetForm = () => {
    setNewServerName('');
    setNewServerType('stdio');
    setNewServerUrl('');
    setNewServerCommand('');
    setNewServerArgs('');
    setShowAddForm(false);
  };

  const handleSave = () => {
    if (!newServerName.trim()) return;

    const server: Omit<McpServer, 'id' | 'enabled'> = {
      name: newServerName,
      type: newServerType,
      ...(newServerType === 'stdio'
        ? { command: newServerCommand, args: newServerArgs }
        : { url: newServerUrl }),
    };

    onAddServer?.(server);
    resetForm();
  };

  return (
    <Modal open={open} onClose={onClose} title="MCP Servers" maxWidth="md">
      <div className="overflow-y-auto flex-1">
        {/* Server List */}
        <div className="flex flex-col">
          {servers.map((server) => (
            <div
              key={server.id}
              className="group flex items-center justify-between px-4 py-3 border-b border-[#222225]/50 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="shrink-0 flex items-center justify-center rounded bg-[#2A2A2D] size-8 text-white">
                  <Icon
                    name={server.type === 'stdio' ? 'terminal' : 'public'}
                    className="!text-[18px]"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-[14px] font-medium truncate">
                    {server.name}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] border leading-none w-fit',
                      TYPE_BADGE_STYLES[server.type]
                    )}
                  >
                    {server.type.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Toggle
                  checked={server.enabled}
                  onCheckedChange={(checked) => onToggleServer?.(server.id, checked)}
                />
                <button
                  type="button"
                  className="text-[#8b8b94] hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveServer?.(server.id)}
                >
                  <Icon name="more_horiz" className="!text-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Server Section */}
        <div className="px-4 py-3 border-b border-[#222225]">
          {!showAddForm ? (
            <button
              type="button"
              className="flex items-center gap-2 text-[#FFA344] hover:text-[#FFA344]/80 text-[13px] font-medium transition-colors w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Icon name="add" className="!text-[16px]" />
              Add New Server
            </button>
          ) : (
            <div className="flex flex-col gap-3 bg-[#161618] border border-[#222225]/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#8b8b94] uppercase tracking-wider">
                  New Server
                </span>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Server Name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  className="h-8"
                />
                <div className="flex gap-2">
                  <div className="relative w-1/3">
                    <select
                      value={newServerType}
                      onChange={(e) => setNewServerType(e.target.value as ServerType)}
                      className="w-full h-8 pl-2 pr-6 bg-[#0f0f0f] border border-[#333] rounded text-[13px] text-white appearance-none focus:outline-none focus:border-[#FFA344] focus:ring-1 focus:ring-[#FFA344]/20 transition-all"
                    >
                      <option value="stdio">stdio</option>
                      <option value="http">HTTP</option>
                      <option value="sse">SSE</option>
                    </select>
                    <Icon
                      name="expand_more"
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-[#555] !text-[16px] pointer-events-none"
                    />
                  </div>
                  {newServerType === 'stdio' ? (
                    <Input
                      placeholder="Command (e.g. npx)"
                      value={newServerCommand}
                      onChange={(e) => setNewServerCommand(e.target.value)}
                      className="flex-1 h-8 font-mono"
                    />
                  ) : (
                    <Input
                      placeholder="URL"
                      value={newServerUrl}
                      onChange={(e) => setNewServerUrl(e.target.value)}
                      className="flex-1 h-8"
                    />
                  )}
                </div>
                {newServerType === 'stdio' && (
                  <Input
                    placeholder="Args (optional)"
                    value={newServerArgs}
                    onChange={(e) => setNewServerArgs(e.target.value)}
                    className="h-8 font-mono"
                  />
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1 mt-1 border-t border-white/5">
                <button
                  type="button"
                  className="px-3 py-1 text-[12px] font-medium text-[#8b8b94] hover:text-white transition-colors"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1 bg-[#FFA344] text-white text-[12px] font-bold rounded shadow-sm hover:bg-[#FFA344]/90 transition-colors"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Popular Servers Section */}
        <div className="p-4 bg-[#0f0f0f]">
          <h3 className="text-[#8b8b94] text-[11px] font-bold uppercase tracking-widest mb-3 pl-1">
            Popular Servers
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {popularServers.map((server) => (
              <ServerCard
                key={server.name}
                emoji={server.emoji}
                title={server.name}
                description={server.description}
                onAdd={() => onAddPopularServer?.(server)}
              />
            ))}
          </div>
        </div>

        {/* Config Files Section (V2 addition) */}
        <div className="p-4 border-t border-[#222225]">
          <h3 className="text-[#8b8b94] text-[12px] font-bold uppercase tracking-[0.5px] mb-3">
            Config Files
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-[#8b8b94] text-[14px] hover:text-[#fafafa] hover:bg-[#171717] transition-all text-left"
              style={{ borderRadius: 0 }}
              onClick={() => onOpenConfig?.('local-mcp')}
            >
              <Icon name="description" className="!text-[14px] text-[#52525b]" />
              Local MCP Config
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-[#8b8b94] text-[14px] hover:text-[#fafafa] hover:bg-[#171717] transition-all text-left"
              style={{ borderRadius: 0 }}
              onClick={() => onOpenConfig?.('global-mcp')}
            >
              <Icon name="description" className="!text-[14px] text-[#52525b]" />
              Global MCP Config
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-[#8b8b94] text-[14px] hover:text-[#fafafa] hover:bg-[#171717] transition-all text-left"
              style={{ borderRadius: 0 }}
              onClick={() => onOpenConfig?.('local-settings')}
            >
              <Icon name="description" className="!text-[14px] text-[#52525b]" />
              Local Settings
            </button>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-[#8b8b94] text-[14px] hover:text-[#fafafa] hover:bg-[#171717] transition-all text-left"
              style={{ borderRadius: 0 }}
              onClick={() => onOpenConfig?.('global-settings')}
            >
              <Icon name="description" className="!text-[14px] text-[#52525b]" />
              Global Settings
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export { McpServersModal };
