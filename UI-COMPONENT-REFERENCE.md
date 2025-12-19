# Claude Code Chat - UI Component Reference

> Compact reference of all UI components and backend requirements for frontend review.

---

## Screens & Layouts

### Main Chat Screen
- **Header** (60px): Title (editable), settings btn, history btn, new chat btn
- **Messages Area** (flex:1, scroll): User/Claude/tool messages
- **Input Container** (auto-height): Toggles, textarea, controls
- **Status Bar** (32px): Status indicator, token count, stop btn

### Conversation History Panel
- Overlay below header, above input
- Scrollable list of past conversations
- Each item: title, source badge (CLI/internal), timestamp, preview
- Load on click, close button

---

## Message Types

### User Message
- Top border separator (except first)
- Copy button on hover
- Truncate at 400 chars with expand
- Supports @file references, images

### Claude Message
- Bullet marker left edge
- Full markdown: headers, lists, tables, code, blockquotes
- Copy button on hover

### Tool Use Message
- **Collapsed**: Icon + summary + chevron
- **Expanded**: Input params + result content
- Tool icon: 18px gradient square with letter
- File paths clickable
- Result truncated at 200 chars

### Tool Result
- Success: green checkmark
- Error: red X
- Duration badge (e.g., "0.2s")

### System Message
- Italic, muted, small (11px)

### Error Message
- Red-tinted background/border

### Thinking Message
- Collapsible thinking content
- Italic, muted styling

---

## Input System

### Mode Toggles
- **Plan First**: Boolean, sends `planMode: true` with message
- **Think Harder**: Boolean, opens intensity modal when enabled
  - Levels: think, think-hard, think-harder, ultrathink
  - Stored in settings

### Textarea
- Auto-expand with content
- Placeholder "Queue another message..."
- Focus border glow (#529CCA)
- Drag-drop file support (visual feedback)
- Paste image support (Ctrl+V)
- @ triggers file picker
- / triggers slash commands

### Control Buttons
- **Model dropdown**: Opus/Sonnet/Default selection
- **MCP dropdown**: Opens MCP modal
- **/ button**: Opens slash commands
- **@ button**: Opens file picker
- **Image button**: Native file picker for images
- **Send button**: Gradient circle (#FFA344→#FF7369), spring scale animation on click

---

## Modals

### Settings Modal (700px)
- **WSL Config**: enabled toggle, distro, node path, claude path
- **Permissions**: List with delete, add form, yolo mode toggle
- **Display**: compact tools, hide MCP, show todo panel

### MCP Servers Modal (700px)
- Active servers list: name, type badge, toggle, edit, delete
- Add server form: name, type (HTTP/SSE/stdio), conditional fields
- Popular servers grid: 6 preset servers with one-click add

### Model Selector Modal (400px)
- Three radio options: Opus, Sonnet, Default
- Default has "Configure" button (opens terminal)

### Slash Commands Modal (700px)
- Search input with / prefix
- Custom commands section: add/delete custom snippets
- Built-in commands section: 23 CLI commands
- Quick command input

### File Picker Modal (400px)
- Search input
- File list with icons, names, paths
- Keyboard navigation (arrows, enter, esc)
- Image thumbnails

### Thinking Intensity Modal (450px)
- Slider 0-3
- Labels: Think, Think Hard, Think Harder, Ultrathink
- Confirm button

### Install Modal
- Three states: initial, progress, success
- Install button triggers CLI installation

---

## Inline Components

### Permission Request Dialog
- Inline in message flow (not modal)
- Amber-tinted container
- Tool name badge + command display
- Buttons: Deny, Allow, Always Allow [pattern]
- Menu: Enable YOLO, Copy command
- States: pending, approved, denied, expired

### Todo Panel (collapsible)
- Above input area
- Header: icon, "Tasks", count badge, chevron
- Items: status icon + text
- Status: pending (⏳), in-progress (🔄), completed (✅)

### WSL Alert Banner
- Blue-tinted, dismissible
- "Enable WSL" and "Dismiss" buttons
- Shows on Windows when WSL not configured

---

## Code Display

### Code Block
- Header: language label + copy button
- Syntax highlighting (keywords, strings, comments, etc.)
- Monospace font, dark background

### Inline Code
- Peach background tint (#d19a66)
- Rounded, inline

### Diff Viewer
- File path header with "Open in VS Code Diff" button
- Added lines: green tint
- Removed lines: red tint
- Context lines: muted
- Collapsible with expand button

---

## Status & Loading

### Status Bar States
- **Ready**: Green dot, "Ready" text
- **Processing**: Orange pulsing dot, "Processing..." text, Stop button visible
- **Error**: Red dot

### Loading Indicators
- "Tinkering..." with asterisk (✳) spin animation
- "Running [toolName]..." text for tool execution
- Full overlay with gradient orb for thinking state

---

## Backend Message Types (Extension → Webview)

### Chat Flow
- `ready` - System initialized
- `userInput` - Display user message
- `output` - Claude response (markdown)
- `thinking` - Extended thinking content
- `error` - Error display
- `toolUse` - Tool invocation {toolName, input, toolUseId}
- `toolResult` - Tool result {toolName, result}
- `setProcessing` - Toggle loading state
- `loading` / `clearLoading` - Loading indicator

### Session
- `sessionInfo` - {sessionId, startTime}
- `sessionCleared` - New session
- `sessionResumed` - Resumed session
- `titleUpdated` - Chat title changed

### Tokens & Cost
- `updateTokens` - {inputTokens, outputTokens}
- `updateTotals` - {totalCost, totalTokens}

### Permissions
- `permissionRequest` - {id, toolName, input, suggestions}
- `updatePermissionStatus` - {id, status}

### Data Loading
- `conversationList` - Array of conversations
- `workspaceFiles` - Array of files for picker
- `mcpServers` - MCP server configs
- `permissionsData` - Permissions list
- `settingsData` - All settings
- `customSnippetsData` - Custom slash commands

### UI Control
- `restoreInputText` - Draft message
- `restoreScrollPosition` - Scroll offset
- `modelSelected` - Current model
- `imagePath` - Inserted image path

### Install
- `showInstallModal` - Trigger install flow
- `loginRequired` - Auth needed

---

## Backend Message Types (Webview → Extension)

### Chat Actions
- `sendMessage` - {text, planMode, thinkingMode}
- `newSession` - Create new chat
- `stopRequest` - Abort processing
- `renameChat` - {title}

### File Operations
- `openFile` - {filePath}
- `openDiff` - {oldContent, newContent, filePath}
- `createImageFile` - {imageData, imageType}
- `selectImageFile` - Trigger picker
- `getWorkspaceFiles` - {searchTerm}

### Conversation
- `getConversationList` - Load history
- `loadConversation` - {filename, source, path}
- `saveScrollPosition` - {scrollPosition}
- `saveInputText` - {text}

### Settings
- `getSettings` - Load all settings
- `updateSettings` - {settings object}
- `selectModel` - {model}
- `dismissWSLAlert` - Hide WSL prompt

### Permissions
- `getPermissions` - Load permissions
- `permissionResponse` - {id, approved, alwaysAllow}
- `addPermission` - {toolName, command}
- `removePermission` - {toolName, command}
- `enableYoloMode` - Skip all permissions

### MCP
- `loadMCPServers` - Load config
- `saveMCPServer` - {name, config}
- `deleteMCPServer` - {name}

### Snippets
- `getCustomSnippets` - Load snippets
- `saveCustomSnippet` - {snippet}
- `deleteCustomSnippet` - {snippetId}

### Commands
- `executeSlashCommand` - {command}
- `openModelTerminal` - Configure model
- `viewUsage` - Show usage stats
- `runInstallCommand` - Install CLI

---

## Data Structures

### ConversationIndexEntry
```
{filename, sessionId?, startTime, endTime?, messageCount,
 totalCost?, firstUserMessage, lastUserMessage?, source, path?}
```

### PermissionsData
```
{alwaysAllow: {toolName: boolean | string[]}}
```
- Pattern matching: "npm install *" matches "npm install @types/node"

### CommitInfo (Backups)
```
{id, sha, message, timestamp}
```

### MCP Server Config
```
{type: 'http'|'sse'|'stdio', url?, command?, args?, env?, headers?}
```

---

## Key UX Behaviors

- **Auto-scroll**: Scroll to bottom on new messages (unless user scrolled up)
- **Draft persistence**: Input text saved every 500ms
- **Scroll persistence**: Position restored on reload
- **Expand/collapse**: Tool results, diffs, thinking blocks
- **Keyboard shortcuts**: Enter=send, @=files, /=commands, Esc=close modals
- **Drag-drop**: Files into textarea
- **Paste**: Images from clipboard (Ctrl+V)
- **File links**: Click to open in editor
- **Copy buttons**: Messages, code blocks, tool outputs

---

## Color Reference (v3 - Notion/Stripe Fusion)

| Use | Hex |
|-----|-----|
| Canvas | #2F3438 |
| Panels | #373C3F |
| Cards | #3F4448 |
| Borders | #454B4E |
| Primary text | #E8E8E8 |
| Secondary text | #979A9B |
| Muted text | #6B7280 |
| Orange (CTA) | #FFA344 |
| Coral (warnings) | #FF7369 |
| Blue (links) | #529CCA |
| Purple (special) | #9A6DD7 |
| Green (success) | #4DAB9A |
| Pink (accent) | #E255A1 |

**Gradients:**
- Primary CTA: `linear-gradient(135deg, #FFA344, #FF7369)`
- Info/Links: `linear-gradient(135deg, #529CCA, #9A6DD7)`

---

*Reference v3.0 - December 18, 2025*
