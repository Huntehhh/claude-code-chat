# Switching Between Vanilla JS and React UI

This extension has two UI implementations that can be swapped:

| File | Description |
|------|-------------|
| `src/ui.ts` | Original vanilla JS UI (active by default) |
| `src/ui-react.ts` | React + Tailwind + shadcn UI |

## Switch to React UI

### Step 1: Update import in `src/extension.ts` (line ~6)

```typescript
// Change from:
import getHtml from './ui';

// To:
import getHtml from './ui-react';
```

### Step 2: Update `_getHtmlForWebview()` method in `src/extension.ts` (line ~2584)

```typescript
// Change from:
private _getHtmlForWebview(): string {
    return getHtml(vscode.env?.isTelemetryEnabled);
}

// To:
private _getHtmlForWebview(): string {
    const webview = this._panel?.webview ?? this._webview;
    if (!webview) {
        throw new Error('No webview available');
    }
    return getHtml(webview, this._extensionUri, vscode.env?.isTelemetryEnabled ?? false);
}
```

### Step 3: Rebuild

```bash
npm run compile
```

## Switch Back to Vanilla JS

Revert both changes above:

1. Change import back to `import getHtml from './ui';`
2. Change method back to `return getHtml(vscode.env?.isTelemetryEnabled);`
3. Run `npm run compile`

## Build Commands

```bash
npm run compile              # Full build (extension + webview)
npm run compile:extension    # Extension only
npm run compile:webview      # React webview only
npm run compile:webview -- --minify  # Production webview (144KB)
npm run watch                # Watch mode for development
```

## File Structure

```
src/
├── ui.ts              # Vanilla JS UI (imports script.ts, ui-styles.ts)
├── ui-react.ts        # React UI loader
├── script.ts          # Vanilla JS logic
├── ui-styles.ts       # Vanilla CSS styles
├── extension.ts       # Extension entry point
└── webview/           # React infrastructure
    ├── index.tsx      # React entry point
    ├── App.tsx        # Root component (shell)
    ├── components/    # shadcn + custom components
    ├── hooks/         # useVSCodeMessaging, etc.
    ├── stores/        # Zustand stores (chat, settings, ui)
    ├── lib/           # utils.ts, vscode.ts
    └── styles/        # globals.css (Tailwind + VS Code theme)
```

## Notes

- Both UIs can coexist - no conflicts
- React webview builds to `out/webview/` separately
- Vanilla JS remains in `out/script.js` and inline styles
- The React UI is a shell - components need to be built via `stitch-to-shadcn` skill
