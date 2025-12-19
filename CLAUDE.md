# Claude Code Chat Extension

VS Code extension providing a chat interface for Claude Code CLI. Fork of [andrepimenta/claude-code-chat](https://github.com/andrepimenta/claude-code-chat).

## Project Goal

Make this extension look and function like the official Claude Code VS Code extension.

## CRITICAL: Main Branch Protection

**NEVER corrupt `main`.** When merging to main and conflicts occur:
1. **STOP** — do not auto-resolve if there's ANY uncertainty
2. **SHOW** — display the conflict with surrounding context
3. **ASK** — present resolution options and let user decide
4. Trivial conflicts (whitespace, import order): resolve automatically, note what was done

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

## Writing Rules

Whenever a user asks for "high-level documentation" Markdown Document, you shall always attempt to write with brevity, be succinct, and economical with your word choice; But still very detail-oriented and specific. Use visual diagrams to describe the problem from a high level when necessary,  And always keep it around 50 to 100 lines unless told otherwise. . 

## Git Rules

### Worktree Workflow

**At session start:** Always create a new worktree unless user explicitly says to use `main` or current branch.

```bash
git worktree add ../<project>-<feature> -b <feature-branch>
```

**Branch discipline:**

- Default to new worktree for all work
- Never push directly to `main`
- Commit only to current worktree's branch
- After ~5 turns or completing a feature, ask: *"Ready to merge this to main?"*

**Before merging:** Sync with latest main to reduce conflicts
```bash
git fetch origin && git rebase origin/main
```

**Merging to main:**
```bash
cd <main-repo>
git merge <feature-branch>
```

**After merging:** Cleanup immediately
```bash
git worktree remove ../<worktree> && git branch -d <branch>
```

**Conflict handling:**

- If conflict is obvious (whitespace, import order): resolve automatically
- If ANY uncertainty: stop and ask user before resolving
- Show conflict context and propose resolution options

### Auto-Commit Triggers

Commit when:

- Every ~5 chat turns during active development
- User says "save", "backup", "checkpoint", or executes /checkpoint
- Before risky operations (checkout, major refactor)
- After completing any feature or fix

### Session End

Always ask: *"Want me to commit and/or merge to main before we stop?"*