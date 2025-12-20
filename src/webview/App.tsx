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
import { ImageLightbox } from './components/molecules/image-lightbox';
import { Toast } from './components/atoms/toast';
import { ThinkingIntensityModal } from './components/organisms/thinking-intensity-modal';

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
    thinkingIntensity,
    showTodoList,
    togglePlanMode,
    toggleThinkingMode,
    setThinkingIntensity,
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
    lightbox,
    closeLightbox,
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
  // Thinking Mode Handlers
  // ==========================================================================

  const handleOpenThinkingModal = useCallback(() => {
    console.log('[Think] Opening thinking intensity modal, current intensity:', thinkingIntensity);
    openModal('thinkingIntensity');
  }, [openModal, thinkingIntensity]);

  const handleConfirmThinkingIntensity = useCallback((intensity: typeof thinkingIntensity) => {
    console.log('[Think] Confirmed intensity:', intensity);
    setThinkingIntensity(intensity);
    // Enable thinking mode when selecting an intensity
    if (!thinkingMode) {
      toggleThinkingMode();
    }
    // TODO: Send to backend
    updateSettingsBackend({ thinkingIntensity: intensity });
  }, [setThinkingIntensity, thinkingMode, toggleThinkingMode, updateSettingsBackend]);

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

  const handleSelectConversation = useCallback((historyConv: { id: string; source: 'chat' | 'cli'; title?: string }) => {
    console.log('[SelectConv] historyConv:', historyConv);
    console.log('[SelectConv] Looking for sessionId:', historyConv.id, 'with source:', historyConv.source === 'chat' ? 'internal' : 'cli');

    // Log all conversations with matching sessionId
    const matching = conversations.filter((c) => c.sessionId === historyConv.id);
    console.log('[SelectConv] Matching conversations:', matching.map(c => ({ sessionId: c.sessionId, source: c.source, filename: c.filename })));

    // Find the original conversation data from the store for filename/source/cliPath
    // IMPORTANT: Prefer matching source type first to handle sessionId collisions
    // (internal conversations may share sessionId with CLI conversations they originated from)
    let original = conversations.find((c) =>
      c.sessionId === historyConv.id &&
      (historyConv.source === 'chat' ? c.source === 'internal' : c.source === 'cli')
    );

    console.log('[SelectConv] Source-specific match found?', !!original);

    // Fallback to any match if source-specific match not found
    if (!original) {
      original = conversations.find((c) => c.sessionId === historyConv.id);
      console.log('[SelectConv] Using fallback match:', original ? { source: original.source, filename: original.filename } : 'none');
    }

    if (original) {
      // Use the title from historyConv directly - it's what's displayed in the history panel
      const title = historyConv.title || original.name || original.chatName || original.firstUserMessage || 'Claude Code Chat';
      console.log('[SelectConv] Loading with source:', original.source, 'cliPath:', original.cliPath);
      setChatName(title);
      loadConversation(original.filename, original.source, original.cliPath);
    }
    closeModal();
  }, [conversations, loadConversation, closeModal, setChatName]);

  const handleRestoreCheckpoint = useCallback((conversation: Conversation, checkpoint: { sha: string }) => {
    // TODO: Implement checkpoint restore
    console.log('Restore checkpoint:', conversation.id, checkpoint.sha);
  }, []);

  // Convert store conversations to HistoryPanel format
  // c.name already has chatName || firstUserMessage from the message handler
  const historyConversations = conversations.map((c) => ({
    id: c.sessionId,
    title: c.name || c.chatName || c.firstUserMessage || 'Untitled',
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
    <div className="flex h-full flex-col bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Header */}
      <AppHeader
        title={chatName}
        onSettings={handleSettings}
        onHistory={handleHistory}
        onNewChat={handleNewChat}
        onRename={handleRename}
      />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden relative min-h-0">
        <MessageList className="h-full overflow-x-hidden" />
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
        onThinkModeChange={handleOpenThinkingModal}
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

      {/* Image Lightbox */}
      <ImageLightbox
        src={lightbox.imageSrc}
        alt={lightbox.imageAlt}
        open={lightbox.isOpen}
        onClose={closeLightbox}
      />

      {/* Thinking Intensity Modal */}
      <ThinkingIntensityModal
        key={`think-modal-${activeModal === 'thinkingIntensity'}`}
        open={activeModal === 'thinkingIntensity'}
        onClose={closeModal}
        currentIntensity={thinkingIntensity}
        onConfirm={handleConfirmThinkingIntensity}
      />
    </div>
  );
}
