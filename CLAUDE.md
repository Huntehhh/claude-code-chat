# Claude Code Chat Extension

VS Code extension providing a chat interface for Claude Code CLI. Fork of [andrepimenta/claude-code-chat](https://github.com/andrepimenta/claude-code-chat).

## Project Goal

Make this extension look and function like the official Claude Code VS Code extension.

## Key Files

- `src/extension.ts` - Backend logic, message handling
- `src/ui.ts` - HTML template
- `src/ui-styles.ts` - CSS styles
- `src/script.ts` - Frontend JavaScript

## Build Commands

```bash
npm run compile                    # Build
npx vsce package --allow-missing-repository  # Package VSIX
code --install-extension claude-code-chat-1.1.0.vsix --force
```

---

## Git Commit Rules

**IMPORTANT:** Commit frequently to prevent code loss.

### Auto-Commit Triggers

Commit when:
- Every ~5 chat turns during active development
- User says "save", "backup", "checkpoint"
- User mentions "continue later" or "stopping"
- Before any risky operation (git checkout, major refactor)
- After completing any feature or fix

### Commit Command

```bash
git add . && git commit -m "Description of changes"
```

### Before Ending Session

Always ask: *"Want me to commit these changes before we stop?"*

---

## Reference Docs

- `UI-COMPONENT-REFERENCE.md` - Complete UI spec
- `CONTINUATION-PROMPT.md` - Pending fixes
- `RECOVERY-PLAN.md` - Lost features to rebuild
- `BACKUP-STRATEGY.md` - Backup setup guide
