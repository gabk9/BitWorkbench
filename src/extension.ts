/**
 * BitWorkbench — Extension Entry Point
 *
 * Registers the sidebar view provider, commands, and
 * editor selection watcher.
 */

import * as vscode from 'vscode';
import { BitWorkbenchViewProvider } from './providers/BitWorkbenchViewProvider';
import { registerSelectionWatcher, getSelectedText, isNumericLiteral, getNumericType } from './utils/selectionDetector';

/**
 * Called when the extension is activated.
 * Sets up all providers, commands, and event listeners.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('[BitWorkbench] Extension activated.');

  // ── Sidebar view provider ───────────────────────────────────────────────────
  const provider = new BitWorkbenchViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      BitWorkbenchViewProvider.viewType,
      provider,
      {
        // Keep the webview alive when hidden so state is preserved
        webviewOptions: { retainContextWhenHidden: true },
      }
    )
  );

  // ── Command: Open Panel ─────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('bitworkbench.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.bitworkbench');
    })
  );

  // ── Command: Analyze Selection (also bound to Ctrl+Shift+B) ────────────────
  context.subscriptions.push(
    vscode.commands.registerCommand('bitworkbench.analyzeSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('BitWorkbench: No active editor.');
        return;
      }

      const text = getSelectedText(editor);
      if (!text) {
        vscode.window.showInformationMessage('BitWorkbench: No text selected.');
        return;
      }

      if (!isNumericLiteral(text)) {
        vscode.window.showWarningMessage(
          `BitWorkbench: "${text}" is not a recognized numeric literal. ` +
          'Use prefixes: 0x (hex), 0b (binary), 0o (octal), or plain digits (decimal).'
        );
        return;
      }

      // Reveal sidebar and push value
      vscode.commands.executeCommand('workbench.view.extension.bitworkbench');
      provider.sendInputValue(text, getNumericType(text) ?? 'integer');
    })
  );

  // ── Auto-detect selection changes ──────────────────────────────────────────
  registerSelectionWatcher(context, (value: string, numType) => {
    // Only push to the panel when it is already visible
    // to avoid forcefully opening the sidebar on every cursor move.
    if (provider.isVisible) {
      provider.sendInputValue(value, numType);
    }
  });

  console.log('[BitWorkbench] All providers and commands registered.');
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  console.log('[BitWorkbench] Extension deactivated.');
}
