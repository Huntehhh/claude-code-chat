import * as vscode from 'vscode';

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

/**
 * React-based UI loader for Claude Code Chat
 *
 * To switch to React UI:
 * 1. In extension.ts, change: import getHtml from './ui';
 *    To: import getHtml from './ui-react';
 *
 * 2. Update _getHtmlForWebview() method to:
 *    private _getHtmlForWebview(): string {
 *      const webview = this._panel?.webview ?? this._webview;
 *      if (!webview) {
 *        throw new Error('No webview available');
 *      }
 *      return getHtml(webview, this._extensionUri, vscode.env?.isTelemetryEnabled ?? false);
 *    }
 */
const getHtml = (
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  isTelemetryEnabled: boolean
): string => {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.js')
  );
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.css')
  );
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline' https://fonts.googleapis.com;
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} data: https:;
    font-src ${webview.cspSource} https://fonts.gstatic.com;
    connect-src https://fonts.googleapis.com https://fonts.gstatic.com;
  ">
  <title>Claude Code Chat</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
  ${isTelemetryEnabled ? '<script defer src="https://cloud.umami.is/script.js" data-website-id="d050ac9b-2b6d-4c67-b4c6-766432f95644"></script>' : ''}
</body>
</html>`;
};

export default getHtml;
