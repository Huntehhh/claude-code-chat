'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Input } from '../ui/input';
import { TypeToggle } from '../ui/type-toggle';
import { FormField } from '../molecules/form-field';
import { ChipInput } from '../molecules/chip-input';
import { KeyValueRow } from '../molecules/key-value-row';
import type { McpServer, McpServerType } from './mcp-server-list';

export interface McpEditorFormProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Server being edited (undefined for new server) */
  server?: Partial<McpServer>;
  /** Form mode */
  mode: 'create' | 'edit';
  /** Called when back button is clicked */
  onBack?: () => void;
  /** Called when delete button is clicked (edit mode only) */
  onDelete?: () => void;
  /** Called when cancel button is clicked */
  onCancel?: () => void;
  /** Called when save button is clicked */
  onSave?: (server: Partial<McpServer>) => void;
}

interface EnvVar {
  key: string;
  value: string;
}

const TYPE_OPTIONS = [
  { value: 'stdio' as const, label: 'stdio' },
  { value: 'sse' as const, label: 'sse' },
];

const McpEditorForm = React.forwardRef<HTMLDivElement, McpEditorFormProps>(
  ({ className, server, mode, onBack, onDelete, onCancel, onSave, ...props }, ref) => {
    // Form state
    const [name, setName] = React.useState(server?.name || '');
    const [type, setType] = React.useState<McpServerType>(server?.type || 'stdio');
    const [command, setCommand] = React.useState(server?.command || '');
    const [args, setArgs] = React.useState<string[]>(server?.args || []);
    const [url, setUrl] = React.useState(server?.url || '');
    const [envVars, setEnvVars] = React.useState<EnvVar[]>(() => {
      if (server?.env) {
        return Object.entries(server.env).map(([key, value]) => ({ key, value }));
      }
      return [];
    });

    const isStdio = type === 'stdio';
    const isValid = name.trim() && (isStdio ? command.trim() : url.trim());

    const handleAddEnvVar = () => {
      setEnvVars([...envVars, { key: '', value: '' }]);
    };

    const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
      const newEnvVars = [...envVars];
      newEnvVars[index] = { ...newEnvVars[index], [field]: value };
      setEnvVars(newEnvVars);
    };

    const handleEnvVarDelete = (index: number) => {
      const newEnvVars = [...envVars];
      newEnvVars.splice(index, 1);
      setEnvVars(newEnvVars);
    };

    const handleSave = () => {
      const env: Record<string, string> = {};
      envVars.forEach(({ key, value }) => {
        if (key.trim()) {
          env[key.trim()] = value;
        }
      });

      onSave?.({
        ...server,
        name: name.trim(),
        type,
        ...(isStdio
          ? { command: command.trim(), args, env: Object.keys(env).length > 0 ? env : undefined }
          : { url: url.trim() }),
      });
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full bg-[#0f0f0f] text-[#fafafa]',
          className
        )}
        {...props}
      >
        {/* Header */}
        <header className="h-[48px] min-h-[48px] px-4 flex items-center justify-between border-b border-transparent shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 -ml-1 text-[#8b8b94] hover:text-white"
              onClick={onBack}
            >
              <Icon name="arrow_back" className="!text-[20px]" />
            </Button>
            <h1 className="text-[15px] font-medium tracking-tight">
              {mode === 'edit' ? 'Edit Server' : 'New Server'}
            </h1>
          </div>
          {mode === 'edit' && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-[#FF7369] hover:bg-[#FF7369]/10"
              onClick={onDelete}
              title="Delete Server"
            >
              <Icon name="delete" className="!text-[18px]" />
            </Button>
          )}
        </header>

        {/* Form Content */}
        <main className="flex-1 overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
          <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-6">
            {/* Server Name */}
            <FormField label="Server Name" labelVariant="uppercase" spacing="spacious">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-server"
                className="rounded-lg"
              />
            </FormField>

            {/* Type Selector */}
            <FormField label="Type" labelVariant="uppercase" spacing="spacious">
              <TypeToggle
                options={TYPE_OPTIONS}
                value={type}
                onChange={setType}
              />
            </FormField>

            {/* stdio-specific fields */}
            {isStdio && (
              <>
                {/* Command */}
                <FormField label="Command" labelVariant="uppercase" spacing="spacious">
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="npx"
                    className="rounded-lg font-mono"
                  />
                </FormField>

                {/* Arguments */}
                <FormField label="Arguments" labelVariant="uppercase" spacing="spacious">
                  <ChipInput
                    values={args}
                    onChange={setArgs}
                    placeholder="arg"
                    mono
                  />
                </FormField>

                {/* Environment Variables */}
                <FormField label="Environment Variables" labelVariant="uppercase" spacing="spacious">
                  <div className="flex flex-col gap-2">
                    {envVars.map((envVar, index) => (
                      <KeyValueRow
                        key={index}
                        keyValue={envVar.key}
                        valueValue={envVar.value}
                        onKeyChange={(value) => handleEnvVarChange(index, 'key', value)}
                        onValueChange={(value) => handleEnvVarChange(index, 'value', value)}
                        onDelete={() => handleEnvVarDelete(index)}
                        maskValue={envVar.key.toLowerCase().includes('key') || envVar.key.toLowerCase().includes('secret')}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEnvVar}
                    className="flex items-center gap-1.5 text-xs text-[#FFA344] mt-2 hover:brightness-110 transition-all"
                  >
                    <Icon name="add" className="!text-[14px]" />
                    Add Variable
                  </button>
                </FormField>
              </>
            )}

            {/* sse-specific fields */}
            {!isStdio && (
              <FormField
                label="Server URL"
                labelVariant="uppercase"
                spacing="spacious"
                helper="SSE endpoint URL"
              >
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://localhost:3000/sse"
                  className="rounded-lg"
                />
              </FormField>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="h-[60px] min-h-[60px] bg-[#0f0f0f] border-t border-[#222225] flex items-center justify-between px-6 shrink-0">
          <Button
            variant="ghost"
            className="text-[#8b8b94] hover:text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            disabled={!isValid}
            onClick={handleSave}
            className="shadow-md shadow-[#FFA344]/10"
          >
            {mode === 'edit' ? 'Save Changes' : 'Create Server'}
          </Button>
        </footer>
      </div>
    );
  }
);
McpEditorForm.displayName = 'McpEditorForm';

export { McpEditorForm };
