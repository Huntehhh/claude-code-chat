# Stitch HTML to Shadcn Components - Progress Report

## Summary

Converting 34 HTML design assets from Stitch into a complete shadcn component library for the Claude Code Chat VS Code extension.

---

## Completed Tasks

### 1. AI Analysis of Best Elements
- Used **Gemini 3 Pro Preview** and **Gemini 3 Flash Preview** to analyze all 34 screenshots
- Identified best version of each UI element across all designs

### 2. HTML Files Read & Analyzed
Reference files for exact styling:
- `claude_code_chat_main_interface_5/code.html` - Diff view, code blocks, footer
- `claude_code_chat_main_interface_17/code.html` - Todo list, header, input
- `file_picker_modal_dialog/code.html` - Quick pick list, search, kbd hints
- `model_selector_modal_dialog/code.html` - Radio options, modal structure
- `settings_modal_dialog/code.html` - Toggle switches, form inputs, badges
- `permission_request_dialog/code.html` - Permission cards, buttons

### 3. Design Tokens Extracted
```css
/* Core Colors */
--bg-main: #09090b
--bg-panel: #0f0f0f
--bg-input: #171717
--border-subtle: #222225
--text-primary: #fafafa
--text-muted: #8b8b94
--text-dim: #52525b
--accent: #FFA344 (orange)
--danger: #FF7369 (coral)

/* Diff Colors */
--diff-add-bg: rgba(255,163,68,0.1)
--diff-remove-bg: rgba(255,115,105,0.1)
--diff-add-text: #FFA344
--diff-remove-text: #FF7369

/* Typography */
Font Sans: Inter
Font Mono: JetBrains Mono

/* Border Radius - SHARP CORNERS */
Most elements: 0 (sharp)
Pills/badges: rounded-full
```

### 4. Components Updated
- **CodeBlock** (`src/webview/components/molecules/code-block.tsx`)
  - Removed `rounded-lg` → sharp corners
  - Updated header to match Interface 5

- **DiffView** (`src/webview/components/molecules/diff-view.tsx`)
  - Removed `rounded-lg` → sharp corners
  - Changed add color from emerald to orange (#FFA344)
  - Changed line number gutter colors

- **Badge** (`src/webview/components/ui/badge.tsx`)
  - Added `tool` variant for permission dialogs

### 5. New Components Created (Session 1)
- **PermissionCard** (`src/webview/components/molecules/permission-card.tsx`)
  - Based on `permission_request_dialog/code.html`
  - States: pending, approved, denied
  - Shows tool badge, command preview, action buttons

- **QuickPickList** (`src/webview/components/molecules/quick-pick-list.tsx`)
  - Based on `file_picker_modal_dialog/code.html`
  - VS Code Quick Pick style with search, icons, keyboard hints
  - Active indicator line on left (orange)

- **TodoList** (`src/webview/components/molecules/todo-list.tsx`)
  - Based on `claude_code_chat_main_interface_17/code.html`
  - Collapsible with count badge
  - Status icons: pending, in_progress, completed

### 6. New Components Created (Session 2)
- **InstallModal** (`src/webview/components/molecules/install-modal.tsx`)
  - Based on `install_modal/code.html`
  - Three states: initial, installing, success
  - Animated spinner and checkmark

- **ThinkIntensitySlider** (`src/webview/components/molecules/think-intensity-slider.tsx`)
  - Based on `think_intensity_modal_dialog_1/code.html`
  - Levels: Think, Hard, Harder, Ultra
  - Orange track with glow effect

- **ConversationItem** (`src/webview/components/molecules/conversation-item.tsx`)
  - Based on `conversation_history_panel/code.html`
  - Source badges: Chat (orange) / CLI (purple)
  - Expandable checkpoints with restore button

- **HistoryPanel** (`src/webview/components/organisms/history-panel.tsx`)
  - Slide-in panel from right
  - Search filtering
  - Conversation list with checkpoints

### 7. CSS Animations Added
- `modalEnter` - Modal fade + scale animation
- `statusPulse` - Processing indicator pulse
- `tinkeringSpin` - Loading spinner rotation
- `checkmarkDraw` - Success checkmark draw animation
- `slideFromRight` - History panel slide-in
- `.custom-radio` - Radio button styling with inner dot

---

## Still TODO

### ✅ COMPLETED - Modal Component
- Updated `src/webview/components/organisms/modal.tsx`
- Added CSS animation class `.animate-modal-enter`

### ✅ COMPLETED - RadioOption Component
- Updated `src/webview/components/molecules/radio-option.tsx`
- Fixed with CSS `.custom-radio` class for proper inner dot

### ✅ COMPLETED - ServerCard Component
- Already good, no changes needed

### ✅ COMPLETED - molecules/index.ts exports
- All new components exported

### ✅ COMPLETED - Conversation History Panel
- Created `ConversationItem` molecule
- Created `HistoryPanel` organism

### ✅ COMPLETED - Install Modal
- Created `src/webview/components/molecules/install-modal.tsx`
- Three states: initial, installing, success

### ✅ COMPLETED - Think Intensity Slider
- Created `src/webview/components/molecules/think-intensity-slider.tsx`
- Labels: Think, Hard, Harder, Ultra

---

## V2 Prompts - COMPLETED

### ✅ COMPLETED - Status Bar States Enhancement
- Updated `StatusIndicator` to use `animate-status-pulse` CSS class
- Already had Ready/Processing/Error states with proper styling

### ✅ COMPLETED - Input Drag-Over State
- Updated `ChatInput` with drag event handlers
- Added dashed amber border on drag-over
- Added "Drop file" overlay with upload icon
- Added `onFileDrop` callback prop

### ✅ COMPLETED - Settings Modal
- Created `src/webview/components/organisms/settings-modal.tsx`
- WSL Configuration section with conditional inputs
- Permissions section with rule list and YOLO mode
- Display section with renamed toggles:
  - "Compact MCP tool calls" (was "Hide MCP tool calls")
  - "Show to-do list" (was "Show Tasks panel")
- Added preview height pixel input next to Compact tool output

### ✅ COMPLETED - MCP Servers Modal
- Created `src/webview/components/organisms/mcp-servers-modal.tsx`
- Server list with type badges (HTTP/SSE/stdio)
- Add server form with conditional fields
- Popular servers grid using ServerCard
- Config Files section with 2x2 ghost link buttons:
  - Local MCP Config | Global MCP Config
  - Local Settings | Global Settings

---

## Key Design Decisions

### Sharp Corners Everywhere
The Stitch designs use **sharp corners (border-radius: 0)** for most elements to match VS Code's aesthetic. Only exceptions:
- Pills/toggles: `rounded-full`
- Some badges: `rounded` or `rounded-[3px]`

### Orange Accent for Diffs
Unlike typical green/red diffs:
- **Additions**: Orange (#FFA344) - matches Claude accent
- **Deletions**: Coral (#FF7369)

### V1 vs V2 Recommendation
- **Use V1 layout** for sidebar (single column, efficient)
- Use CSS container queries to switch to V2 (two-column) if user drags to editor pane

### Best Modals (10/10 ratings from AI)
1. File Picker - perfect Quick Pick implementation
2. Model Selector - flawless VS Code alignment
3. Permission Request - gold standard for security prompts

---

## File Structure

```
src/webview/components/
├── ui/                    # Atoms
│   ├── button.tsx         ✅ Updated
│   ├── badge.tsx          ✅ Updated (added tool variant)
│   ├── toggle.tsx         ✅ Already good
│   ├── input.tsx
│   ├── textarea.tsx
│   ├── icon.tsx
│   ├── kbd.tsx
│   ├── separator.tsx
│   ├── status-indicator.tsx
│   ├── file-mention.tsx
│   └── code-inline.tsx
├── molecules/             # Molecules
│   ├── code-block.tsx     ✅ Updated (sharp corners)
│   ├── diff-view.tsx      ✅ Updated (orange diffs)
│   ├── permission-card.tsx ✅ NEW
│   ├── quick-pick-list.tsx ✅ NEW
│   ├── todo-list.tsx      ✅ NEW
│   ├── list-item.tsx
│   ├── form-field.tsx
│   ├── search-input.tsx
│   ├── mode-toggle.tsx
│   ├── radio-option.tsx
│   ├── checkpoint-item.tsx
│   ├── server-card.tsx
│   └── collapsible-card.tsx
└── organisms/             # Organisms
    ├── app-header.tsx
    ├── status-footer.tsx
    ├── chat-input.tsx
    ├── modal.tsx          ⏳ Needs update
    └── message-block.tsx
```

---

## How to Continue

1. Run `/compact` to reduce context
2. Reference this file: `STITCH-TO-SHADCN-PROGRESS.md`
3. Continue with TODO items above
4. Test components match the HTML screenshots visually

---

## Reference Screenshots Location

```
C:\HApps\claude-code-chat\stitch_claude_code_chat_main_interface\
├── claude_code_chat_main_interface_1-18\
├── v2\
│   ├── claude_code_chat_main_interface_1-3\
│   ├── settings_modal_dialog\
│   └── mcp_servers_modal_dialog\
├── settings_modal_dialog\
├── mcp_servers_modal_dialog\
├── model_selector_modal_dialog\
├── file_picker_modal_dialog\
├── slash_commands_modal_dialog\
├── conversation_history_panel\
├── permission_request_dialog\
├── install_modal\
├── think_intensity_modal_dialog_1-2\
└── application_icon_sheet\
```

Each folder contains `code.html` (source) and `screen.png` (visual reference).
