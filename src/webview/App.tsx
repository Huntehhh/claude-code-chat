'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useVSCodeMessaging, useVSCodeSender } from './hooks/useVSCodeMessaging';
import { useChatStore } from './stores/chatStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';

// Layout Components
import { AppHeader } from './components/organisms/app-header';
import { ChatInput } from './components/organisms/chat-input';
import { ThinkingOverlay } from './components/organisms/thinking-overlay';
import { MessageList } from './containers/MessageList';
import { TodoList } from './components/molecules/todo-list';

// Modal Components
import { SettingsModal } from './components/organisms/settings-modal';
import { HistoryPanel, type Conversation } from './components/organisms/history-panel';
import { McpManagerPanel, type McpServer as McpServerPanel } from './components/organisms/mcp-manager-panel';
import { ModelSelectorModal, type ModelOption } from './components/organisms/model-selector-modal';
import { SlashCommandsModal, type CliCommand, type Snippet } from './components/organisms/slash-commands-modal';
import { InstallModal, type InstallState } from './components/molecules/install-modal';
import { Toast } from './components/atoms/toast';

// =============================================================================
// App Component
// =============================================================================

export default function App() {
  // Initialize message handling
  useVSCodeMessaging();

  // Sender functions
  const {
    sendMessage,
    stopProcess,
    newSession,
    requestReady,
    saveInputText,
    loadConversation,
    requestConversations,
    selectModel,
    openModelTerminal,
    loadMCPServers,
    saveMCPServer,
    deleteMCPServer,
    executeSlashCommand,
    runInstall,
    enableYoloMode,
    renameChat,
    updateSettings: updateSettingsBackend,
  } = useVSCodeSender();

  // Chat state
  const {
    chatName,
    setChatName,
    isProcessing,
    draftMessage,
    setDraftMessage,
    todos,
    conversations,
    activeConversationId,
    totalTokensInput,
    totalTokensOutput,
    totalCost,
  } = useChatStore();

  // Settings state
  const {
    planMode,
    thinkingMode,
    showTodoList,
    togglePlanMode,
    toggleThinkingMode,
    // WSL settings
    wslEnabled,
    wslDistribution,
    nodePath,
    claudePath,
    setWslEnabled,
    setWslDistribution,
    setNodePath,
    setClaudePath,
    // Display settings
    compactToolOutput,
    previewHeight,
    compactMcpCalls,
    setCompactToolOutput,
    setPreviewHeight,
    setCompactMcpCalls,
    setShowTodoList,
    // YOLO mode
    yoloMode,
    setYoloMode,
    // Model
    selectedModel,
    // MCP Servers
    mcpServers,
    permissions,
  } = useSettingsStore();

  // UI state
  const {
    activeModal,
    isThinkingOverlayVisible,
    openModal,
    closeModal,
    toggleModal,
    historySearchTerm,
    setHistorySearchTerm,
    slashSearchTerm,
    setSlashSearchTerm,
  } = useUIStore();

  // Local state
  const [inputValue, setInputValue] = useState(draftMessage);
  const [installState, setInstallState] = useState<InstallState>('initial');

  // Sync draft message to input
  useEffect(() => {
    setInputValue(draftMessage);
  }, [draftMessage]);

  // Request ready state and load initial data on mount
  useEffect(() => {
    requestReady();
    loadMCPServers();
  }, [requestReady, loadMCPServers]);

  // ==========================================================================
  // Input Handlers
  // ==========================================================================

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setDraftMessage(value);
  }, [setDraftMessage]);

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isProcessing) return;
    sendMessage(inputValue, planMode, thinkingMode);
    setInputValue('');
    setDraftMessage('');
  }, [inputValue, isProcessing, planMode, thinkingMode, sendMessage, setDraftMessage]);

  const handleStop = useCallback(() => {
    stopProcess();
  }, [stopProcess]);

  const handleNewChat = useCallback(() => {
    newSession();
  }, [newSession]);

  const handleFileDrop = useCallback((files: FileList) => {
    // TODO: Handle file drop - integrate with selectImageFile sender
    console.log('Files dropped:', files);
  }, []);

  // ==========================================================================
  // Header Handlers
  // ==========================================================================

  const handleSettings = useCallback(() => {
    openModal('settings');
  }, [openModal]);

  const handleHistory = useCallback(() => {
    toggleModal('history');
    requestConversations();
  }, [toggleModal, requestConversations]);

  const handleRename = useCallback((newName: string) => {
    setChatName(newName);
    renameChat(newName);
  }, [setChatName, renameChat]);

  // ==========================================================================
  // Settings Modal Handlers
  // ==========================================================================

  const handleWslEnabledChange = useCallback((enabled: boolean) => {
    setWslEnabled(enabled);
    updateSettingsBackend({ wslEnabled: enabled });
  }, [setWslEnabled, updateSettingsBackend]);

  const handleWslDistributionChange = useCallback((value: string) => {
    setWslDistribution(value);
    updateSettingsBackend({ wslDistribution: value });
  }, [setWslDistribution, updateSettingsBackend]);

  const handleNodePathChange = useCallback((value: string) => {
    setNodePath(value);
    updateSettingsBackend({ nodePath: value });
  }, [setNodePath, updateSettingsBackend]);

  const handleClaudePathChange = useCallback((value: string) => {
    setClaudePath(value);
    updateSettingsBackend({ claudePath: value });
  }, [setClaudePath, updateSettingsBackend]);

  const handleYoloModeChange = useCallback((enabled: boolean) => {
    setYoloMode(enabled);
    if (enabled) {
      enableYoloMode();
    }
  }, [setYoloMode, enableYoloMode]);

  const handleCompactToolOutputChange = useCallback((enabled: boolean) => {
    setCompactToolOutput(enabled);
    updateSettingsBackend({ compactToolOutput: enabled });
  }, [setCompactToolOutput, updateSettingsBackend]);

  const handlePreviewHeightChange = useCallback((height: number) => {
    setPreviewHeight(height);
    updateSettingsBackend({ previewHeight: height });
  }, [setPreviewHeight, updateSettingsBackend]);

  const handleCompactMcpCallsChange = useCallback((enabled: boolean) => {
    setCompactMcpCalls(enabled);
    updateSettingsBackend({ compactMcpCalls: enabled });
  }, [setCompactMcpCalls, updateSettingsBackend]);

  const handleShowTodoListChange = useCallback((enabled: boolean) => {
    setShowTodoList(enabled);
    updateSettingsBackend({ showTodoList: enabled });
  }, [setShowTodoList, updateSettingsBackend]);

  const handleManageMcpServers = useCallback(() => {
    closeModal(); // Close settings modal
    openModal('mcpServers'); // Open MCP panel
  }, [closeModal, openModal]);

  // ==========================================================================
  // History Panel Handlers
  // ==========================================================================

  const handleSelectConversation = useCallback((historyConv: { id: string; source: 'chat' | 'cli' }) => {
    // Find the original conversation data from the store
    const original = conversations.find((c) => c.sessionId === historyConv.id);
    if (original) {
      loadConversation(original.filename, original.source, original.cliPath);
    }
    closeModal();
  }, [conversations, loadConversation, closeModal]);

  const handleRestoreCheckpoint = useCallback((conversation: Conversation, checkpoint: { sha: string }) => {
    // TODO: Implement checkpoint restore
    console.log('Restore checkpoint:', conversation.id, checkpoint.sha);
  }, []);

  // Convert store conversations to HistoryPanel format
  const historyConversations = conversations.map((c) => ({
    id: c.sessionId,
    title: c.firstUserMessage || c.name || 'Untitled',
    source: c.source === 'cli' ? 'cli' as const : 'chat' as const,
    timestamp: c.startTime || c.lastModified || new Date().toISOString(),
    messageCount: c.messageCount || 0,
    preview: c.lastUserMessage || c.preview || '',
    checkpoints: c.checkpoints,
  }));

  // ==========================================================================
  // Model Selector Handlers
  // ==========================================================================

  const handleSelectModel = useCallback((model: ModelOption) => {
    const modelMap: Record<ModelOption, string> = {
      opus: 'Opus',
      sonnet: 'Sonnet',
      default: 'Default',
    };
    selectModel(modelMap[model]);
    closeModal();
  }, [selectModel, closeModal]);

  const handleConfigureModel = useCallback(() => {
    openModelTerminal();
  }, [openModelTerminal]);

  // Map selectedModel to ModelOption
  const currentModelOption: ModelOption =
    selectedModel.toLowerCase().includes('opus') ? 'opus' :
    selectedModel.toLowerCase().includes('sonnet') ? 'sonnet' : 'default';

  // ==========================================================================
  // MCP Servers Panel Handlers
  // ==========================================================================

  const handleToggleMcpServer = useCallback((id: string) => {
    // TODO: Update server enabled state via backend
    console.log('Toggle MCP server:', id);
  }, []);

  const handleDeleteMcpServer = useCallback((id: string) => {
    deleteMCPServer(id);
  }, [deleteMCPServer]);

  const handleSaveMcpServer = useCallback((server: Partial<McpServerPanel>) => {
    if (!server.name) return;
    saveMCPServer(server.name, {
      type: server.type || 'stdio',
      command: server.command,
      args: server.args,
      url: server.url,
      env: server.env,
    });
  }, [saveMCPServer]);

  // Convert store MCP servers to panel format
  const panelMcpServers: McpServerPanel[] = mcpServers.map((s) => ({
    id: s.id,
    name: s.name,
    type: (s.type || 'stdio') as 'http' | 'sse' | 'stdio',
    status: s.enabled ? 'running' as const : 'disabled' as const,
    url: s.url,
    command: s.command,
    args: s.args,
    env: s.env,
  }));

  // ==========================================================================
  // Slash Commands Modal Handlers
  // ==========================================================================

  const handleSelectCliCommand = useCallback((command: CliCommand) => {
    executeSlashCommand(command.command);
    closeModal();
  }, [executeSlashCommand, closeModal]);

  const handleSelectSnippet = useCallback((snippet: Snippet) => {
    // Insert snippet into input
    setInputValue((prev) => prev + ` ${snippet.label}`);
    closeModal();
  }, [closeModal]);

  // ==========================================================================
  // Install Modal Handlers
  // ==========================================================================

  const handleInstall = useCallback(() => {
    setInstallState('installing');
    runInstall();
    // The installComplete message handler will update state
  }, [runInstall]);

  const handleViewDocs = useCallback(() => {
    // Open documentation in browser
    window.open('https://docs.anthropic.com/claude-code', '_blank');
  }, []);

  // ==========================================================================
  // Todo Items
  // ==========================================================================

  const todoItems = todos.map((todo) => ({
    id: todo.id,
    content: todo.content,
    status: todo.status,
  }));

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="flex h-full flex-col bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <AppHeader
        title={chatName}
        onSettings={handleSettings}
        onHistory={handleHistory}
        onNewChat={handleNewChat}
        onRename={handleRename}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden relative">
        <MessageList className="h-full" />
      </main>

      {/* Todo List (conditional) */}
      {showTodoList && todoItems.length > 0 && (
        <TodoList
          items={todoItems}
          className="mx-3 mb-2 rounded-lg"
        />
      )}

      {/* Chat Input */}
      <ChatInput
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={handleStop}
        onFileDrop={handleFileDrop}
        isProcessing={isProcessing}
        planMode={planMode}
        thinkMode={thinkingMode}
        onPlanModeChange={togglePlanMode}
        onThinkModeChange={toggleThinkingMode}
        placeholder="Describe your code task..."
        inputTokens={totalTokensInput}
        outputTokens={totalTokensOutput}
        totalCost={totalCost}
      />

      {/* Thinking Overlay (fullscreen) */}
      <ThinkingOverlay
        variant="fullscreen"
        open={isThinkingOverlayVisible}
        message="Claude is thinking..."
        secondaryMessage="This may take a moment"
      />

      {/* Toast Notifications */}
      <Toast />

      {/* =================================================================
          MODALS
          ================================================================= */}

      {/* Settings Modal */}
      <SettingsModal
        open={activeModal === 'settings'}
        onClose={closeModal}
        // WSL Settings
        wslEnabled={wslEnabled}
        onWslEnabledChange={handleWslEnabledChange}
        wslDistribution={wslDistribution}
        onWslDistributionChange={handleWslDistributionChange}
        nodePath={nodePath}
        onNodePathChange={handleNodePathChange}
        claudePath={claudePath}
        onClaudePathChange={handleClaudePathChange}
        // Permissions
        yoloMode={yoloMode}
        onYoloModeChange={handleYoloModeChange}
        // Display
        compactToolOutput={compactToolOutput}
        onCompactToolOutputChange={handleCompactToolOutputChange}
        previewHeight={previewHeight}
        onPreviewHeightChange={handlePreviewHeightChange}
        compactMcpCalls={compactMcpCalls}
        onCompactMcpCallsChange={handleCompactMcpCallsChange}
        showTodoList={showTodoList}
        onShowTodoListChange={handleShowTodoListChange}
        onManageMcpServers={handleManageMcpServers}
      />

      {/* History Panel */}
      <HistoryPanel
        open={activeModal === 'history'}
        onClose={closeModal}
        conversations={historyConversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onRestoreCheckpoint={handleRestoreCheckpoint}
        searchValue={historySearchTerm}
        onSearchChange={setHistorySearchTerm}
      />

      {/* MCP Servers Panel */}
      <McpManagerPanel
        open={activeModal === 'mcpServers'}
        onClose={closeModal}
        servers={panelMcpServers}
        onSave={handleSaveMcpServer}
        onDelete={handleDeleteMcpServer}
        onToggle={handleToggleMcpServer}
      />

      {/* Model Selector Modal */}
      <ModelSelectorModal
        open={activeModal === 'modelSelector'}
        onClose={closeModal}
        selectedModel={currentModelOption}
        onSelectModel={handleSelectModel}
        onConfigure={handleConfigureModel}
      />

      {/* Slash Commands Modal */}
      <SlashCommandsModal
        open={activeModal === 'slashCommands'}
        onClose={closeModal}
        searchValue={slashSearchTerm}
        onSearchChange={setSlashSearchTerm}
        onSelectCliCommand={handleSelectCliCommand}
        onSelectSnippet={handleSelectSnippet}
      />

      {/* Install Modal (centered overlay) */}
      {activeModal === 'install' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <InstallModal
            state={installState}
            onInstall={handleInstall}
            onClose={closeModal}
            onViewDocs={handleViewDocs}
          />
        </div>
      )}
    </div>
  );
}
