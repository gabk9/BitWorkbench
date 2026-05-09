/**
 * BitWorkbench — Editor Selection Detector
 *
 * Watches for selection changes in the text editor and
 * extracts numeric literals with their prefixes for analysis.
 */

import * as vscode from 'vscode';

/**
 * A regex that matches any of the supported numeric literals:
 *   - 0x/0X hex:     0xFF, 0xDEADBEEF
 *   - 0b/0B binary:  0b1010
 *   - 0o/0O octal:   0o77
 *   - decimal:       255, -42
 *
 * The pattern is intentionally strict about prefix requirements.
 */
const NUMERIC_LITERAL_RE = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|-?[0-9]+)$/;

/**
 * Extract the selected text from the active editor.
 * Returns the trimmed selection, or null if nothing useful is selected.
 */
export function getSelectedText(editor: vscode.TextEditor): string | null {
  const selection = editor.selection;
  if (selection.isEmpty) {
    return null;
  }
  const text = editor.document.getText(selection).trim();
  return text || null;
}

/**
 * Check whether a string looks like a supported numeric literal.
 */
export function isNumericLiteral(text: string): boolean {
  return NUMERIC_LITERAL_RE.test(text);
}

/**
 * Register a listener that fires whenever the selection changes
 * in the active editor, and calls the callback with any detected
 * numeric literal.
 */
export function registerSelectionWatcher(
  context: vscode.ExtensionContext,
  callback: (value: string) => void
): void {
  const disposable = vscode.window.onDidChangeTextEditorSelection(event => {
    const editor = event.textEditor;
    const text = getSelectedText(editor);

    if (text && isNumericLiteral(text)) {
      callback(text);
    }
  });

  context.subscriptions.push(disposable);
}
