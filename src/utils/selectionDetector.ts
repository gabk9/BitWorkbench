/**
 * BitWorkbench — Editor Selection Detector
 *
 * Watches for selection changes in the text editor and
 * extracts numeric literals with their prefixes for analysis.
 */

import * as vscode from 'vscode';

/**
 * A regex that matches integer numeric literals:
 *   - 0x/0X hex:     0xFF, 0xDEADBEEF
 *   - 0b/0B binary:  0b1010
 *   - 0o/0O octal:   0o77
 *   - decimal:       255, -42
 *
 * The pattern is intentionally strict about prefix requirements.
 */
const INTEGER_LITERAL_RE = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|0[oO][0-7]+|-?[0-9]+)$/;

/**
 * A regex that matches decimal floating-point literals:
 *   - Standard:      3.14, -0.5, 1.
 *   - Leading dot:   .25
 *   - Scientific:    1.5e10, 2.0E-3, 1e10
 *   - Special:       Infinity, +Infinity, -Infinity, NaN
 *   - Negative zero: -0  (IEEE-754 concept; distinct from the integer 0)
 *
 * Plain integers (no dot, no exponent, no negative-zero) are intentionally
 * excluded — they are handled by INTEGER_LITERAL_RE.
 */
const FLOAT_LITERAL_RE =
  /^([+-]?Infinity|NaN|-0|[+-]?(\d+\.\d*|\.\d+)([eE][+-]?\d+)?|[+-]?\d+[eE][+-]?\d+)$/;

/** The two value-type categories the extension distinguishes. */
export type NumericType = 'integer' | 'float';

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
 * Check whether a string looks like a supported integer literal.
 */
export function isIntegerLiteral(text: string): boolean {
  return INTEGER_LITERAL_RE.test(text);
}

/**
 * Check whether a string looks like a decimal floating-point literal.
 */
export function isFloatLiteral(text: string): boolean {
  return FLOAT_LITERAL_RE.test(text);
}

/**
 * Check whether a string looks like any supported numeric literal
 * (integer or float).
 */
export function isNumericLiteral(text: string): boolean {
  return isIntegerLiteral(text) || isFloatLiteral(text);
}

/**
 * Return the numeric type of a string, or null if it is not a
 * recognised numeric literal.
 */
export function getNumericType(text: string): NumericType | null {
  if (isFloatLiteral(text)) { return 'float'; }
  if (isIntegerLiteral(text)) { return 'integer'; }
  return null;
}

/**
 * Register a listener that fires whenever the selection changes
 * in the active editor, and calls the callback with the detected
 * numeric literal and its type.
 */
export function registerSelectionWatcher(
  context: vscode.ExtensionContext,
  callback: (value: string, type: NumericType) => void
): void {
  const disposable = vscode.window.onDidChangeTextEditorSelection(event => {
    const editor = event.textEditor;
    const text = getSelectedText(editor);

    if (text) {
      const numType = getNumericType(text);
      if (numType) {
        callback(text, numType);
      }
    }
  });

  context.subscriptions.push(disposable);
}
