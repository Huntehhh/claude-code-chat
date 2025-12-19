# Stitch Prompt Examples

Real-world prompt patterns demonstrating the 5-part structure.

## Contents
- [Example 1: Foundation Layout](#example-1-foundation-layout)
- [Example 2: Chat Messages & Components](#example-2-chat-messages--components)
- [Example 3: Input Controls](#example-3-input-controls)
- [Example 4: Modal Design](#example-4-modal-design)
- [Example 5: Refinement Prompt](#example-5-refinement-prompt)
- [Build Order Pattern](#build-order-pattern)

---

## Example 1: Foundation Layout

**Use case:** Complete app layout with header, main area, input, status bar.

```
Dark sidebar panel for "Claude Code Chat" - an AI coding assistant.

STYLE: Warp Terminal meets Claude.ai. OLED black, minimal, premium developer tool.

COLORS:
- Background: #09090b (black), #0f0f0f (panels), #171717 (inputs)
- Text: #fafafa (primary), #8b8b94 (muted), #52525b (dim)
- Accent: #FFA344 (amber) - use for buttons and active states
- Borders: #222225, 1px only

RULES:
- Sharp corners on rectangles (0px radius)
- Pills/toggles stay rounded
- Compact layout, minimal padding

LAYOUT (top to bottom):
1. HEADER - 48px height, title left, settings/history/new button right
2. MAIN AREA - Black #09090b, centered "Ready" message
3. INPUT AREA - Dark panel with textarea, Plan/Think toggles, send button
4. STATUS BAR - 28px height, "ASK BEFORE EDITS" left, context % right
```

**Breakdown:**
- Context: "Dark sidebar panel for Claude Code Chat"
- Users/Goals: "AI coding assistant" (implicit developer user)
- Layout: Numbered sections with specs
- Visual: Full color palette with hex codes
- States: Implied via "active states" reference

---

## Example 2: Chat Messages & Components

**Use case:** Content types within an existing layout.

```
Add chat messages to the MAIN AREA. Same colors/style as previous.

MESSAGE TYPES:

1. USER MESSAGE
   - Text on black background, 14px #fafafa
   - @file references show as amber pills

2. CLAUDE MESSAGE
   - Left border: 2px amber #FFA344
   - Bullet "•" before text
   - Full markdown support

3. THINKING BLOCK (collapsible)
   - Header: "Thinking" + chevron
   - Collapsed by default
   - Content: italic, #8b8b94

4. TOOL CARDS (collapsible):
   - Read: Document icon, file path
   - Edit: Pencil icon, diff preview (red/green lines)
   - Bash: Terminal icon, command + output

5. CODE BLOCK
   - Dark container #0f0f0f, sharp corners
   - Header: language label + copy button
   - Syntax: amber keywords, coral numbers
```

**Breakdown:**
- Context: "Add chat messages" (builds on previous)
- Layout: Numbered message types with component specs
- Visual: References existing color scheme
- States: Collapsible behaviors defined

---

## Example 3: Input Controls

**Use case:** Interactive controls with states.

```
Enhance INPUT AREA with controls and popup overlays.

MODE TOGGLES:
- Two toggles side by side, 12px gap
- Track: 32×16px, #222225 bg, 8px radius
- Thumb: 12px circle, #fafafa
- Active: track #FFA344 with glow

TEXTAREA:
- Background: #171717, border 1px #222225
- Sharp corners, 12px padding, monospace 14px
- Placeholder: "Message..." (#52525b)
- Focus: border #FFA344

CONTROLS ROW (below textarea):
- Left: Model dropdown "Opus ▾", MCP dropdown "MCP ▾"
- Right: "/" button, "@" button, Send (32px amber circle)

FILE PICKER POPUP (triggered by @):
- Floating above input, 100% width
- Background #0f0f0f, border #222225, sharp corners
- Search input at top
- File list with colorful type icons (JS=#F7DF1E, TS=#3178C6)
- Keyboard nav: ↑↓ Enter Esc
```

**Breakdown:**
- Context: "Enhance INPUT AREA" (references existing)
- Layout: Component groups with detailed specs
- Visual: Colors, dimensions, typography
- States: Focus, hover, active, keyboard navigation

---

## Example 4: Modal Design

**Use case:** Overlay dialogs with sections.

```
Design Settings Modal (340px wide, centered).

MODAL SHELL:
- Background #0f0f0f, border 1px #222225, sharp corners
- Shadow: 0 8px 32px rgba(0,0,0,0.5)
- Header: "Settings" title, X close button
- Animation: fade + scale 0.95→1.0, 150ms

SECTIONS:

"WSL Configuration":
- Toggle: "Enable WSL"
- When enabled: WSL Distribution, Node.js Path, Claude Path inputs

"Permissions":
- Permission list with tool badges + patterns
- "Add Rule" button (#FFA344 text)
- "Enable YOLO Mode" toggle (warning tint when on)

"Display":
- "Compact tool output" toggle + pixel height input (60px wide)
- "Compact MCP tool calls" toggle
- "Show to-do list" toggle
```

**Breakdown:**
- Context: "Settings Modal"
- Layout: Organized sections with specific controls
- Visual: Dimensions, shadows, animations
- States: Toggle states, conditional visibility

---

## Example 5: Refinement Prompt

**Use case:** Single targeted change to existing design.

```
Update the EXISTING Settings Modal. DO NOT recreate.
Keep the same layout, just modify the "Display" section.

CHANGES TO "Display" SECTION:

1. RENAME "Hide MCP tool calls" → "Compact MCP tool calls"

2. ADD number input BESIDE "Compact tool output" toggle:
   - Position: right of toggle, inline
   - Width: 60px, background #171717, border 1px #222225
   - Label above: "Preview height" (11px, #8b8b94)
   - Suffix: "px" (11px, #52525b)
   - Default value: "150"

Keep all existing styling, colors, spacing.
```

**Key refinement patterns:**
- Explicitly reference existing element
- State "DO NOT recreate"
- Describe change precisely
- Confirm what to preserve

---

## Build Order Pattern

For complex multi-screen apps, follow this sequence:

### Prompt 1: Foundation
Complete app layout (header + main area + input + status bar)

### Prompt 2: Content
Chat messages, tool cards, code blocks, diff viewers

### Prompt 3: Controls
Textarea states, toggles, dropdowns, buttons, popups

### Prompt 4: Primary Modals
Settings, MCP servers, model selector

### Prompt 5: Secondary Modals
History panel, slash commands, file picker

### Prompt 6: Permission System
Permission dialogs, thinking intensity, install modal

### Prompt 7: Polish
Diff viewer details, todo panel, loading states, error states

**Each prompt builds on previous screens. User should verify Stitch output before generating the next prompt.**
