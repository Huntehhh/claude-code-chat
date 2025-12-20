# Component Inventory - Stitch to shadcn Conversion

Generated from analysis of 25+ HTML files from Google Stitch export.

## Theme Configuration

```typescript
// Add to tailwind.config.js
colors: {
  "bg-main": "#09090b",
  "bg-panel": "#0f0f0f",
  "bg-input": "#171717",
  "border-subtle": "#222225",
  "text-primary": "#fafafa",
  "text-muted": "#8b8b94",
  "text-dim": "#52525b",
  "accent": "#FFA344",
  "danger": "#FF7369",
}
fontFamily: {
  sans: ["Inter", "sans-serif"],
  mono: ["JetBrains Mono", "monospace"],
}
```

---

## ATOMS (`ui/`)

### 1. Button
**File:** `ui/button.tsx`
**shadcn:** Extend existing
**CVA Variants:**
- `variant`: default, ghost, icon, accent, destructive, link
- `size`: sm, default, lg, icon

### 2. Badge
**File:** `ui/badge.tsx`
**shadcn:** Extend existing
**CVA Variants:**
- `variant`: default, chat, cli, http, sse, stdio, read, write, exec, outline

### 3. Toggle
**File:** `ui/toggle.tsx`
**Custom:** Yes (peer-checked pattern)
**CVA Variants:**
- `variant`: default, danger (for YOLO mode)

### 4. Input
**File:** `ui/input.tsx`
**shadcn:** Extend existing

### 5. Textarea
**File:** `ui/textarea.tsx`
**shadcn:** Extend existing

### 6. StatusIndicator
**File:** `ui/status-indicator.tsx`
**Custom:** Yes
**CVA Variants:**
- `status`: ready, processing, error, success
- `size`: sm, default

### 7. Icon
**File:** `ui/icon.tsx`
**Custom:** Material Symbols wrapper
**Props:** `name`, `size`, `filled`

### 8. FileMention
**File:** `ui/file-mention.tsx`
**Custom:** Yes
**Props:** `path`, `onClick`

### 9. CodeInline
**File:** `ui/code-inline.tsx`
**Custom:** Yes

### 10. Kbd
**File:** `ui/kbd.tsx`
**shadcn:** Available (use it)

### 11. Separator
**File:** `ui/separator.tsx`
**shadcn:** Use existing

### 12. TokenDisplay
**File:** `ui/token-display.tsx`
**Custom:** Yes (popover with token usage stats)
**CVA Variants:**
- `state`: idle, streaming
**Sub-components:** TokenRow, TokenSection
**Props:** `inputTokens`, `outputTokens`, `totalCost`, `isStreaming`, `formatTokens`, `onSettingsClick`

---

## MOLECULES (`molecules/`)

### 1. CollapsibleCard
**File:** `molecules/collapsible-card.tsx`
**Base for:** ToolResult, ThinkingBlock, DiffBlock
**Props:** `icon`, `title`, `subtitle`, `defaultOpen`, `children`

### 2. CodeBlock
**File:** `molecules/code-block.tsx`
**Uses:** prism-react-renderer (already installed)
**Props:** `code`, `language`, `filename`, `showLineNumbers`

### 3. DiffView
**File:** `molecules/diff-view.tsx`
**Extends:** CodeBlock
**Props:** `oldCode`, `newCode`, `filename`, `additions`, `deletions`

### 4. ListItem
**File:** `molecules/list-item.tsx`
**Generic base for:** FilePickerItem, ConversationItem, ServerItem, CommandItem
**Props:** `icon`, `title`, `subtitle`, `meta`, `actions`, `active`, `onClick`

### 5. FormField
**File:** `molecules/form-field.tsx`
**Props:** `label`, `helper`, `error`, `children`

### 6. SearchInput
**File:** `molecules/search-input.tsx`
**Composition:** Icon + Input
**Props:** `placeholder`, `value`, `onChange`

### 7. ModeToggle
**File:** `molecules/mode-toggle.tsx`
**Props:** `label`, `active`, `onClick`

### 8. RadioOption
**File:** `molecules/radio-option.tsx`
**Props:** `value`, `label`, `description`, `checked`, `onChange`

### 9. CheckpointItem
**File:** `molecules/checkpoint-item.tsx`
**Props:** `hash`, `description`, `timestamp`, `onRestore`

### 10. ServerCard
**File:** `molecules/server-card.tsx`
**Props:** `emoji`, `title`, `description`, `onAdd`

---

## ORGANISMS (`organisms/`)

### 1. AppHeader
**File:** `organisms/app-header.tsx`
**Composition:** Icon + Button + Logo
**Props:** `title`, `onSettings`, `onHistory`, `onNewChat`

### 2. ChatInput
**File:** `organisms/chat-input.tsx`
**Composition:** Textarea + ModeToggle + Button + StatusFooter
**Props:** `value`, `onChange`, `onSubmit`, `isProcessing`, `planMode`, `thinkMode`

### 3. StatusFooter
**File:** `organisms/status-footer.tsx`
**Composition:** StatusIndicator + text
**Props:** `status`, `contextUsage`, `onStop`

### 4. Modal (Base)
**File:** `organisms/modal.tsx`
**Props:** `open`, `onClose`, `title`, `children`

### 5. SettingsModal
**File:** `organisms/settings-modal.tsx`
**Extends:** Modal
**Sections:** WSL Config, Permissions, Display

### 6. McpServersModal
**File:** `organisms/mcp-servers-modal.tsx`
**Extends:** Modal
**Sections:** Server list, Add form, Popular servers grid

### 7. ModelSelectorModal
**File:** `organisms/model-selector-modal.tsx`
**Extends:** Modal
**Composition:** RadioOption list

### 8. FilePickerModal
**File:** `organisms/file-picker-modal.tsx`
**Extends:** Modal
**Composition:** SearchInput + ListItem list + Kbd hints

### 9. SlashCommandsModal
**File:** `organisms/slash-commands-modal.tsx`
**Extends:** Modal
**Sections:** Custom commands, Snippets grid, CLI commands list

### 10. ConversationHistoryPanel
**File:** `organisms/conversation-history-panel.tsx`
**Composition:** SearchInput + ConversationItem list + CheckpointItem

### 11. MessageBlock
**File:** `organisms/message-block.tsx`
**Types:** UserMessage, AssistantMessage, ThinkingBlock, ToolResult
**Props:** `type`, `content`, `toolName`, `status`

---

## Implementation Priority

### Phase 1: Core UI (atoms)
1. Button (extend shadcn)
2. Badge (extend shadcn)
3. Input/Textarea (extend shadcn)
4. Toggle
5. StatusIndicator
6. Icon
7. FileMention
8. CodeInline

### Phase 2: Building Blocks (molecules)
1. CollapsibleCard
2. CodeBlock
3. DiffView
4. ListItem
5. SearchInput
6. ModeToggle
7. FormField

### Phase 3: Main Components (organisms)
1. AppHeader
2. ChatInput + StatusFooter
3. MessageBlock
4. Modal (base)
5. All modal variants

---

## Notes

- All components use `cn()` from `@/lib/utils`
- CVA for all variant-based components
- React.forwardRef for DOM element access
- "use client" only when needed (useState, useEffect, handlers)
- Export both component and variants type
