'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { McpServerList, type McpServer } from './mcp-server-list';
import { McpEditorForm } from './mcp-editor-form';
import { DeleteConfirmDialog } from '../molecules/delete-confirm-dialog';
import type { McpServerType, McpServerStatus } from '../molecules/mcp-server-card';

// Re-export types for consumers
export type { McpServer, McpServerType, McpServerStatus };

export type McpManagerView = 'list' | 'create' | 'edit';

export interface McpManagerPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the panel is open */
  open?: boolean;
  /** List of MCP servers */
  servers: McpServer[];
  /** Called when a server is saved (create or update) */
  onSave?: (server: Partial<McpServer>) => void;
  /** Called when a server is deleted */
  onDelete?: (serverId: string) => void;
  /** Called when a server is toggled enabled/disabled */
  onToggle?: (serverId: string) => void;
  /** Called when panel should close */
  onClose?: () => void;
  /** Protocol version to display */
  protocolVersion?: string;
}

const McpManagerPanel = React.forwardRef<HTMLDivElement, McpManagerPanelProps>(
  (
    {
      className,
      open = false,
      servers,
      onSave,
      onDelete,
      onToggle,
      onClose,
      protocolVersion,
      ...props
    },
    ref
  ) => {
    // View state
    const [view, setView] = React.useState<McpManagerView>('list');
    const [editingServer, setEditingServer] = React.useState<McpServer | undefined>();
    const [deleteTarget, setDeleteTarget] = React.useState<McpServer | undefined>();

    // Handlers
    const handleAdd = () => {
      setEditingServer(undefined);
      setView('create');
    };

    const handleEdit = (server: McpServer) => {
      setEditingServer(server);
      setView('edit');
    };

    const handleBack = () => {
      setEditingServer(undefined);
      setView('list');
    };

    const handleSave = (serverData: Partial<McpServer>) => {
      onSave?.(serverData);
      setView('list');
      setEditingServer(undefined);
    };

    const handleDeleteRequest = (server: McpServer) => {
      setDeleteTarget(server);
    };

    const handleDeleteConfirm = () => {
      if (deleteTarget) {
        onDelete?.(deleteTarget.id);
        setDeleteTarget(undefined);
        // If we were editing the deleted server, go back to list
        if (editingServer?.id === deleteTarget.id) {
          setView('list');
          setEditingServer(undefined);
        }
      }
    };

    const handleDeleteCancel = () => {
      setDeleteTarget(undefined);
    };

    const handleToggle = (server: McpServer) => {
      onToggle?.(server.id);
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

    // Reset view when panel closes
    React.useEffect(() => {
      if (!open) {
        setView('list');
        setEditingServer(undefined);
        setDeleteTarget(undefined);
      }
    }, [open]);

    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Panel */}
        <div
          ref={ref}
          className={cn(
            'animate-slide-in flex flex-col w-[340px] h-full',
            'shadow-[-4px_0_16px_rgba(0,0,0,0.3),inset_1px_0_0_0_rgba(255,255,255,0.03)]',
            className
          )}
          {...props}
        >
          {/* List View */}
          {view === 'list' && (
            <McpServerList
              servers={servers}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDelete={handleDeleteRequest}
              protocolVersion={protocolVersion}
              className="h-full"
            />
          )}

          {/* Create/Edit View */}
          {(view === 'create' || view === 'edit') && (
            <McpEditorForm
              server={editingServer}
              mode={view === 'edit' ? 'edit' : 'create'}
              onBack={handleBack}
              onCancel={handleBack}
              onSave={handleSave}
              onDelete={editingServer ? () => handleDeleteRequest(editingServer) : undefined}
              className="h-full"
            />
          )}

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            open={!!deleteTarget}
            onClose={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            itemName={deleteTarget?.name || ''}
            title="Delete Server?"
          />
        </div>
      </div>
    );
  }
);
McpManagerPanel.displayName = 'McpManagerPanel';

export { McpManagerPanel };
