# Claude Code Chat Extension - Continuation Prompt

## Project Context

This is a forked VS Code extension called "Claude Code Chat" located at `C:\HApps\claude-code-chat`. The goal is to make it look and function as close to the official Claude Code VS Code extension as possible.

## Previous Session Accomplishments

### Phase 1-6 Completed:
1. **Removed colored sidebars** from all message types (user, claude, tool, tool-result, thinking, error)
2. **Added minimal separator styling** - user messages have subtle top border
3. **Improved markdown** - headers (h1: 1.5em, h2: 1.3em, h3: 1.15em), better lists with nested support
4. **Added user message truncation** (>400 chars) - BUT NOT WORKING, needs fix
5. **Redesigned tool displays** - CLI-style with displayType-based rendering
6. **Replaced marked.js with markdown-it** for better markdown rendering
7. **Fixed JSONL parsing** - added `case 'response':` handler in script.ts

### Key Files Modified:
- `src/ui-styles.ts` - All CSS styling
- `src/script.ts` - Frontend JavaScript (message rendering, tools, truncation)
- `src/ui.ts` - HTML template
- `src/extension.ts` - Backend logic, JSONL parsing

---

## PENDING FIXES (TODO LIST)

### 1. Auto-scroll to Bottom on Conversation Load
**Problem:** When loading a past conversation from history, it doesn't scroll to the bottom.

**File:** `src/script.ts`

**Fix needed:** After all messages are loaded from JSONL, force scroll to bottom. Look for `case 'sessionCleared':` handler and the message loading loop. Need to add a scroll after all messages are rendered.

**Also check:** `src/extension.ts` around line 2728-2743 where messages are sent after loading JSONL - may need to send a "scrollToBottom" message after the loop completes.

---

### 2. Fix Inline Code Color (Orangish-Red)
**Problem:** Inline code should be orangish-red like the official extension.

**File:** `src/ui-styles.ts`

**Current:** Look for `.message code` or `code` styling
**Target color:** Approximately `#e06c75` or similar warm orange-red

---

### 3. Fix Bash Tool Display
**Problem:** Bash tool shows the command, but should show "Bash" + description (like "Bash Run tests to verify fix")

**File:** `src/script.ts`

**Current code (around line 176-179):**
```javascript
case 'Bash':
    const cmd = input.command || '';
    const shortCmd = cmd.length > 60 ? cmd.substring(0, 60) + '...' : cmd;
    return { icon: '$', text: shortCmd, displayType: 'bash' };
```

**Fix:** Use `input.description` instead of `input.command`:
```javascript
case 'Bash':
    const desc = input.description || input.command || '';
    const shortDesc = desc.length > 50 ? desc.substring(0, 50) + '...' : desc;
    return { icon: '', text: 'Bash', description: shortDesc, displayType: 'bash' };
```

Also update the rendering in `addToolUseMessage` (around line 244-247) to show "Bash" followed by the description.

---

### 4. Make Edit Tools Expanded by Default
**Problem:** Edit/Write tools are collapsed by default, should be expanded.

**File:** `src/script.ts`

**Current code (around line 330-332):**
```javascript
const detailsDiv = document.createElement('div');
detailsDiv.className = 'tool-details';
detailsDiv.style.display = 'none';  // <-- This hides it
```

**Fix:** For edit/write tools, set `display = 'block'` and update the expand button to show `▼` instead of `▶`:
```javascript
// For edit/write displayTypes, start expanded
if (summary.displayType === 'edit' || summary.displayType === 'write') {
    detailsDiv.style.display = 'block';
    if (expandBtn) {
        expandBtn.textContent = '▼';
        expandBtn.title = 'Hide details';
    }
}
```

---

### 5. Indent Claude Responses + Add Bullet Dots
**Problem:** Hard to distinguish Claude responses from user messages. Claude messages should:
- Be indented (left margin/padding)
- Have a small bullet dot indicator before each response

**File:** `src/ui-styles.ts`

**Add/modify `.message.claude` styling:**
```css
.message.claude {
    margin-left: 16px;
    padding-left: 16px;
    position: relative;
}

.message.claude::before {
    content: '•';
    position: absolute;
    left: 0;
    top: 0;
    color: var(--vscode-descriptionForeground);
    font-size: 12px;
}
```

**Note:** We removed `::before` earlier for sidebars, but now we need it back with a bullet dot instead of a colored bar.

---

### 6. Fix User Message Truncation (NOT WORKING)
**Problem:** Long user messages should truncate at ~400 chars with "Show more" button. Currently not working.

**File:** `src/script.ts`

**Current code (around line 98-121):** The truncation logic exists but may not be triggering. Debug by:
1. Check if `content.length > 400` condition is being met
2. The HTML being generated uses `parseSimpleMarkdown()` on truncated content - this might be stripping the truncation
3. The IDs generated need to match what `toggleResultExpansion()` expects

**Potential fix:** The truncation is applied BEFORE `parseSimpleMarkdown()` is called on the content. But looking at line 113-118, it's building raw HTML. The issue might be that when the message handler receives content, it's already been parsed.

Check the message handler around line 2376-2381:
```javascript
case 'userInput':
    if (message.data.trim()) {
        addMessage(parseSimpleMarkdown(message.data), 'user');
    }
    break;
```

The content is already markdown-parsed BEFORE `addMessage()`. The truncation inside `addMessage()` then tries to truncate already-parsed HTML, which breaks.

**Fix:** Move truncation BEFORE the parseSimpleMarkdown call:
```javascript
case 'userInput':
    if (message.data.trim()) {
        let content = message.data;
        // Truncate raw content before parsing markdown
        if (content.length > 400) {
            // Truncation logic here, THEN parse both parts
        }
        addMessage(parseSimpleMarkdown(content), 'user');
    }
    break;
```

Or handle truncation differently - truncate the RAW text, then parse each part separately.

---

### 7. Enable Thinking Mode by Default (Set to "Think Harder")
**Problem:** Thinking mode should be ON by default with "think harder" level.

**Files to check:**
- `src/script.ts` - Look for `thinkingModeEnabled` initialization (around line 17)
- `src/extension.ts` - Look for where thinking mode state is initialized/sent

**Current:** `let thinkingModeEnabled = false;`
**Fix:** `let thinkingModeEnabled = true;`

Also need to set the default thinking level. Search for where `--think` or thinking level is set.

---

## File Reference Quick Guide

| File | Purpose | Key Line Numbers |
|------|---------|------------------|
| `src/script.ts` | Frontend JS - rendering, tools, truncation | 60-145 (addMessage), 157-207 (getToolSummary), 209-418 (addToolUseMessage), 2376 (userInput handler) |
| `src/ui-styles.ts` | All CSS | 723-800 (message styles), 2535-2621 (markdown), 3487-3536 (tool styles) |
| `src/extension.ts` | Backend - JSONL loading, message sending | 2600-2750 (JSONL parsing), 2728-2743 (message sending loop) |
| `src/ui.ts` | HTML template | CDN scripts, basic structure |

---

## Testing Checklist After Fixes

- [ ] Load a past conversation → auto-scrolls to bottom
- [ ] Inline code renders in orangish-red color
- [ ] Bash tools show "Bash [description]" not the command
- [ ] Edit/Write tools are expanded by default
- [ ] Claude messages have bullet dot and are indented
- [ ] Long user messages (>400 chars) truncate with "Show more"
- [ ] Thinking mode is ON by default
- [ ] No TypeScript compilation errors
- [ ] Extension packages successfully

---

## Commands to Build & Test

```bash
# Compile TypeScript
cd C:\HApps\claude-code-chat && npm run compile

# Check for errors without building
npx tsc --noEmit

# Package extension
npx vsce package --no-update-package-json --no-git-tag-version

# Install extension
code --install-extension claude-code-chat-1.1.0.vsix --force
```

---

## Screenshot Reference Summary

From user's screenshots comparing our extension (left) vs official (right):

1. **Image 1-2:** Conversation loads but doesn't scroll to bottom
2. **Image 3:** Bash shows command instead of description
3. **Image 4:** Edits are collapsed (should be expanded), shows diff comparison
4. **Image 5-6:** Hard to tell Claude responses apart - need indentation + bullets
5. **Image 7:** User message not truncated (very long message shown in full)

---

## Resume Instructions

When resuming after compact:

1. Read this file first: `C:\HApps\claude-code-chat\CONTINUATION-PROMPT.md`
2. Start with the TODO list - each item has detailed fix instructions
3. Files are in `C:\HApps\claude-code-chat\src\`
4. Test after each fix with `npm run compile`
5. Package and install when all fixes complete
