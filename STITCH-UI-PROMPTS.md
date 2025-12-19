# Claude Code Chat - Stitch Prompts v3

**Purpose:** Consolidated prompts for Google Stitch (3 components per prompt)
**Style:** Modern Notion/Stripe fusion with Claude Code elements
**Key principle:** Full designs per prompt, screenshot after each success

---

## Build Order (7 Prompts)

1. **Prompt 1:** Complete app layout (header + chat container + input area + status bar)
2. **Prompt 2:** Chat messages (user messages + Claude responses + tool cards)
3. **Prompt 3:** Input controls and modes (textarea + toggles + control buttons + popups)
4. **Prompt 4:** Primary modals (settings modal + MCP servers modal + model selector)
5. **Prompt 5:** Secondary modals (conversation history + slash commands + file picker)
6. **Prompt 6:** Permission system (permission dialog + thinking intensity + install modal)
7. **Prompt 7:** Visual polish (code blocks + diff viewer + todo panel + loading states)

---

## PROMPT 1: Complete App Layout

```
Create "Claude Code Chat" - a VS Code extension sidebar panel for an AI coding assistant.

CRITICAL: ASPECT RATIO & DIMENSIONS
- This is a NARROW VERTICAL SIDEBAR, not a wide app
- Design for 380px width × 700px height (typical VS Code sidebar)
- Portrait orientation, similar to a mobile app but for desktop
- Think: Slack sidebar, Discord server panel, VS Code Explorer panel

DESIGN REFERENCES (study these for quality):
- Warp Terminal (terminal aesthetic, dark theme)
- Zed Editor (minimal, professional code UI)
- Linear App (premium SaaS, subtle depth)
- Arc Browser sidebar (vertical space, subtle borders)
- GitHub Copilot Chat in VS Code

STYLE REQUIREMENTS:
- Dark theme like Claude.ai or ChatGPT dark mode
- Subtle depth with layered backgrounds
- Refined 8px border-radius (not too sharp, not too round)
- Elegant typography with good spacing
- Orange accent color (#FF6B35) for primary actions
- Professional and polished, not generic or flat

COLORS:
- Background: #171717 (main canvas)
- Surface: #1e1e1e (header, input area)
- Card: #262626 (input field, hover states)
- Border: #333333
- Text: #ececec
- Muted: #888888
- Accent: #FF6B35

HEADER (52px, background #1e1e1e, border-bottom 1px #333333):
- Left: "Claude Code Chat" (15px, medium weight, #ececec)
- Right: Settings icon button (subtle), History icon button, "New Chat" button (#FF6B35 background, white text, 8px radius, padding 6px 14px)

CENTER AREA (flex 1, background #171717):
- Empty state centered: Subtle Claude-style sparkle or chat icon (32px, #FF6B35), "Ready to chat" heading (22px medium #ececec), "Ask a question or drop a file to start" subtext (14px #888888)

INPUT AREA (background #1e1e1e, border-top 1px #333333, padding 16px):
- Text input: background #262626, border 1px #333333, 8px radius, padding 12px, placeholder "Message Claude..." (#666666)
- Below input: Left side has "Plan" toggle and "Think" toggle (small pill toggles, #333333 track, #FF6B35 active). Right side has circular send button (36px, #FF6B35, white arrow icon)

STATUS BAR (32px, background #171717, border-top 1px #333333):
- Left: "Ask before edits" clickable text (12px #888888)
- Right: "81% context used" (12px #888888)
```

**Checkpoint:** Should look like it belongs in Claude.ai or Cursor IDE. Polished, professional, elegant dark theme.

---

## PROMPT 2: Chat Messages

```
In the CENTER PANEL, replace welcome state with chat conversation messages.

CHAT MESSAGES (scrollable area, padding 20px, background #2F3438):

User message: No background, 1px bottom border #454B4E as divider, padding 16px 0. Text 14px #E8E8E8 with line-height 1.6. Timestamp appears on hover (12px #6B7280). Copy icon button (ghost style) fades in on hover top-right.

Claude message: Subtle left accent with 3px left border gradient (#529CCA to #9A6DD7), padding-left 16px, margin 16px 0. Small asterisk bullet "✳" in muted blue (#529CCA) before first line. Full markdown support: headers, **bold**, *italic*, lists with proper spacing, tables. Copy button on hover. Text 14px with 1.6 line-height.

Tool use card COLLAPSED: Horizontal pill card with #3F4448 background, 1px #454B4E border, 10px radius, padding 10px 14px, margin 8px 0. Left: 24px gradient icon circle (#529CCA to #9A6DD7) with white tool letter/icon. Summary "📄 Reading src/main.py" (13px #979A9B). Right: subtle chevron rotates on expand. Entire card clickable, hover background #454B4E with 150ms ease.

Tool use card EXPANDED: Card expands smoothly (200ms ease-out). Chevron rotates 180°. Below summary: Input section with monospace font 13px in #373C3F inset box. File paths are clickable links (#529CCA, hover underline). Result below with "✓" success badge or "✗" error badge. Duration pill "0.2s" in muted style.

System message: Centered, 12px #6B7280, italic, 60% opacity.

Error message: Background rgba(255,115,105,0.1), left border 3px #FF7369, 10px radius, padding 14px.
```

**Checkpoint:** Screenshot. Verify gradient accents on Claude messages, modern tool cards, readable typography.

---

## PROMPT 3: Input Controls and Modes

```
Enhance the INPUT CONTAINER with refined controls and interactions.

MODE TOGGLES ROW (above textarea wrapper, 8px bottom margin): Two compact toggle pills with 12px gap. Each toggle has label text (12px #979A9B), pill switch (36px wide, 20px tall, #454B4E track with 10px radius, white 16px circle thumb with subtle shadow). Active state: track gradient (#FFA344 to #FF7369), thumb slides right with spring animation. "Plan" toggle and "Think" toggle (opens intensity picker when enabled).

TEXTAREA WRAPPER (background #3F4448, 1px #454B4E border, 12px radius): Textarea with transparent background, 14px padding, min-height 56px, 14px font Inter/system. Placeholder "Queue another message..." (#6B7280). Focus state: border glows #529CCA, box-shadow 0 0 0 3px rgba(82,156,202,0.15). Drag-over state: dashed #529CCA border, "Drop file here" overlay.

CONTROLS BAR (padding 8px 0, flex between): Left group with 8px gap has Model selector pill "Opus ▼" (#3F4448 background, 12px font, 6px 12px padding, 8px radius, hover #454B4E), MCP selector pill "MCP ▼" same style. Right group with 8px gap has "/" button (ghost, 32px square, hover #3F4448), "@" button (same), "🖼" image button (same), Send button (40px circle, gradient #FFA344 to #FF7369, white "↑" arrow, shadow 0 2px 8px rgba(255,163,68,0.3)).

SEND BUTTON ANIMATION: On click, button scales to 0.9 then springs to 1.0 (150ms), sends ripple effect outward, arrow briefly animates upward then resets.

FILE PICKER POPUP (triggered by @): Floating card 400px wide above input, #373C3F background, 1px #454B4E border, 12px radius, shadow 0 8px 32px rgba(0,0,0,0.3). Search input with magnifier icon. File list with file icon (colorful by type), filename (14px semibold), path (12px #6B7280). Hover #3F4448, selected has gradient left border. Footer "↑↓ Navigate • Enter Select • Esc Cancel".

SLASH POPUP (triggered by /): Same floating card style 320px wide. "/" badge prefix in search. Commands grouped: Custom section, Built-in section. Each has emoji, name (14px), description (12px #6B7280).
```

**Checkpoint:** Screenshot. Verify gradient toggles, send button animation, modern popups.

---

## PROMPT 4: Primary Modals

```
Design three primary modal dialogs with modern polish.

MODAL BACKDROP: Blurred dark overlay rgba(47,52,56,0.8) with backdrop-filter blur(4px). Click outside closes.

SETTINGS MODAL: Centered modal 640px wide, max 85vh. Background #373C3F, 1px #454B4E border, 16px radius, shadow 0 24px 48px rgba(0,0,0,0.4). Header "Settings" (18px semibold), X close button (ghost, hover #3F4448). Smooth slide-up + fade animation. Content with 24px padding, sections with 24px gaps. "WSL Configuration" heading (14px semibold #E8E8E8) with toggle row "Enable WSL" and description (13px #6B7280). When enabled: input fields slide down (WSL Distro, Node Path, Claude Path). "Permissions" heading with empty state (lock icon, "No permissions set"), permission list (max 250px scroll) with tool badge pills and trash icons, "➕ Add Rule" button (#529CCA), "Enable YOLO Mode" toggle with orange tint. "Display" heading with three switches: "Compact tool output", "Hide MCP calls", "Show Tasks panel".

MCP SERVERS MODAL: Same modal shell. Header "MCP Servers". Server list with icon/emoji, name (14px semibold), type pill (HTTP green, SSE blue, stdio purple), toggle switch, "···" menu. Dividers between. "➕ Add Server" expands inline form. "Popular Servers" section: 3-column grid of cards with hover lift. Each has large emoji (32px), name (13px semibold), description (12px #6B7280). Cards: 📚 Context7, 🧠 Memory, 🔗 Sequential, 🎭 Puppeteer, 🌐 Fetch, 📁 Filesystem.

MODEL SELECTOR MODAL: Smaller modal 420px. Header "Choose Model". Radio cards stacked vertically with 8px gap. Each card has radio circle left, model name + badge, description. Selected card has gradient left border and light fill. Options: "✨ Opus" (Most capable), "⚡ Sonnet" (Fast & capable), "🔧 Default" (Your settings) with "Configure" link.
```

**Checkpoint:** Screenshot. All three modals with modern rounded corners and animations.

---

## PROMPT 5: Secondary Modals

```
Design three secondary overlays with consistent polish.

CONVERSATION HISTORY PANEL: Slide-in panel from right, 400px wide, full height minus header. Background #373C3F, left border 1px #454B4E, shadow -8px 0 32px rgba(0,0,0,0.3). Header "History" (16px), search input, X close. Slide animation 250ms ease-out. Conversation items with 12px padding, 8px radius, margin 4px 8px, hover #3F4448. Title (14px semibold truncate), meta row with source pill ("CLI" purple gradient, "Chat" blue gradient), timestamp (12px #6B7280), message count. Preview text (13px #6B7280, 2 lines max). Active item has left gradient border.

SLASH COMMANDS MODAL: 640px wide modal. Sticky header with "/" search input (large, 16px). "Your Commands" section with grid of command pills, "➕ New" card with dashed border, add form inline (name input with "/" prefix, prompt textarea, Save/Cancel). "Quick Actions" section with colorful emoji grid: ⚡ Performance, 🔒 Security, 🔍 Review, 📖 Explain, 🐛 Debug, 🔄 Refactor, 🧪 Test, 📝 Document. "CLI Commands" section with scrollable list of 23 commands (emoji, name, description), click opens terminal.

FILE PICKER MODAL: 420px wide floating card. Header "Insert File", large search input. File list with colorful file type icons (JS yellow, TS blue, PY green), file name (14px), path (12px #6B7280). Images show 40px thumbnail. Hover #3F4448. Keyboard nav: ↑↓ arrows, Enter to select. Click outside or Esc closes.
```

**Checkpoint:** Screenshot. History panel, slash commands, file picker with colorful file icons.

---

## PROMPT 6: Permission System

```
Design permission and state components with clear visual hierarchy.

PERMISSION REQUEST (inline card in message flow): Margin 8px 0 16px. Background linear-gradient(135deg, rgba(255,163,68,0.08), rgba(255,115,105,0.08)), border 1px rgba(255,163,68,0.3), 12px radius, padding 16px. Slide-up animation. Header with ⚠️ warning icon (amber), "Permission needed" (14px semibold), "···" menu button. Menu options: "🚀 Enable YOLO", "📋 Copy command". Content has tool badge pill (gradient background), command display (monospace 13px, #3F4448 background with inset shadow, 10px 12px padding, 8px radius). Actions row (12px gap, right-aligned): "Deny" ghost button (#FF7369 text), "Allow" solid button (#3F4448), "Always Allow" accent button (gradient #529CCA to #9A6DD7, white text). Decided states (150ms fade): Approved has green tint background, "✓ Allowed" badge. Denied has red tint, "✗ Denied" badge. Expired is gray, 50% opacity.

THINKING INTENSITY MODAL: 420px wide centered modal. Header "Thinking Depth". Horizontal slider track (6px height, #454B4E, 20px radius). Thumb: 24px circle with gradient fill, shadow, scales on drag. Four stop positions with labels below: "💭 Think" → "🧠 Deep" → "🔥 Deeper" → "⚡ Ultra". Active label full color semibold, inactive 60% opacity. Labels clickable. Footer "Confirm" button full-width gradient.

INSTALL MODAL: Centered modal with dramatic presentation. Initial state: Large download icon (56px, gradient fill), "Install Claude Code" (20px semibold), "Required for this extension" (14px #6B7280), "Install Now" large button (full-width gradient, 48px height, 12px radius, hover lift). Progress state: Spinning gradient ring (48px), "Installing..." text, "This takes ~30 seconds" hint. Success state: Checkmark in circle (animated draw + scale), confetti burst animation, "Ready to go!" heading, "Start chatting" button.
```

**Checkpoint:** Screenshot. Permission card states, thinking slider, install flow with animations.

---

## PROMPT 7: Visual Polish & Loading States

```
Final polish pass for professional, delightful experience.

CODE BLOCKS: Container with #373C3F background, 10px radius, margin 12px 0, overflow hidden. Header bar #2F3438 background, padding 8px 12px, border-bottom 1px #454B4E. Language pill left (11px uppercase, #979A9B). Copy button right (ghost, hover #3F4448). Code padding 14px 16px, 13px monospace, line-height 1.5. Syntax colors: keywords #9A6DD7 purple, strings #4DAB9A green, comments #6B7280 italic, numbers #FFA344 orange, functions #529CCA blue, properties #E255A1 pink. Inline code: rgba(255,163,68,0.15) background, #FFA344 text, 3px 8px padding, 4px radius.

DIFF VIEWER: Container with 1px #454B4E border, 10px radius. Header has file path (monospace, clickable), "Open Diff" button. Added "+" lines: rgba(77,171,154,0.15) background, #4DAB9A text. Removed "-" lines: rgba(255,115,105,0.15) background, #FF7369 text. Context at 60% opacity. Line numbers gutter. Collapsible sections.

TODO PANEL (persistent, above input when enabled): Container #373C3F background, 1px #454B4E border, 10px top radius, margin 0 16px 8px. Header clickable (toggle collapse): 📋 icon, "Tasks" (13px semibold), count badge (gradient pill), chevron rotates. Items have status icons (⏳ gray, ✳ amber pulse, ✅ green), task text 13px. In-progress has subtle amber glow. Completed is strikethrough and muted.

LOADING STATES: "Tinkering" indicator with asterisk "✳" icon spin animation (1s linear infinite), "Tinkering..." text (14px italic #979A9B), appears inline after last message. Processing status bar with orange pill "Processing..." pulse, amber progress indicator, Stop button appears (ghost, #FF7369 text on hover). Full thinking overlay with semi-transparent #2F3438 at 90%, centered large animated gradient orb (48px, morphing shape), "Claude is thinking..." text.

MICRO-INTERACTIONS: All buttons have 150ms ease transitions, subtle scale on hover (1.02), press (0.98). Cards have hover lift with shadow increase. Focus rings are 3px #529CCA glow. Tooltips are dark pills with arrow, fade in 100ms. Success states have brief green pulse. Errors have brief red shake.
```

**Checkpoint:** Screenshot. Code blocks with vibrant syntax, diff viewer, todo panel, loading animations.

---

## Theme Quick Reference

**Backgrounds (Notion-inspired warm grays):**
- #2F3438 — Deepest (main canvas)
- #373C3F — Panels (header, sidebar, modals)
- #3F4448 — Cards, inputs, hover states
- #454B4E — Borders, dividers, subtle elements

**Text:**
- #E8E8E8 — Primary text
- #979A9B — Secondary text
- #6B7280 — Tertiary/placeholder
- #4B5563 — Disabled

**Accents:**
- #FFA344 — Orange (primary CTA, highlights)
- #FF7369 — Coral/Red (errors, warnings)
- #529CCA — Blue (links, focus, info)
- #9A6DD7 — Purple (special, premium)
- #4DAB9A — Green (success, positive)
- #E255A1 — Pink (accent, decorative)

**Gradients:**
- Primary CTA: linear-gradient(135deg, #FFA344, #FF7369)
- Info/Links: linear-gradient(135deg, #529CCA, #9A6DD7)
- Success: linear-gradient(135deg, #4DAB9A, #529CCA)

**Code Syntax:**
- #9A6DD7 — Keywords (purple)
- #4DAB9A — Strings (green)
- #6B7280 — Comments (gray)
- #FFA344 — Numbers (orange)
- #529CCA — Functions (blue)
- #E255A1 — Properties (pink)

**Typography:**
- Font: Inter, system-ui, -apple-system, sans-serif
- Monospace: 'Fira Code', 'SF Mono', Consolas, monospace
- Title: 18-20px semibold
- Headers: 14-16px semibold
- Body: 14px regular
- Small: 12-13px

**Spacing:**
- Border radius: 6px (small), 10px (medium), 12px (large), 20px (pills)
- Padding: 8px, 12px, 14px, 16px, 20px, 24px
- Gaps: 8px compact, 12px standard, 16px sections

**Animations:**
- Standard: 150-200ms ease
- Spring: cubic-bezier(0.34, 1.56, 0.64, 1)
- Slide: 250ms ease-out

---

## Key Updates from v2

1. **Warmer palette** — Notion-inspired #2F3438 base vs cold #0d1117
2. **Larger text** — 14px body for better readability
3. **Vibrant accents** — Orange #FFA344, Blue #529CCA gradients
4. **Loading state** — "Tinkering..." with asterisk animation
5. **Placeholder** — "Queue another message..." matching Claude Code
6. **Send animation** — Spring scale + ripple on click
7. **Gradient CTAs** — Orange-to-coral gradient buttons
8. **Rounded corners** — Larger 10-12px radius
9. **Blur effects** — Modal backdrop blur
10. **Micro-interactions** — Hover lifts, focus glows, press scales

---

## Usage Notes

1. **Run prompts in order** — Each builds on the previous
2. **Screenshot after each prompt** — Stitch can break layouts
3. **One state at a time** — Popups and modals shown as overlays
4. **Sequential references** — Prompts reference panels to anchor changes
5. **Verify before proceeding** — Check layout stability at each checkpoint

---

*Version 3.0 — Modern Notion/Stripe/Claude Code fusion*
*Created: December 18, 2025*
*Source: claude-code-chat codebase + design research*
