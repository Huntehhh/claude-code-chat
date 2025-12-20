'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { McpServerCard, type McpServerType, type McpServerStatus } from '../molecules/mcp-server-card';
import { WelcomeState } from '../molecules/welcome-state';

export interface McpServer {
  id: string;
  name: string;
  type: McpServerType;
  status: McpServerStatus;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface McpServerListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of MCP servers */
  servers: McpServer[];
  /** Called when Add button is clicked */
  onAdd?: () => void;
  /** Called when a server's edit button is clicked */
  onEdit?: (server: McpServer) => void;
  /** Called when a server's toggle button is clicked */
  onToggle?: (server: McpServer) => void;
  /** Called when a server's delete button is clicked */
  onDelete?: (server: McpServer) => void;
  /** Protocol version to display in footer */
  protocolVersion?: string;
}

const McpServerList = React.forwardRef<HTMLDivElement, McpServerListProps>(
  (
    {
      className,
      servers,
      onAdd,
      onEdit,
      onToggle,
      onDelete,
      protocolVersion = 'v1.0.2',
      ...props
    },
    ref
  ) => {
    const isEmpty = servers.length === 0;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-[#0f0f0f] border-r border-[#222225]',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 min-h-[48px] border-b border-[#222225] shrink-0">
          <h1 className="text-[#fafafa] text-[16px] font-bold tracking-wide">MCP Servers</h1>
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 rounded-lg"
            onClick={onAdd}
          >
            <Icon name="add" className="!text-[14px]" />
            <span>Add</span>
          </Button>
        </div>

        {/* Content */}
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Icon name="database" className="!text-[48px] text-[#52525b]" />
              <WelcomeState
                title="No servers configured"
                titleSize="sm"
                subtitle="Add an MCP server to extend Claude's capabilities"
                className="gap-2"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onAdd}
              >
                Add Server
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
            {servers.map((server) => (
              <McpServerCard
                key={server.id}
                name={server.name}
                type={server.type}
                status={server.status}
                onEdit={() => onEdit?.(server)}
                onToggle={() => onToggle?.(server)}
                onDelete={() => onDelete?.(server)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto px-4 py-3 border-t border-[#222225] shrink-0">
          <div className="flex items-center gap-2 text-[#8b8b94] text-xs">
            <Icon name="info" className="!text-[14px]" />
            <span>MCP Protocol {protocolVersion}</span>
          </div>
        </div>
      </div>
    );
  }
);
McpServerList.displayName = 'McpServerList';

export { McpServerList };
