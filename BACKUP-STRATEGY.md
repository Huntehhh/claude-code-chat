# Backup Strategy Guide

> Prevent future code loss with Git version control and automated backups.

---

## The Problem

On December 18, 2025, uncommitted local changes were lost when the repository was freshly cloned. Features including auto-collapse settings, thinking mode defaults, YOLO popup removal, and history improvements were wiped because they were **never committed to Git**.

**Key lesson:** Always commit your changes. Git only protects what you commit.

---

## Two-Pronged Protection Strategy

### 1. Git Version Control (Primary)

Git is your first line of defense. Use it properly and you'll never lose code again.

#### Basic Daily Workflow

```bash
# See what changed
git status

# Stage all changes
git add .

# Save snapshot with descriptive message
git commit -m "Add auto-collapse setting to tools"

# View your history
git log --oneline
```

#### Recovery Commands

```bash
# See differences before committing
git diff

# Restore a file from last commit
git checkout HEAD -- src/ui.ts

# Restore from a specific commit
git checkout abc1234 -- src/extension.ts

# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# View all commits for a file
git log --oneline -- src/script.ts
```

#### Commit Frequency Guidelines

| Scenario | When to Commit |
|----------|----------------|
| New feature | After each working piece |
| Bug fix | After the fix is verified |
| Refactoring | After each logical change |
| End of session | Always commit WIP before closing |
| Before risky changes | Commit current state first |

#### WIP (Work In Progress) Commits

If you're not done but need to save:

```bash
git add .
git commit -m "WIP: halfway through settings modal"
```

Later, you can amend or squash these commits.

#### Git Stash (Temporary Storage)

```bash
# Save changes temporarily
git stash push -u -m "Settings work in progress"

# Do other work, then restore
git stash pop

# List all stashes
git stash list
```

---

### 2. Automated Backups (Safety Net)

Even with Git, automated backups provide extra protection.

#### Option A: FreeFileSync (Recommended)

**Free, open-source, great for developers**

1. Download from https://freefilesync.org/
2. Create a sync job:
   - Source: `C:\HApps\claude-code-chat`
   - Target: `D:\Backups\claude-code-chat` (different drive)
3. Enable "File Versioning" to keep old versions
4. Set up Windows Task Scheduler to run hourly

**Exclude patterns** (reduce backup size):
- `node_modules\`
- `out\`
- `*.vsix`
- `.git\objects\pack\`

#### Option B: Robocopy Script (Built into Windows)

Create `C:\Scripts\backup-code.bat`:

```batch
@echo off
set SOURCE=C:\HApps
set DEST=D:\Backups\HApps
set LOG=C:\Scripts\backup.log

robocopy "%SOURCE%" "%DEST%" /MIR /XD node_modules .git out /XF *.vsix /R:3 /W:5 /LOG+:"%LOG%" /NP

echo Backup completed at %date% %time% >> "%LOG%"
```

**Schedule with Task Scheduler:**
1. Open Task Scheduler
2. Create Basic Task → "Hourly Code Backup"
3. Trigger: Daily, repeat every 1 hour
4. Action: Start program → `C:\Scripts\backup-code.bat`

#### Option C: Windows File History

1. Settings → Update & Security → Backup
2. Add a drive for backup
3. "More options" → Back up every 1 hour
4. Add `C:\HApps` to backed up folders

---

## Recommended Setup

### Minimum Protection
- [ ] Commit to Git after every significant change
- [ ] Set up hourly FreeFileSync or Robocopy backup

### Better Protection
- [ ] All of the above
- [ ] Enable Windows File History
- [ ] Push to GitHub/GitLab as remote backup

### Best Protection
- [ ] All of the above
- [ ] Use VS Code's "Auto Save" (File → Auto Save)
- [ ] Install "Git Lens" extension for better Git visibility
- [ ] Set up pre-commit hooks for linting/testing

---

## Quick Reference Card

```bash
# Before starting work
git status              # What's changed?

# After finishing a piece
git add .
git commit -m "Description"

# Before risky experiments
git stash push -u

# End of day
git add . && git commit -m "WIP: end of day"

# Oh no, I broke something!
git checkout HEAD -- filename.ts
```

---

## Claude Code Integration

You can ask Claude to remind you to commit:

> "After major changes, remind me to commit to git"

Or use a hook in `.claude/settings.json`:

```json
{
  "hooks": {
    "afterEdit": "echo 'Remember to commit your changes!'"
  }
}
```

---

*Created December 18, 2025 after losing uncommitted changes*
