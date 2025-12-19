declare global {
  interface Window {
    acquireVsCodeApi: () => {
      postMessage: (message: unknown) => void;
      setState: (state: unknown) => void;
      getState: () => unknown;
    };
  }
}

class VSCodeAPI {
  private readonly vscode = window.acquireVsCodeApi();

  postMessage(message: unknown): void {
    this.vscode.postMessage(message);
  }

  setState(state: unknown): void {
    this.vscode.setState(state);
  }

  getState(): unknown {
    return this.vscode.getState();
  }
}

export const vscode = new VSCodeAPI();
