/**
 * BitWorkbench — Webview Panel Provider
 *
 * Implements the VSCode WebviewViewProvider interface
 * to host the BitWorkbench sidebar panel.
 */

import * as vscode from 'vscode';
import { getWebviewContent } from './webviewContent';

export class BitWorkbenchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'bitworkbench.mainView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  /**
   * Called by VSCode when the webview view is first created
   * or when it becomes visible again.
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);

    // Listen for messages from the webview
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'copy') {
        await vscode.env.clipboard.writeText(msg.value);
        // Notify webview that copy succeeded
        webviewView.webview.postMessage({ type: 'copyDone', id: msg.id });
      }
    });
  }

  /**
   * Send a value string to the webview to populate the converter input.
   * Used when the user selects a numeric literal in the editor.
   */
  public sendInputValue(value: string): void {
    if (this._view) {
      this._view.show(true); // reveal without stealing focus
      this._view.webview.postMessage({ type: 'setInput', value });
    }
  }

  /**
   * Returns true if the webview is currently visible.
   */
  public get isVisible(): boolean {
    return this._view?.visible ?? false;
  }
}