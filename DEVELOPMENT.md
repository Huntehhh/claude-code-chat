# Claude Code Chat Extension - Development Guide

## Loading the Extension Locally

There are three ways to load this extension into VS Code from your local system:

### Option 1: Debug Mode (Recommended for Development)

This is the best option when actively developing the extension.

1. Open the extension folder in VS Code:
   ```bash
   code C:\HApps\claude-code-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Press `F5` or go to **Run > Start Debugging**

4. A new VS Code window (Extension Development Host) opens with the extension loaded

5. Make changes to the code, then press `Ctrl+Shift+F5` to restart and see changes

### Option 2: Install VSIX Package

This creates a distributable package you can install like any other extension.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run compile
   ```

3. Install the VS Code Extension CLI (if not already installed):
   ```bash
   npm install -g @vscode/vsce
   ```

4. Create the VSIX package:
   ```bash
   npx vsce package
   ```
   This creates a file like `claude-code-chat-1.1.0.vsix`

5. Install in VS Code:
   - Open VS Code
   - Go to Extensions (`Ctrl+Shift+X`)
   - Click the `...` menu (top-right of Extensions panel)
   - Select **Install from VSIX...**
   - Navigate to and select the generated `.vsix` file

6. Reload VS Code when prompted

### Option 3: Symlink to Extensions Folder

This makes VS Code load the extension directly from your development folder.

1. Build the extension:
   ```bash
   npm install
   npm run compile
   ```

2. Create a symlink to VS Code's extensions directory:

   **Windows (PowerShell as Administrator):**
   ```powershell
   cmd /c mklink /D "$env:USERPROFILE\.vscode\extensions\claude-code-chat" "C:\HApps\claude-code-chat"
   ```

   **Windows (Command Prompt as Administrator):**
   ```cmd
   mklink /D "%USERPROFILE%\.vscode\extensions\claude-code-chat" "C:\HApps\claude-code-chat"
   ```

   **macOS/Linux:**
   ```bash
   ln -s /path/to/claude-code-chat ~/.vscode/extensions/claude-code-chat
   ```

3. Reload VS Code (`Ctrl+Shift+P` > "Developer: Reload Window")

4. After making code changes, run `npm run compile` and reload VS Code

## Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run compile` | Build TypeScript to JavaScript |
| `npm run watch` | Watch mode - auto-compile on changes |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## Project Structure

```
claude-code-chat/
├── src/
│   ├── extension.ts      # Main extension entry point
│   ├── ui.ts             # HTML template for webview
│   ├── script.ts         # Frontend JavaScript for webview
│   ├── ui-styles.ts      # CSS styles for webview
│   └── test/             # Test files
├── out/                  # Compiled JavaScript (generated)
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── DEVELOPMENT.md        # This file
```

## Debugging Tips

1. **View Extension Host Logs**: In the Extension Development Host window, open the Output panel (`Ctrl+Shift+U`) and select "Extension Host" from the dropdown.

2. **Webview Developer Tools**: Right-click in the chat webview and select "Open DevTools" to debug frontend code.

3. **Breakpoints**: Set breakpoints in `src/extension.ts` and they will be hit when debugging.

## Troubleshooting

### Extension not loading after VSIX install
- Ensure you ran `npm run compile` before packaging
- Check the VS Code Developer Tools console for errors (`Help > Toggle Developer Tools`)

### Changes not appearing
- For debug mode: Press `Ctrl+Shift+F5` to restart
- For symlink/VSIX: Run `npm run compile` and reload VS Code

### TypeScript errors
- Run `npm run compile` to see detailed error messages
- Ensure all dependencies are installed with `npm install`
