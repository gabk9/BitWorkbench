/**
 * BitWorkbench — Webview Content Provider
 *
 * Generates the HTML, CSS, and JavaScript for the
 * BitWorkbench sidebar webview panel.
 */

import * as vscode from 'vscode';

/**
 * Returns the full HTML document for the BitWorkbench webview.
 * The webview uses a self-contained script — no external dependencies.
 */
export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${webview.cspSource} 'unsafe-inline';
             script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BitWorkbench</title>

  <style>
    /* ─── Reset & Base ─────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
      --font-ui: var(--vscode-font-family);

      --bg:        var(--vscode-sideBar-background, #1e1e1e);
      --bg-panel:  var(--vscode-editor-background, #252526);
      --bg-input:  var(--vscode-input-background, #3c3c3c);
      --bg-hover:  var(--vscode-list-hoverBackground, #2a2d2e);
      --border:    var(--vscode-panel-border, #333);
      --accent:    var(--vscode-focusBorder, #007acc);
      --accent2:   #4ec9b0;
      --accent3:   #ce9178;
      --accent4:   #dcdcaa;

      --text:      var(--vscode-foreground, #cccccc);
      --text-dim:  var(--vscode-descriptionForeground, #858585);
      --text-err:  var(--vscode-errorForeground, #f48771);
      --text-ok:   #4ec9b0;

      --radius: 4px;
      --gap: 8px;
    }

    /* ─── Number formatting ─────────────────────────────────── */
    .num-prefix {
      color: var(--num-prefix-color, var(--text-dim));
      opacity: 1;
    }
    .num-value {
      color: inherit;
    }

    .result-table .value.hex .num-prefix,
    .calc-result-row .r-value.hex .num-prefix,
    .sign-card.unsigned .card-value .num-prefix {
      --num-prefix-color: var(--text-dim);
    }

    .result-table .value.bin .num-prefix,
    .calc-result-row .r-value.bin .num-prefix {
      --num-prefix-color: var(--text-dim);
    }

    .result-table .value.oct .num-prefix,
    .calc-result-row .r-value.oct .num-prefix {
      --num-prefix-color: var(--text-dim);
    }

    .result-table .value.dec .num-prefix,
    .calc-result-row .r-value.dec .num-prefix,
    .sign-card.signed .card-value .num-prefix {
      --num-prefix-color: var(--text-dim);
    }

    @supports (color: color-mix(in srgb, red 50%, blue 50%)) {
      .result-table .value.hex .num-prefix,
      .calc-result-row .r-value.hex .num-prefix,
      .sign-card.unsigned .card-value .num-prefix {
        --num-prefix-color: color-mix(in srgb, var(--accent2) 72%, var(--text) 28%);
      }

      .result-table .value.bin .num-prefix,
      .calc-result-row .r-value.bin .num-prefix {
        --num-prefix-color: color-mix(in srgb, var(--accent4) 72%, var(--text) 28%);
      }

      .result-table .value.oct .num-prefix,
      .calc-result-row .r-value.oct .num-prefix {
        --num-prefix-color: color-mix(in srgb, #9cdcfe 72%, var(--text) 28%);
      }

      .result-table .value.dec .num-prefix,
      .calc-result-row .r-value.dec .num-prefix,
      .sign-card.signed .card-value .num-prefix {
        --num-prefix-color: color-mix(in srgb, var(--text) 72%, var(--bg) 15%);
      }
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-ui);
      font-size: 12px;
      line-height: 1.5;
      overflow-x: hidden;
      padding-bottom: 24px;
    }

    /* ─── Copy button (self-contained, Shoelace-style) ─── */
    .copy-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: none;
      border: 1px solid transparent;
      border-radius: 4px;
      color: var(--text-dim);
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s, color 0.15s, border-color 0.15s, background 0.15s;
      flex-shrink: 0;
      position: relative;
    }
    .copy-btn svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .copy-btn:hover { color: var(--accent2); border-color: var(--border); background: var(--bg-hover); }
    .copy-btn.copied { color: #4ec9b0; border-color: #4ec9b0; }
    .copy-btn .copy-tooltip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: #1a1a1a;
      color: #eee;
      font-size: 10px;
      font-family: var(--font-ui);
      padding: 3px 7px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.1s;
      z-index: 999;
      border: 1px solid #444;
    }
    .copy-btn:hover .copy-tooltip { opacity: 1; }
    .copy-btn.copied .copy-tooltip { opacity: 1; }

    .result-table tr:hover .copy-btn,
    .sign-card:hover .copy-btn,
    .calc-result-row:hover .copy-btn,
    .all-sizes-table tr:hover .copy-btn,
    .binary-visual:hover .copy-btn,
    .calc-result .expr:hover .copy-btn,
    .fp-visual:hover .copy-btn,
    .fp-info-table tr:hover .copy-btn,
    .fp-outputs tr:hover .copy-btn { opacity: 1; }

    /* ─── Section headers ──────────────────────────────── */
    .section {
      border-bottom: 1px solid var(--border);
      padding: 0 0 12px 0;
      margin-bottom: 4px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--text-dim);
      user-select: none;
      cursor: pointer;
    }

    .section-header .chevron {
      display: inline-block;
      transition: transform 0.15s;
      font-size: 9px;
      margin-left: auto;
    }

    .section-header.collapsed .chevron { transform: rotate(-90deg); }
    .section-content { padding: 0 12px; }
    .section-content.hidden { display: none; }

    /* ─── Input Row ─────────────────────────────────────── */
    .input-row {
      display: flex;
      gap: var(--gap);
      align-items: center;
      margin-bottom: 8px;
    }

    /*
     * ══════════════════════════════════════════════════════════
     * INPUT HISTORY WRAPPER
     * ══════════════════════════════════════════════════════════
     *
     * Every managed text input is wrapped in .hist-wrapper.
     * The wrapper is position:relative so the history nav
     * buttons (.hist-nav) can be absolutely positioned inside
     * the right edge of the input — mimicking the spinner
     * arrows of input[type="number"].
     *
     * Layout:
     *   ┌─────────────────────────────────┬──┐
     *   │  input[type="text"]             │▲ │
     *   │                                 │▼ │
     *   └─────────────────────────────────┴──┘
     *
     * The input gets right-padding equal to the nav button
     * width so text never slides under the buttons.
     */
    .hist-wrapper {
      position: relative;
      flex: 1;
      display: flex;
      align-items: stretch;
    }

    /* The text input inside a history wrapper */
    .hist-wrapper input[type="text"] {
      flex: 1;
      /* Reserve space on the right for the nav buttons.
         Adjust if you change the .hist-nav width. */
      padding-right: 20px;
      width: 100%;
    }

    /*
     * History navigation button strip.
     * Two stacked micro-buttons styled like input[type="number"] spinners.
     * Visibility is controlled by .has-history on the wrapper.
     */
    .hist-nav {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 18px;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border);
      border-radius: 0 var(--radius) var(--radius) 0;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.18s ease;
    }

    /* Show nav strip only when history entries exist */
    .hist-wrapper.has-history .hist-nav {
      opacity: 1;
      pointer-events: auto;
    }

    /* Dim when the input doesn't have focus */
    .hist-wrapper:not(:focus-within) .hist-nav {
      opacity: 0.45;
    }
    .hist-wrapper.has-history:focus-within .hist-nav {
      opacity: 1;
    }

    /* Individual up / down arrow button */
    .hist-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-input);
      border: none;
      color: var(--text-dim);
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: background 0.12s, color 0.12s;
      user-select: none;
      -webkit-user-select: none;
    }

    /* Separator line between up and down buttons */
    .hist-btn + .hist-btn {
      border-top: 1px solid var(--border);
    }

    .hist-btn:hover {
      background: var(--bg-hover);
      color: var(--accent2);
    }

    /* Active/pressed: brief accent flash + subtle scale */
    .hist-btn:active {
      background: var(--accent);
      color: #fff;
      transform: scale(0.92);
      transition: transform 0.06s, background 0.06s, color 0.06s;
    }

    /* Disabled: boundary reached in that direction */
    .hist-btn:disabled {
      opacity: 0.28;
      cursor: default;
    }
    .hist-btn:disabled:hover {
      background: var(--bg-input);
      color: var(--text-dim);
    }

    /* SVG triangle arrow inside each button */
    .hist-btn svg {
      width: 7px;
      height: 7px;
      fill: currentColor;
      stroke: none;
      pointer-events: none;
      display: block;
    }

    /*
     * Brief border-glow animation when a history entry loads.
     * Triggered by adding .hist-flash to the input element.
     */
    @keyframes hist-flash {
      0%   { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
      60%  { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
      100% { border-color: var(--border); box-shadow: none; }
    }

    .hist-flash {
      animation: hist-flash 0.35s ease forwards;
    }

    /* ─── End of history system styles ───────────────────── */

    input[type="text"] {
      flex: 1;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 13px;
      padding: 5px 8px;
      outline: none;
      transition: border-color 0.15s;
    }

    input[type="text"]:focus { border-color: var(--accent); }
    input[type="text"].error { border-color: var(--text-err); }

    .hint {
      color: var(--text-dim);
      font-size: 10px;
      margin-bottom: 8px;
      font-family: var(--font-mono);
    }

    .hint [data-tooltip] { cursor: help; }
    .hint .num-prefix { color: var(--accent2); }
    .hint .num-value { color: var(--text-dim); }
    .hint .msb { color: var(--accent2); }

    /* ─── ASCII hint box ────────────────────────────────── */
    .ascii-hint-box {
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--text-dim);
      background: rgba(206, 145, 120, 0.07);
      border: 1px solid rgba(206, 145, 120, 0.2);
      border-radius: var(--radius);
      padding: 5px 8px;
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .ascii-hint-box .ascii-char {
      color: var(--accent3);
      font-weight: 700;
    }

    .tooltip {
      position: fixed;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px);
      transition: opacity 150ms ease, transform 150ms ease;
      background: rgba(20, 20, 24, 0.94);
      color: #f5f5f5;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 10px;
      line-height: 1.4;
      max-width: 260px;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
      white-space: normal;
    }

    .tooltip.show { opacity: 1; transform: translateY(0); }

    /* ─── Error / overflow messages ─────────────────────── */
    .error-msg {
      color: var(--text-err);
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 4px 0;
      min-height: 16px;
    }

    .overflow-msg {
      color: #ffcc00;
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 4px 0;
      min-height: 16px;
    }

    .signed-overflow-msg {
      color: #4ec9b0;
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 4px 0;
      min-height: 16px;
    }

    /* ─── Result table ──────────────────────────────────── */
    .result-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .result-table td {
      padding: 3px 6px 3px 0;
      vertical-align: middle;
    }

    .result-table .label {
      color: var(--text-dim);
      white-space: nowrap;
      padding-right: 12px;
      width: 56px;
    }

    .result-table .value {
      color: var(--text);
      word-break: break-all;
      width: 100%;
    }

    .result-table .copy-cell {
      width: 24px;
      text-align: right;
    }

    .result-table .value.hex   { color: var(--accent2); }
    .result-table .value.bin   { color: var(--accent4); letter-spacing: 0.04em; }
    .result-table .value.oct   { color: #9cdcfe; }
    .result-table .value.dec   { color: var(--text); }
    .result-table .value.ascii { color: var(--accent3); }

    /* ─── Bit size selector ─────────────────────────────── */
    .bit-selector {
      display: flex;
      gap: 4px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }

    .bit-btn {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text-dim);
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 3px 8px;
      cursor: pointer;
      transition: all 0.12s;
      white-space: nowrap;
    }

    .bit-btn:hover { color: var(--text); border-color: var(--accent); }
    .bit-btn.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    /* ─── Signed / unsigned grid ────────────────────────── */
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 8px;
    }

    .sign-card {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 6px 8px;
      position: relative;
    }

    .sign-card .card-title {
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 4px;
    }

    .sign-card .card-value {
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
      word-break: break-all;
    }

    .sign-card .card-copy {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .sign-card.signed .card-value   { color: #f48771; }
    .sign-card.unsigned .card-value { color: var(--accent2); }

    /* ─── Binary visualizer ─────────────────────────────── */
    .binary-visual {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 10px;
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--accent4);
      letter-spacing: 0.08em;
      word-break: break-all;
      line-height: 1.8;
      margin-bottom: 8px;
      position: relative;
    }

    .binary-visual .bin-copy {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .binary-visual .bit-1 { color: #dcdcaa; font-weight: 700; }
    .binary-visual .bit-0 { color: #555; }
    .binary-visual .bit-sep { color: var(--border); margin: 0 3px; user-select: none; }

    /* ─── Calculator ────────────────────────────────────── */
    .calc-ops {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }

    .op-btn {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--accent4);
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 3px 7px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .op-btn:hover {
      border-color: var(--accent);
      color: var(--text);
    }

    .op-btn.active {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .calc-operands {
      display: flex;
      flex-wrap: wrap;
      gap: var(--gap);
      align-items: center;
      margin-bottom: 8px;
    }

    /* The hist-wrapper inside calc-operands takes the flex sizing role */
    .calc-operands .hist-wrapper {
      flex: 1 1 180px;
      min-width: 140px;
    }

    .calc-operands input {
      height: 28px;
      line-height: 18px;
      padding: 3px 8px;
      box-sizing: border-box;
    }

    .calc-operands label {
      font-size: 10px;
      color: var(--text-dim);
      font-family: var(--font-mono);
      white-space: nowrap;
      align-self: center;
      flex-shrink: 0;
    }

    @media (max-width: 520px) {
      .calc-operands {
        flex-direction: column;
        align-items: stretch;
      }

      .calc-operands label {
        align-self: flex-start;
      }

      .calc-operands .hist-wrapper {
        flex: none;
        width: 100%;
        min-width: 0;
      }
    }

    .calc-result {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 10px;
      font-family: var(--font-mono);
      font-size: 11px;
    }

    .calc-result .expr {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-dim);
      margin-bottom: 4px;
      font-size: 10px;
    }

    .calc-result .expr #calc-expr-text { flex: 1; }

    /* ─── Calculator result rows — values flush right ───── */
    .calc-result-row {
      display: flex;
      align-items: center;
      padding: 2px 0;
      gap: 4px;
    }

    .calc-result-row .r-label {
      color: var(--text-dim);
      white-space: nowrap;
      min-width: 52px;
    }

    .calc-result-row .r-value {
      flex: 1;
      text-align: right;
    }

    .calc-result-row .r-value.hex { color: var(--accent2); }
    .calc-result-row .r-value.dec { color: var(--text); }
    .calc-result-row .r-value.bin { color: var(--accent4); }
    .calc-result-row .r-value.oct { color: #9cdcfe; }

    .raw-caption {
      color: var(--text-dim);
      font-size: 10px;
      margin: 6px 0 10px;
      padding: 6px 8px;
      border-radius: var(--radius);
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
    }

    /* ─── Divider ───────────────────────────────────────── */
    hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 8px 0;
    }

    /* ─── Placeholder ───────────────────────────────────── */
    .placeholder {
      color: var(--text-dim);
      font-size: 11px;
      font-style: italic;
      padding: 8px 0;
    }

    /* ─── Scrollbar ─────────────────────────────────────── */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

    /* ─── All sizes table ───────────────────────────────── */
    .all-sizes-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 11px;
    }

    .all-sizes-table th {
      color: var(--text-dim);
      font-weight: 400;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 2px 6px 4px 0;
      text-align: left;
    }

    .all-sizes-table td {
      padding: 2px 6px 2px 0;
      border-top: 1px solid var(--border);
      vertical-align: middle;
    }

    .all-sizes-table .size-label { color: var(--text-dim); white-space: nowrap; }
    .all-sizes-table .u-val { color: var(--accent2); }
    .all-sizes-table .s-val { color: #f48771; }
    .all-sizes-table .copy-cell { width: 24px; }

    /* ─── Top-level tab system ──────────────────────────────── */
    .tab-bar {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tab-btn {
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-dim);
      font-family: var(--font-ui);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 7px 4px 5px;
      cursor: pointer;
      transition: color 0.12s, border-color 0.12s;
      white-space: nowrap;
    }

    .tab-btn:hover { color: var(--text); }

    .tab-btn.active {
      color: var(--text);
      border-bottom-color: var(--accent);
    }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* ─── IEEE-754 field colors ─────────────────────────────── */
    :root {
      --fp-sign:     #e06c75;
      --fp-exp:      #e5c07b;
      --fp-mantissa: #61afef;
    }

    /* ─── IEEE-754 bit visual ───────────────────────────────── */
    .fp-visual {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 8px 10px 10px;
      margin-bottom: 8px;
      position: relative;
      font-family: var(--font-mono);
    }

    .fp-visual .fp-bits-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1px;
      align-items: flex-start;
      line-height: 1;
      margin-bottom: 4px;
    }

    .fp-bit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 18px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 2px;
      cursor: default;
      user-select: none;
    }

    .fp-bit.sign-bit   { color: var(--fp-sign);     background: rgba(224,108,117,0.13); }
    .fp-bit.exp-bit    { color: var(--fp-exp);      background: rgba(229,192,123,0.10); }
    .fp-bit.mant-bit   { color: var(--fp-mantissa); background: rgba( 97,175,239,0.09); }
    .fp-bit.bit-zero   { opacity: 0.4; }
    .fp-bit.bit-one    { opacity: 1; }

    .fp-bit-sep {
      width: 5px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--border);
      font-size: 11px;
      height: 18px;
      user-select: none;
    }

    .fp-legend {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 5px;
    }

    .fp-legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-family: var(--font-mono);
      color: var(--text-dim);
    }

    .fp-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .fp-legend-dot.sign   { background: var(--fp-sign);     }
    .fp-legend-dot.exp    { background: var(--fp-exp);      }
    .fp-legend-dot.mant   { background: var(--fp-mantissa); }

    .fp-visual .bin-copy {
      position: absolute;
      top: 4px;
      right: 4px;
    }

    /* ─── IEEE-754 grouped label display ───────────────────── */
    .fp-groups {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 7px 10px;
      font-family: var(--font-mono);
      font-size: 12px;
      margin-bottom: 8px;
      word-break: break-all;
      letter-spacing: 0.04em;
    }

    .fp-groups .fp-g-sign { color: var(--fp-sign);     }
    .fp-groups .fp-g-exp  { color: var(--fp-exp);      }
    .fp-groups .fp-g-mant { color: var(--fp-mantissa); }
    .fp-groups .fp-g-sep  { color: var(--text-dim); margin: 0 5px; }

    /* ─── IEEE-754 info table ───────────────────────────────── */
    .fp-info-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 11px;
      margin-bottom: 8px;
    }

    .fp-info-table td {
      padding: 2px 6px 2px 0;
      vertical-align: middle;
    }

    .fp-info-table .label {
      color: var(--text-dim);
      white-space: nowrap;
      padding-right: 10px;
      width: 130px;
    }

    .fp-info-table .value { color: var(--text); word-break: break-all; }
    .fp-info-table .value.sign-val   { color: var(--fp-sign);     }
    .fp-info-table .value.exp-val    { color: var(--fp-exp);      }
    .fp-info-table .value.mant-val   { color: var(--fp-mantissa); }
    .fp-info-table .value.formula-val { color: var(--accent4); font-style: italic; }
    .fp-info-table .value.hex-val    { color: var(--accent2); }
    .fp-info-table .copy-cell        { width: 24px; }

    /* ─── IEEE-754 formula box ──────────────────────────────── */
    .fp-formula-box {
      background: var(--bg-panel);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 6px 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent4);
      margin-bottom: 8px;
      word-break: break-all;
    }

    .fp-formula-box .fp-formula-label {
      color: var(--text-dim);
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    /* ─── IEEE-754 special value badges ────────────────────── */
    .fp-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 8px;
    }

    .fp-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 10px;
      font-family: var(--font-mono);
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 10px;
      border: 1px solid;
      letter-spacing: 0.04em;
    }

    .fp-badge.badge-nan      { color: #e06c75; border-color: rgba(224,108,117,0.5); background: rgba(224,108,117,0.1); }
    .fp-badge.badge-inf      { color: #e5c07b; border-color: rgba(229,192,123,0.5); background: rgba(229,192,123,0.1); }
    .fp-badge.badge-neginf   { color: #e5c07b; border-color: rgba(229,192,123,0.5); background: rgba(229,192,123,0.1); }
    .fp-badge.badge-subnorm  { color: #9cdcfe; border-color: rgba(156,220,254,0.5); background: rgba(156,220,254,0.08); }
    .fp-badge.badge-negzero  { color: var(--text-dim); border-color: var(--border); background: rgba(255,255,255,0.03); }
    .fp-badge.badge-normal   { color: var(--text-ok);  border-color: rgba(78,201,176,0.5); background: rgba(78,201,176,0.07); }

    /* ─── IEEE-754 precision error ──────────────────────────── */
    .fp-precision-box {
      background: rgba(255,204,0,0.04);
      border: 1px solid rgba(255,204,0,0.2);
      border-radius: var(--radius);
      padding: 6px 10px;
      font-family: var(--font-mono);
      font-size: 11px;
      margin-bottom: 8px;
    }

    .fp-precision-box .fp-prec-label {
      color: var(--text-dim);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 3px;
    }

    .fp-precision-box .fp-prec-row {
      display: flex;
      gap: 6px;
      align-items: baseline;
      flex-wrap: wrap;
    }

    .fp-precision-box .fp-prec-key { color: var(--text-dim); }
    .fp-precision-box .fp-prec-input { color: var(--text); }
    .fp-precision-box .fp-prec-stored { color: #ffcc00; }
    .fp-precision-box .fp-prec-exact  { color: var(--text-ok); font-size: 10px; }

    /* ─── IEEE-754 presets ──────────────────────────────────── */
    .fp-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .fp-preset-btn {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--accent4);
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 3px 8px;
      cursor: pointer;
      transition: all 0.12s;
      white-space: nowrap;
    }

    .fp-preset-btn:hover { color: var(--text); border-color: var(--accent); }

    /* ─── IEEE-754 output rows ──────────────────────────────── */
    .fp-outputs {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono);
      font-size: 12px;
      margin-bottom: 8px;
    }

    .fp-outputs td {
      padding: 3px 6px 3px 0;
      vertical-align: middle;
    }

    .fp-outputs .label {
      color: var(--text-dim);
      white-space: nowrap;
      padding-right: 12px;
      width: 56px;
    }

    .fp-outputs .value { color: var(--text); word-break: break-all; width: 100%; }
    .fp-outputs .value.hex { color: var(--accent2); }
    .fp-outputs .value.bin { color: var(--accent4); letter-spacing: 0.04em; }
    .fp-outputs .copy-cell { width: 24px; text-align: right; }
  </style>
</head>
<body>
  <div class="tooltip" id="tooltip" aria-hidden="true"></div>

  <!-- ═══════════════════════════════════════════════════
       TOP-LEVEL TAB BAR
  ═══════════════════════════════════════════════════ -->
  <div class="tab-bar">
    <button type="button" class="tab-btn active" id="tab-int-btn">Integers</button>
    <button type="button" class="tab-btn" id="tab-fp-btn">IEEE-754</button>
  </div>

  <!-- ═══════════════════════════════════════════════════
       TAB PANEL: INTEGERS
  ═══════════════════════════════════════════════════ -->
  <div class="tab-panel active" id="tab-integers">
<div class="section" id="sec-converter">
  <div class="section-header" onclick="toggleSection('converter')">
    <span>&#x2B21;</span> Converter
    <span class="chevron">&#x25BE;</span>
  </div>
  <div class="section-content" id="conv-content">

    <div class="hint">
      Prefixes required: <span data-tooltip="Hexadecimal prefix."><span class="num-prefix">0x</span>FF</span> &middot; <span data-tooltip="Binary prefix."><span class="num-prefix">0b</span>1010</span> &middot; <span data-tooltip="Octal prefix."><span class="num-prefix">0o</span>77</span> &middot; <span data-tooltip="Decimal literal."><span class="num-prefix">255</span></span> &middot; negatives: <span data-tooltip="Negative hexadecimal value prefix."><span class="num-prefix">-0x</span>FF</span> or [<span class="msb" data-tooltip="Most Significant Bit. If 1, number is negative in two's complement.">MSB</span>]
    </div>

    <div class="input-row">
      <!--
        .hist-wrapper  : container that activates the history nav buttons.
        The .has-history class is added automatically by the history system
        once at least one entry exists — this reveals the nav buttons.
      -->
      <div class="hist-wrapper" id="hw-conv">
        <input type="text" id="conv-input"
               placeholder="0xFF, -0xFF, 0b1010, -0b1010, 255, -255 &hellip;"
               maxlength="256"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <!-- Spinner-style history navigation buttons -->
        <div class="hist-nav" role="group" aria-label="Input history navigation">
          <button type="button" class="hist-btn hist-up" id="hw-conv-up"
                  aria-label="Previous history entry (Up Arrow)"
                  title="Previous entry (&uarr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 0 L8 5 L0 5 Z"/></svg>
          </button>
          <button type="button" class="hist-btn hist-down" id="hw-conv-down"
                  aria-label="Next history entry (Down Arrow)"
                  title="Next entry (&darr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 5 L8 0 L0 0 Z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="error-msg" id="conv-error"></div>
    <div class="overflow-msg" id="conv-overflow" style="display:none"></div>
    <div class="signed-overflow-msg" id="conv-signed-overflow" style="display:none"></div>

    <!-- Bit size selector -->
    <div class="bit-selector" id="bit-selector">
      <button type="button" class="bit-btn" data-size="8">int8</button>
      <button type="button" class="bit-btn active" data-size="16">int16</button>
      <button type="button" class="bit-btn" data-size="32">int32</button>
      <button type="button" class="bit-btn" data-size="64">int64</button>
    </div>

    <!-- Binary visual (copy button injected dynamically) -->
    <div class="binary-visual" id="bin-visual" style="display:none"></div>
    <div class="raw-caption" id="raw-caption" style="display:none"></div>

    <!-- Main conversions -->
    <table class="result-table" id="conv-table" style="display:none">
      <tr>
        <td class="label">Input (signed)</td>
        <td class="value dec" id="r-dec"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="copy-dec" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Raw hex</td>
        <td class="value hex" id="r-hex"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="copy-hex" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Raw oct</td>
        <td class="value oct" id="r-oct"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="copy-oct" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">ASCII</td>
        <td class="value ascii" id="r-ascii"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="copy-ascii" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
    </table>

    <!-- ASCII hint box -->
    <div class="ascii-hint-box" id="ascii-hint" style="display:none"></div>

    <!-- Signed / unsigned cards -->
    <div class="sign-grid" id="sign-grid" style="display:none">
      <div class="sign-card unsigned">
        <div class="card-title">Unsigned interpretation</div>
        <div class="card-value" id="r-unsigned">&mdash;</div>
        <button type="button" class="copy-btn card-copy" id="copy-unsigned" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="sign-card signed">
        <div class="card-title">Signed interpretation</div>
        <div class="card-value" id="r-signed">&mdash;</div>
        <button type="button" class="copy-btn card-copy" id="copy-signed" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
    </div>

    <div class="placeholder" id="conv-placeholder">Enter a value above to begin conversion.</div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 2 — ALL SIZES
═══════════════════════════════════════════════════ -->
<div class="section" id="sec-sizes">
  <div class="section-header" onclick="toggleSection('sizes')">
    <span>&#x229E;</span> Signed / Unsigned (all sizes)
    <span class="chevron">&#x25BE;</span>
  </div>
  <div class="section-content" id="sizes-content">
    <div class="placeholder" id="sizes-placeholder">Enter a value in the Converter above.</div>
    <table class="all-sizes-table" id="sizes-table" style="display:none">
      <thead>
        <tr>
          <th>Width</th>
          <th>Unsigned</th>
          <th></th>
          <th>Signed</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="sizes-tbody"></tbody>
    </table>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     SECTION 3 — BITWISE CALCULATOR
═══════════════════════════════════════════════════ -->
<div class="section" id="sec-calc">
  <div class="section-header" onclick="toggleSection('calc')">
    <span>&#x2295;</span> Bitwise Calculator
    <span class="chevron">&#x25BE;</span>
  </div>
  <div class="section-content" id="calc-content">

    <div class="hint">
      Select an instruction &middot; enter operands &middot; result updates instantly
    </div>

    <!-- Op buttons -->
    <div class="calc-ops">
      <button type="button" class="op-btn" data-op="ADD">ADD</button>
      <button type="button" class="op-btn" data-op="SUB">SUB</button>
      <button type="button" class="op-btn" data-op="MUL">MUL</button>
      <button type="button" class="op-btn" data-op="DIV">DIV</button>
      <button type="button" class="op-btn" data-op="MOD">MOD</button>
      <button type="button" class="op-btn" data-op="AND">AND</button>
      <button type="button" class="op-btn" data-op="OR">OR</button>
      <button type="button" class="op-btn" data-op="XOR">XOR</button>
      <button type="button" class="op-btn" data-op="NOT">NOT</button>
      <button type="button" class="op-btn" data-op="SHL">SHL</button>
      <button type="button" class="op-btn" data-op="SHR">SHR</button>
    </div>

    <!-- Operand inputs — each wrapped for independent history -->
    <div class="calc-operands">
      <label id="lbl-a">A:</label>
      <div class="hist-wrapper" id="hw-calc-a">
        <input type="text" id="calc-a" placeholder="0xFF" maxlength="256"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <div class="hist-nav" role="group" aria-label="Input history navigation">
          <button type="button" class="hist-btn hist-up" id="hw-calc-a-up"
                  aria-label="Previous history entry (Up Arrow)" title="Previous entry (&uarr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 0 L8 5 L0 5 Z"/></svg>
          </button>
          <button type="button" class="hist-btn hist-down" id="hw-calc-a-down"
                  aria-label="Next history entry (Down Arrow)" title="Next entry (&darr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 5 L8 0 L0 0 Z"/></svg>
          </button>
        </div>
      </div>
      <label id="lbl-b">B:</label>
      <div class="hist-wrapper" id="hw-calc-b">
        <input type="text" id="calc-b" placeholder="0x0F" maxlength="256"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <div class="hist-nav" role="group" aria-label="Input history navigation">
          <button type="button" class="hist-btn hist-up" id="hw-calc-b-up"
                  aria-label="Previous history entry (Up Arrow)" title="Previous entry (&uarr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 0 L8 5 L0 5 Z"/></svg>
          </button>
          <button type="button" class="hist-btn hist-down" id="hw-calc-b-down"
                  aria-label="Next history entry (Down Arrow)" title="Next entry (&darr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 5 L8 0 L0 0 Z"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="error-msg" id="calc-error"></div>

    <!-- Result -->
    <div class="calc-result" id="calc-result" style="display:none">
      <div class="expr" id="calc-expr">
        <span id="calc-expr-text"></span>
        <button type="button" class="copy-btn" id="copy-expr" onclick="doCopy(this)" data-label="Copy expression"><span class="copy-tooltip">Copy expression</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="calc-result-row">
        <span class="r-label">HEX</span>
        <span class="r-value hex" id="cr-hex"></span>
        <button type="button" class="copy-btn" id="copy-cr-hex" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="calc-result-row">
        <span class="r-label">DEC</span>
        <span class="r-value dec" id="cr-dec"></span>
        <button type="button" class="copy-btn" id="copy-cr-dec" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="calc-result-row">
        <span class="r-label">BIN</span>
        <span class="r-value bin" id="cr-bin"></span>
        <button type="button" class="copy-btn" id="copy-cr-bin" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="calc-result-row">
        <span class="r-label">OCT</span>
        <span class="r-value oct" id="cr-oct"></span>
        <button type="button" class="copy-btn" id="copy-cr-oct" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <hr>
      <div class="calc-result-row">
        <span class="r-label">Unsigned (sel)</span>
        <span class="r-value hex" id="cr-u"></span>
        <button type="button" class="copy-btn" id="copy-cr-u" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="calc-result-row">
        <span class="r-label">Signed (sel)</span>
        <span class="r-value" style="color:#f48771" id="cr-s"></span>
        <button type="button" class="copy-btn" id="copy-cr-s" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
    </div>

    <div class="placeholder" id="calc-placeholder">Select an operation and enter operands.</div>
  </div>
</div>

  </div><!-- /#tab-integers -->

  <!-- ═══════════════════════════════════════════════════
       TAB PANEL: IEEE-754
  ═══════════════════════════════════════════════════ -->
  <div class="tab-panel" id="tab-ieee754">

<!-- ─── SECTION: IEEE-754 Visualizer ─────────────────────────── -->
<div class="section" id="sec-fp-vis">
  <div class="section-header" onclick="toggleFpSection('vis')">
    <span>&#x2B21;</span> Visualizer
    <span class="chevron">&#x25BE;</span>
  </div>
  <div class="section-content" id="fp-vis-content">

    <div class="hint">Decimal input only &middot; e.g. <span style="color:var(--accent4)">3.14159</span> &middot; <span style="color:var(--accent4)">-1.5</span> &middot; <span style="color:var(--accent4)">1e-10</span></div>

    <!-- Precision selector (mirrors bit-selector style) -->
    <div class="bit-selector" id="fp-precision-selector">
      <button type="button" class="bit-btn active" data-prec="32">float32</button>
      <button type="button" class="bit-btn"        data-prec="64">float64</button>
    </div>

    <!-- Input row -->
    <div class="input-row">
      <div class="hist-wrapper" id="hw-fp">
        <input type="text" id="fp-input"
               placeholder="3.14159265358979, -1.5, 1e-10, NaN, Infinity &hellip;"
               maxlength="64"
               autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
        <div class="hist-nav" role="group" aria-label="Input history navigation">
          <button type="button" class="hist-btn hist-up" id="hw-fp-up"
                  aria-label="Previous history entry (Up Arrow)" title="Previous entry (&uarr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 0 L8 5 L0 5 Z"/></svg>
          </button>
          <button type="button" class="hist-btn hist-down" id="hw-fp-down"
                  aria-label="Next history entry (Down Arrow)" title="Next entry (&darr;)">
            <svg viewBox="0 0 8 5" aria-hidden="true"><path d="M4 5 L8 0 L0 0 Z"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="error-msg" id="fp-error"></div>

    <!-- Presets -->
    <div class="fp-presets" id="fp-presets">
      <button type="button" class="fp-preset-btn" data-val="3.141592653589793"  title="Pi">&#x3C0;</button>
      <button type="button" class="fp-preset-btn" data-val="2.718281828459045"  title="Euler's number">e</button>
      <button type="button" class="fp-preset-btn" data-val="0.1"               title="0.1 (classic precision demo)">0.1</button>
      <button type="button" class="fp-preset-btn" data-val="0.3333333333333333" title="1/3">1/3</button>
      <button type="button" class="fp-preset-btn" data-val="__MAX__"           title="Maximum finite value">MAX</button>
      <button type="button" class="fp-preset-btn" data-val="__MIN__"           title="Minimum positive normal value">MIN</button>
      <button type="button" class="fp-preset-btn" data-val="__EPS__"           title="Machine epsilon">&#x3B5;</button>
      <button type="button" class="fp-preset-btn" data-val="Infinity"          title="+Infinity">+INF</button>
      <button type="button" class="fp-preset-btn" data-val="-Infinity"         title="-Infinity">-INF</button>
      <button type="button" class="fp-preset-btn" data-val="NaN"               title="Not a Number">NaN</button>
    </div>

    <!-- Placeholder -->
    <div class="placeholder" id="fp-placeholder">Enter a decimal value above to begin visualization.</div>

    <!-- Special value badges -->
    <div class="fp-badges" id="fp-badges" style="display:none"></div>

    <!-- Bit visual -->
    <div class="fp-visual" id="fp-visual" style="display:none">
      <div class="fp-bits-row" id="fp-bits-row"></div>
      <div class="fp-legend">
        <div class="fp-legend-item"><div class="fp-legend-dot sign"></div>Sign (1 bit)</div>
        <div class="fp-legend-item" id="fp-leg-exp"><div class="fp-legend-dot exp"></div>Exponent</div>
        <div class="fp-legend-item" id="fp-leg-mant"><div class="fp-legend-dot mant"></div>Mantissa</div>
      </div>
      <button type="button" class="copy-btn bin-copy" id="fp-bin-copy" onclick="doCopy(this)" data-label="Copy binary"><span class="copy-tooltip">Copy binary</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
    </div>

    <!-- Grouped display: sign exponent mantissa -->
    <div class="fp-groups" id="fp-groups" style="display:none"></div>

    <!-- Formula box -->
    <div class="fp-formula-box" id="fp-formula-box" style="display:none">
      <div class="fp-formula-label">Formula</div>
      <div id="fp-formula-text"></div>
    </div>

    <!-- Info table -->
    <table class="fp-info-table" id="fp-info-table" style="display:none">
      <tr>
        <td class="label">Sign</td>
        <td class="value sign-val" id="fp-i-sign"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-c-sign" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Stored exponent</td>
        <td class="value exp-val" id="fp-i-exp-stored"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-c-exp-stored" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Bias</td>
        <td class="value exp-val" id="fp-i-bias"></td>
        <td class="copy-cell"></td>
      </tr>
      <tr>
        <td class="label">Actual exponent</td>
        <td class="value exp-val" id="fp-i-exp-actual"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-c-exp-actual" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Mantissa (hex)</td>
        <td class="value mant-val" id="fp-i-mant"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-c-mant" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
    </table>

    <!-- Outputs: decimal / hex / binary -->
    <table class="fp-outputs" id="fp-outputs" style="display:none">
      <tr>
        <td class="label">Decimal</td>
        <td class="value" id="fp-o-dec"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-co-dec" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Hex</td>
        <td class="value hex" id="fp-o-hex"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-co-hex" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
      <tr>
        <td class="label">Binary</td>
        <td class="value bin" id="fp-o-bin"></td>
        <td class="copy-cell"><button type="button" class="copy-btn" id="fp-co-bin" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></td>
      </tr>
    </table>

    <!-- Precision error box -->
    <div class="fp-precision-box" id="fp-precision-box" style="display:none">
      <div class="fp-prec-label">Precision</div>
      <div class="fp-prec-row">
        <span class="fp-prec-key">Input:</span>
        <span class="fp-prec-input" id="fp-prec-input"></span>
      </div>
      <div class="fp-prec-row" id="fp-prec-stored-row">
        <span class="fp-prec-key">Stored:</span>
        <span class="fp-prec-stored" id="fp-prec-stored"></span>
        <span class="fp-prec-exact" id="fp-prec-exact"></span>
      </div>
    </div>

  </div>
</div>

  </div><!-- /#tab-ieee754 -->

<script nonce="${nonce}">
  // ─── State ──────────────────────────────────────────────────────────────────
  const vscode = acquireVsCodeApi();

  // ══════════════════════════════════════════════════════════════════════════════
  //  INPUT HISTORY SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════
  //
  //  Architecture
  //  ─────────────
  //  Each text input is paired with a .hist-wrapper <div> that holds:
  //   • the <input> itself
  //   • a .hist-nav strip with two micro-buttons (▲ up / ▼ down)
  //
  //  Per-input state lives in historyStores (a Map keyed by wrapper id):
  //   { entries: string[], cursor: number|null, draft: string }
  //
  //   entries  — chronological array; index 0 = oldest, last = most recent
  //   cursor   — null  = live-draft mode (user is typing freely)
  //              N     = currently previewing history[N]
  //   draft    — snapshot of the input value taken when the user first
  //              pressed ArrowUp; restored when ArrowDown passes the newest entry
  //
  //  ┌──────────────────────────────────────────────────────────────────────┐
  //  │  QUICK CONFIGURATION GUIDE                                            │
  //  │                                                                        │
  //  │  History limit          →  HISTORY_MAX_SIZE constant (below)           │
  //  │  Navigation at edges    →  HISTORY_LOOP_NAVIGATION constant (below)    │
  //  │  Persistent storage     →  see "Session persistence" note below        │
  //  └──────────────────────────────────────────────────────────────────────┘

  // ─── Configuration constants ─────────────────────────────────────────────────

  /**
   * HISTORY_MAX_SIZE
   * Maximum number of entries kept per input.
   * When the store reaches this limit the OLDEST entry is evicted.
   *
   * ↓ Change this number to raise or lower the limit globally. ↓
   */
  const HISTORY_MAX_SIZE = 500;

  /**
   * HISTORY_LOOP_NAVIGATION
   * false (default) → navigation stops cleanly at boundaries:
   *     ArrowUp  at the oldest entry  → no-op (button disabled)
   *     ArrowDown at the live draft   → no-op (button disabled)
   * true           → navigation loops:
   *     ArrowUp  at the oldest entry  → jumps to the most recent entry
   *     ArrowDown at the live draft   → jumps to the oldest entry
   *
   * ↓ Set to true to enable looping. ↓
   */
  const HISTORY_LOOP_NAVIGATION = false;

  // ─── Internal store ───────────────────────────────────────────────────────────

  /**
   * historyStores  — Map<wrapperId, StoreObject>
   *
   * Session-only. The Map is recreated on every webview reload.
   *
   * To persist history across VSCode sessions:
   *   1. On every historyPush call, serialise the stores:
   *        vscode.setState({ histories: serializeStores() });
   *   2. On page load, restore them:
   *        const saved = vscode.getState();
   *        if (saved && saved.histories) deserializeStores(saved.histories);
   *   3. Call syncHistoryButtons() for each wrapper after restoring.
   */
  const historyStores = new Map();

  /**
   * Returns (or lazily creates) the history store for a wrapper id.
   *
   * Store shape:
   *   entries    — string[]     immutable during navigation; append-only via historyPush
   *   cursor     — number|null  null = live-draft; N = entries[N] is displayed
   *   draft      — string       saved live-input value while browsing history
   *   navigating — boolean      true while any history entry is shown; suppresses
   *                             auto-save side-effects triggered by blur / input events
   */
  function getStore(id) {
    if (!historyStores.has(id)) {
      historyStores.set(id, { entries: [], cursor: null, draft: '', navigating: false });
    }
    return historyStores.get(id);
  }

  // ─── Core operations ──────────────────────────────────────────────────────────

  /**
   * historyPush — commit a value to a history store.
   *
   * Silently rejected when:
   *  • value is empty or whitespace-only
   *  • value equals the most-recent entry (no consecutive duplicates)
   *  • store.navigating is true (user is browsing history — never save a
   *    historical entry back into history as if it were new input)
   *
   * Oldest entry is auto-evicted when HISTORY_MAX_SIZE is exceeded.
   * Resets the cursor to null (live-draft mode) after every push.
   *
   * @param {string} wrapperId  - key matching the .hist-wrapper element id
   * @param {string} value      - the raw input string to store
   */
  function historyPush(wrapperId, value) {
    const trimmed = value.trim();
    if (!trimmed) return;

    const store = getStore(wrapperId);

    // Never push while navigating — the displayed value is a historical entry,
    // not new user input, so saving it would corrupt the history array.
    if (store.navigating) return;

    const last  = store.entries[store.entries.length - 1];
    if (last === trimmed) return;   // skip consecutive duplicate

    // Append to the end of the array (chronological order: oldest → newest).
    // The entries array is NEVER mutated during navigation — only push() and
    // shift() (for size capping) touch it, and only from this function.
    store.entries.push(trimmed);

    // ── Enforce HISTORY_MAX_SIZE ─────────────────────────────────────────
    // Eviction policy: remove oldest entry when cap is exceeded.
    // To evict newest instead, replace shift() with pop().
    if (store.entries.length > HISTORY_MAX_SIZE) {
      store.entries.shift();
    }

    // After a push we always return to live-draft mode:
    //   cursor = null  → "no history entry selected; user is at the live input"
    //   navigating     → false (push only happens when not navigating anyway)
    store.cursor    = null;
    store.navigating = false;
    store.draft      = '';

    syncHistoryButtons(wrapperId);
  }

  /**
   * historyNavigate — move the history cursor for an input without mutating history.
   *
   * ── Cursor semantics ────────────────────────────────────────────────────────
   *
   *   store.entries  = ['cmd1', 'cmd2', 'cmd3']   (oldest → newest, indices 0…N-1)
   *   store.cursor   = null   → live-draft mode; user is typing freely
   *                  = 0      → showing entries[0], the oldest item
   *                  = N-1    → showing entries[N-1], the most-recent item
   *   store.draft    = the input value that was live when navigation began;
   *                    restored when the user navigates back past the newest entry
   *   store.navigating = true while any history entry is displayed;
   *                    used to suppress auto-save side-effects (blur, input event)
   *
   * ── Navigation flow ─────────────────────────────────────────────────────────
   *
   *   ArrowUp (dir='up') moves BACKWARD through time (toward older entries):
   *     • cursor === null  → save draft; jump to newest entry  (cursor = N-1)
   *     • cursor > 0       → cursor--  (go one step older)
   *     • cursor === 0     → boundary; no-op (or loop if HISTORY_LOOP_NAVIGATION)
   *
   *   ArrowDown (dir='down') moves FORWARD through time (toward newer entries):
   *     • cursor === null  → already at live draft; no-op
   *     • cursor < N-1     → cursor++  (go one step newer)
   *     • cursor === N-1   → past newest; restore draft, cursor = null
   *
   * The entries array is NEVER written to during navigation.
   *
   * @param {string}           wrapperId
   * @param {'up'|'down'}      dir
   * @param {HTMLInputElement} input      — the actual text input element
   */
  function historyNavigate(wrapperId, dir, input) {
    const store = getStore(wrapperId);
    const len   = store.entries.length;
    if (!len) return;   // nothing to navigate

    if (dir === 'up') {
      if (store.cursor === null) {
        // ── First ArrowUp from live-draft mode ──────────────────────────
        // Save whatever the user has typed so we can restore it on the
        // way back down.  Then jump straight to the newest history entry.
        store.draft      = input.value;
        store.navigating = true;
        store.cursor     = len - 1;   // index of the most-recent entry
      } else if (store.cursor > 0) {
        // ── Move one step further into the past ─────────────────────────
        store.cursor--;
      } else {
        // ── Already at the oldest entry (cursor === 0) ──────────────────
        if (HISTORY_LOOP_NAVIGATION) {
          store.cursor = len - 1;     // wrap around to the newest entry
        } else {
          return;                     // hard stop — do not change anything
        }
      }
    } else {
      // ── dir === 'down': moving toward newer entries / live draft ────────

      if (store.cursor === null) {
        // Already in live-draft mode; nothing to do.
        return;
      }

      if (store.cursor < len - 1) {
        // ── Move one step toward the present ───────────────────────────
        store.cursor++;
      } else {
        // ── cursor === len - 1: we were on the newest entry.
        // One more ArrowDown exits history and restores the saved draft.
        store.cursor     = null;
        store.navigating = false;
        input.value      = store.draft;
        triggerInputEvent(input);
        syncHistoryButtons(wrapperId);
        flashInput(input);
        return;   // early return — no history entry to display
      }
    }

    // ── Apply the entry at the new cursor position to the input ──────────
    // We do NOT mutate store.entries here — read-only access only.
    input.value = store.entries[store.cursor];   // store.cursor is never null here
    triggerInputEvent(input);
    syncHistoryButtons(wrapperId);
    flashInput(input);
  }

  // ─── DOM helpers ─────────────────────────────────────────────────────────────

  /**
   * syncHistoryButtons — update button disabled states and .has-history class.
   * Called after every push or navigation step.
   *
   * .has-history on the wrapper controls CSS visibility of the nav strip.
   * Button disabled state prevents navigating past the boundary when
   * HISTORY_LOOP_NAVIGATION is false.
   */
  function syncHistoryButtons(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const store = getStore(wrapperId);
    const len   = store.entries.length;

    // Show nav strip only when history has at least one entry
    wrapper.classList.toggle('has-history', len > 0);

    const upBtn   = wrapper.querySelector('.hist-up');
    const downBtn = wrapper.querySelector('.hist-down');
    if (!upBtn || !downBtn) return;

    if (len === 0) {
      upBtn.disabled   = true;
      downBtn.disabled = true;
      return;
    }

    if (HISTORY_LOOP_NAVIGATION) {
      // With looping, both buttons are always active when history exists.
      upBtn.disabled   = false;
      downBtn.disabled = false;
    } else {
      // Without looping, disable at the relevant boundary.
      //
      // ▲ (up/older): disabled when we're already at the oldest entry (cursor === 0).
      // ▼ (down/newer): disabled when we're in live-draft mode (cursor === null),
      //   i.e. there is no older entry currently displayed to navigate away from.
      upBtn.disabled   = store.cursor === 0;
      downBtn.disabled = store.cursor === null;   // null = live draft = nothing newer to go to
    }
  }

  /**
   * triggerInputEvent — dispatch a synthetic 'input' event so existing
   * application listeners (updateConverter, runCalc, …) react to
   * history navigation exactly as they react to user typing.
   *
   * Note: the 'input' listener in initInputHistory guards against this
   * event causing side-effects during navigation by checking store.navigating.
   */
  function triggerInputEvent(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * flashInput — brief border-glow animation that confirms a history
   * entry was loaded. Uses a CSS @keyframes animation on the input.
   */
  function flashInput(input) {
    input.classList.remove('hist-flash');
    void input.offsetWidth;   // force reflow so re-adding restarts the animation
    input.classList.add('hist-flash');
    input.addEventListener('animationend', () => {
      input.classList.remove('hist-flash');
    }, { once: true });
  }

  // ─── Registration ─────────────────────────────────────────────────────────────

  // ─── Automatic history registration (debounced) ───────────────────────────────

  /**
   * Debounce timers per input to avoid flooding history with rapid updates.
   * Key = inputId, Value = timeoutId
   */
  const debounceTimers = {};

  /**
   * isValidHistoryValue — determine if a value should be saved to history.
   *
   * Rejects:
   *  • Empty or whitespace-only strings
   *  • Incomplete placeholders: "-", ".", "0x", "0b", "0o"
   *  • Single leading prefix without digits
   *
   * Accepts:
   *  • Valid numeric literals: "0xFF", "-0x42", "0b1010", "255", etc.
   *  • Only values that parseInput() would accept as valid
   *
   * @param {string} value - the raw input string to validate
   * @returns {boolean}
   */
  function isValidHistoryValue(value) {
    const trimmed = value.trim();

    // Reject empty or whitespace-only
    if (!trimmed) return false;

    // Reject bare incomplete prefixes and common placeholders
    if (/^-?0[xXbBoO]?$/.test(trimmed)) return false;
    if (/^-?\.?$/.test(trimmed)) return false;

    // Accept IEEE-754 special tokens and decimal floats (for fp input)
    if (/^[+-]?Infinity$/.test(trimmed) || trimmed === 'NaN') return true;
    if (/^-?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?$/.test(trimmed)) return true;

    // Validate using existing parseInput logic
    const parsed = parseInput(trimmed);
    return parsed.valid;
  }

  /**
   * scheduleHistoryAutoSave — debounced automatic history registration.
   *
   * Call this on 'input' events to schedule a history save.
   * If called multiple times rapidly (within DEBOUNCE_DELAY),
   * only the latest value is saved after user stops typing.
   *
   * Conditions for save:
   *  • Debounce timer expires (user stopped typing for ~600ms)
   *  • Value is valid per isValidHistoryValue()
   *  • Value differs from most-recent history entry
   *
   * This prevents flooding history with incomplete/invalid values
   * like intermediate keystrokes or placeholders.
   *
   * @param {string} inputId    - id of the input element
   * @param {string} wrapperId  - id of the .hist-wrapper element
   * @param {string} value      - the current input value
   */
  function scheduleHistoryAutoSave(inputId, wrapperId, value) {
    // Clear any pending debounce for this input
    if (debounceTimers[inputId]) {
      clearTimeout(debounceTimers[inputId]);
    }

    // Schedule a new save after DEBOUNCE_DELAY milliseconds
    const DEBOUNCE_DELAY = 700;   // User stopped typing for 700ms

    debounceTimers[inputId] = setTimeout(() => {
      if (isValidHistoryValue(value)) {
        historyPush(wrapperId, value);
      }
      delete debounceTimers[inputId];
    }, DEBOUNCE_DELAY);
  }

  /**
   * forceHistorySave — save a value immediately without debouncing.
   *
   * Use this when:
   *  • Input loses focus (blur event)
   *  • Conversion completes successfully
   *  • User switches to another field
   *
   * Cancels any pending debounced save and pushes immediately if valid.
   *
   * @param {string} inputId    - id of the input element
   * @param {string} wrapperId  - id of the .hist-wrapper element
   * @param {string} value      - the current input value
   */
  function forceHistorySave(inputId, wrapperId, value) {
    // Cancel pending debounce
    if (debounceTimers[inputId]) {
      clearTimeout(debounceTimers[inputId]);
      delete debounceTimers[inputId];
    }

    // Save immediately if valid
    if (isValidHistoryValue(value)) {
      historyPush(wrapperId, value);
    }
  }

  /**
   * initInputHistory — wire up all history behaviour for one input.
   *
   * This is the single function to call when adding a new input to the
   * history system. Pass the wrapper id and the input id inside it.
   *
   * Automatic history registration:
   *   • On 'input' event (user typing): schedules debounced auto-save
   *   • On 'blur' event (field loses focus): forces immediate save if valid
   *
   * Keyboard behaviour wired here:
   *   ArrowUp   → historyNavigate 'up'   (preventDefault to stop cursor jump)
   *   ArrowDown → historyNavigate 'down' (preventDefault to stop cursor jump)
   *
   * Any other key typed while navigating history resets the cursor to null
   * so the next ArrowUp starts fresh from the most-recent entry.
   *
   * Mouse/touch: the ▲ and ▼ buttons call historyNavigate directly and
   * return focus to the input so keyboard navigation stays seamless.
   *
   * @param {string} wrapperId  - id of the .hist-wrapper element
   * @param {string} inputId    - id of the input[type="text"] inside it
   */
  function initInputHistory(wrapperId, inputId) {
    const wrapper = document.getElementById(wrapperId);
    const input   = document.getElementById(inputId);
    if (!wrapper || !input) return;

    // ── Automatic debounced history registration ───────────────────────────
    input.addEventListener('input', function() {
      const store = getStore(wrapperId);

      // ── CRITICAL: suppress all history side-effects during navigation ────
      //
      // When historyNavigate() sets input.value and calls triggerInputEvent(),
      // it fires this 'input' listener.  We must not treat that synthetic event
      // as new user input — doing so would (a) reset the cursor back to null,
      // (b) overwrite store.draft with a historical value, and (c) schedule an
      // auto-save that would corrupt the entries array.
      //
      // store.navigating is set to true the moment navigation begins (first
      // ArrowUp from live-draft mode) and cleared when the user returns to
      // live-draft mode (ArrowDown past the newest entry) or starts typing.
      if (store.navigating) return;

      // User is genuinely typing — schedule a debounced save.
      scheduleHistoryAutoSave(inputId, wrapperId, input.value);
    });

    // ── Save on blur ────────────────────────────────────────────────────────
    //
    // CRITICAL: if the user blurs while navigating (e.g. clicks a button),
    // we must NOT save the currently-displayed historical entry back into
    // history — that would corrupt the entries array and cause entries to
    // multiply / overwrite each other.
    input.addEventListener('blur', function() {
      const store = getStore(wrapperId);
      if (store.navigating) return;   // browsing history — do not save
      forceHistorySave(inputId, wrapperId, input.value);
    });

    // ── Keyboard history navigation ─────────────────────────────────────────
    input.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowUp') {
        // preventDefault stops the text cursor jumping to position 0 in inputs.
        e.preventDefault();
        historyNavigate(wrapperId, 'up', input);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        historyNavigate(wrapperId, 'down', input);
        return;
      }

      // ── Any other key while navigating → exit navigation mode ───────────
      //
      // The user started editing while a historical entry was displayed.
      // Treat the current input value as the new live draft and reset cursor.
      // We do NOT save to history here — the debounced auto-save will handle
      // that once the user stops typing.
      const store = getStore(wrapperId);
      if (store.navigating) {
        store.navigating = false;
        store.cursor     = null;
        // Keep store.draft as-is; the user is now diverging from history.
        syncHistoryButtons(wrapperId);
      }
    });

    // ── Mouse / touch buttons for history navigation ───────────────────────
    const upBtn   = wrapper.querySelector('.hist-up');
    const downBtn = wrapper.querySelector('.hist-down');

    if (upBtn) {
      upBtn.addEventListener('click', function() {
        historyNavigate(wrapperId, 'up', input);
        input.focus();   // keep focus on the input after a button click
      });
    }
    if (downBtn) {
      downBtn.addEventListener('click', function() {
        historyNavigate(wrapperId, 'down', input);
        input.focus();
      });
    }

    // Initialise button state (both disabled; no entries yet)
    syncHistoryButtons(wrapperId);
  }

  // ── Register all managed inputs ────────────────────────────────────────────
  //
  // To add history to a new input:
  //   1. Wrap it in  <div class="hist-wrapper" id="hw-myinput"> … </div>
  //   2. Add the nav strip HTML inside the wrapper (copy from existing)
  //   3. Call:  initInputHistory('hw-myinput', 'myinput-id');
  //
  initInputHistory('hw-conv',   'conv-input');
  initInputHistory('hw-calc-a', 'calc-a');
  initInputHistory('hw-calc-b', 'calc-b');
  initInputHistory('hw-fp', 'fp-input');

  // ══════════════════════════════════════════════════════════════════════════════
  //  END OF INPUT HISTORY SYSTEM
  // ══════════════════════════════════════════════════════════════════════════════

  // ─── Copy button handler ─────────────────────────────────────────────────────

  const COPY_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>';

  function showSuccess(btn) {
    btn.classList.add('copied');
    btn.innerHTML = '<span class="copy-tooltip">Copied!</span>' + CHECK_SVG;
    setTimeout(() => {
      btn.classList.remove('copied');
      const label = btn.dataset.label || 'Copy';
      btn.innerHTML = '<span class="copy-tooltip">' + label + '</span>' + COPY_SVG;
    }, 1500);
  }

  function doCopy(btn) {
    const text = btn.dataset.value || '';
    if (!text) return;

    // Try all three methods — whichever works first wins
    // 1. Extension host message (most reliable in VSCode webviews)
    vscode.postMessage({ type: 'copy', value: text, id: btn.id });

    // 2. Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showSuccess(btn)).catch(() => fallbackCopy(text, () => showSuccess(btn)));
    } else {
      // 3. execCommand fallback
      fallbackCopy(text, () => showSuccess(btn));
    }
  }

  function fallbackCopy(text, onSuccess) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      const ok = document.execCommand('copy');
      if (ok && onSuccess) onSuccess();
    } catch(e) {}
    document.body.removeChild(ta);
  }

  function setCopy(id, text) {
    const el = document.getElementById(id);
    if (el) el.dataset.value = String(text);
  }

  let currentBitSize = 16;
  let currentOp = null;

  // ─── Utility: BigInt math ────────────────────────────────────────────────────

  function parseInput(raw) {
    const s = raw.trim();
    if (!s) return { valid: false, error: 'Empty input' };
    const negative = s.startsWith('-');
    const unsigned = negative ? s.slice(1) : s;
    try {
      let value;
      if (/^0[xX][0-9a-fA-F]+$/.test(unsigned)) {
        value = BigInt('0x' + unsigned.slice(2));
      } else if (/^0[bB][01]+$/.test(unsigned)) {
        value = BigInt('0b' + unsigned.slice(2));
      } else if (/^0[oO][0-7]+$/.test(unsigned)) {
        value = BigInt('0o' + unsigned.slice(2));
      } else if (/^[0-9]+$/.test(unsigned)) {
        value = BigInt(unsigned);
      } else {
        return { valid: false, error: 'Use prefix: 0x hex \xB7 0b binary \xB7 0o octal \xB7 digits decimal \xB7 prefix negatives with - before the prefix' };
      }
      return { valid: true, value: negative ? -value : value };
    } catch (e) {
      return { valid: false, error: 'Value out of range or malformed.' };
    }
  }

  function maskUnsigned(value, bits) {
    const mask = (1n << BigInt(bits)) - 1n;
    const mod = value % (1n << BigInt(bits));
    return ((mod + (1n << BigInt(bits))) & mask);
  }

  function toSigned(u, bits) {
    const signBit = 1n << BigInt(bits - 1);
    return u >= signBit ? u - (1n << BigInt(bits)) : u;
  }

  function groupBinary(binStr) {
    const padded = binStr.padStart(Math.ceil(binStr.length / 4) * 4, '0');
    const nibbles = [];
    for (let i = 0; i < padded.length; i += 4) {
      nibbles.push(padded.slice(i, i + 4));
    }
    const bytes = [];
    for (let i = 0; i < nibbles.length; i += 2) {
      if (i + 1 < nibbles.length) bytes.push(nibbles[i] + ' ' + nibbles[i + 1]);
      else bytes.push(nibbles[i]);
    }
    return bytes.join('  ');
  }

  function renderBinary(binStr) {
    const byteGroups = binStr.split('  ');
    return byteGroups.map((byteStr, byteIdx) => {
      const nibbles = byteStr.split(' ');
      const renderedByte = nibbles.map(nibble =>
        nibble.split('').map(ch =>
          ch === '1' ? '<span class="bit-1">1</span>' : '<span class="bit-0">0</span>'
        ).join('')
      ).join(' ');
      return byteIdx < byteGroups.length - 1
        ? renderedByte + '<span class="bit-sep"> \u2502 </span>'
        : renderedByte;
    }).join('');
  }

  const ASCII_LABELS = {
    0:'NUL',1:'SOH',2:'STX',3:'ETX',4:'EOT',5:'ENQ',6:'ACK',7:'BEL',
    8:'BS',9:'HT',10:'LF',11:'VT',12:'FF',13:'CR',14:'SO',15:'SI',
    16:'DLE',17:'DC1',18:'DC2',19:'DC3',20:'DC4',21:'NAK',22:'SYN',23:'ETB',
    24:'CAN',25:'EM',26:'SUB',27:'ESC',28:'FS',29:'GS',30:'RS',31:'US',
    127:'DEL'
  };

  const ASCII_DESCRIPTIONS = {
    0:  'NUL \u2014 Null. String terminator in C/C++.',
    1:  'SOH \u2014 Start of Heading.',
    2:  'STX \u2014 Start of Text.',
    3:  'ETX \u2014 End of Text. Ctrl+C in many terminals.',
    4:  'EOT \u2014 End of Transmission. Ctrl+D (EOF on Unix).',
    5:  'ENQ \u2014 Enquiry.',
    6:  'ACK \u2014 Acknowledge.',
    7:  'BEL \u2014 Bell. Triggers an audible alert \\\\a in C).',
    8:  'BS \u2014 Backspace \\\\b in C).',
    9:  'HT \u2014 Horizontal Tab \\\\t in C).',
    10: 'LF \u2014 Line Feed. Unix/Linux newline character \\\\n in C).',
    11: 'VT \u2014 Vertical Tab \\\\v in C).',
    12: 'FF \u2014 Form Feed. Advances to next page \\\\f in C).',
    13: 'CR \u2014 Carriage Return \\\\r in C). Windows lines end with CR+LF.',
    14: 'SO \u2014 Shift Out.',
    15: 'SI \u2014 Shift In.',
    16: 'DLE \u2014 Data Link Escape.',
    17: 'DC1 \u2014 Device Control 1 (XON \u2014 resume transmission).',
    18: 'DC2 \u2014 Device Control 2.',
    19: 'DC3 \u2014 Device Control 3 (XOFF \u2014 pause transmission).',
    20: 'DC4 \u2014 Device Control 4.',
    21: 'NAK \u2014 Negative Acknowledge.',
    22: 'SYN \u2014 Synchronous Idle.',
    23: 'ETB \u2014 End of Transmission Block.',
    24: 'CAN \u2014 Cancel.',
    25: 'EM \u2014 End of Medium.',
    26: 'SUB \u2014 Substitute. Ctrl+Z (EOF on Windows).',
    27: 'ESC \u2014 Escape. Starts ANSI escape sequences in terminals.',
    28: 'FS \u2014 File Separator.',
    29: 'GS \u2014 Group Separator.',
    30: 'RS \u2014 Record Separator.',
    31: 'US \u2014 Unit Separator.',
    32: 'SP \u2014 Space. Printable whitespace (0x20).',
    127:'DEL \u2014 Delete. Non-printable control character.'
  };

  function getAscii(v) {
    const n = Number(v);
    if (v < 0n || v > 127n) return 'N/A';
    if (ASCII_LABELS[n]) return '<' + ASCII_LABELS[n] + '>';
    return "'" + String.fromCharCode(n) + "'";
  }

  function updateAsciiHint(v) {
    const hintEl = document.getElementById('ascii-hint');
    const n = Number(v);
    let text = '';
    if (ASCII_DESCRIPTIONS[n]) {
      text = ASCII_DESCRIPTIONS[n];
    } else if (n >= 33 && n <= 126) {
      text = "'" + String.fromCharCode(n) + "' \u2014 Printable ASCII character, code " + n + " (" + formatNumber("0x" + n.toString(16).toUpperCase()) + ").";
    } else {
      text = "N/A - Not Applicable - value out of range (0 to 127).";
    }
    hintEl.innerHTML = text;
    hintEl.style.display = 'block';
  }

  // ─── Number formatting ──────────────────────────────────────────────────────

  function formatNumber(str) {
    if (!str) return str;
    let prefix = '';
    let value = str;
    if (str.startsWith('-')) {
      prefix = '-';
      value = str.slice(1);
    }
    if (value.startsWith('0x')) {
      prefix += '0x';
      value = value.slice(2);
    } else if (value.startsWith('0b')) {
      prefix += '0b';
      value = value.slice(2);
    } else if (value.startsWith('0o')) {
      prefix += '0o';
      value = value.slice(2);
    }
    if (prefix) {
      return '<span class="num-prefix">' + prefix + '</span><span class="num-value">' + value + '</span>';
    } else {
      return str;
    }
  }

  // ─── Converter ──────────────────────────────────────────────────────────────

  function updateConverter(raw) {
    const errEl = document.getElementById('conv-error');
    const input = document.getElementById('conv-input');

    if (!raw.trim()) {
      clearConvResult();
      errEl.textContent = '';
      input.classList.remove('error');
      return;
    }

    const parsed = parseInput(raw);
    if (!parsed.valid) {
      errEl.textContent = parsed.error;
      input.classList.add('error');
      clearConvResult();
      return;
    }

    errEl.textContent = '';
    input.classList.remove('error');

    const v        = parsed.value;
    const unsigned = maskUnsigned(v, currentBitSize);
    const signed   = toSigned(unsigned, currentBitSize);

    const rawBin    = unsigned.toString(2);
    const nibblePad = Math.max(Math.ceil(rawBin.length / 4) * 4, currentBitSize);
    const grouped   = groupBinary(rawBin.padStart(nibblePad, '0'));

    const binVisual = document.getElementById('bin-visual');
    binVisual.innerHTML =
      renderBinary(grouped) +
      '<button type="button" class="copy-btn bin-copy" id="bin-copy" onclick="doCopy(this)" data-label="Copy binary">' +
      '<span class="copy-tooltip">Copy binary</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
      '</button>';
    binVisual.style.display = 'block';
    setCopy('bin-copy', '0b' + rawBin.padStart(nibblePad, '0'));

    const rawHex = unsigned.toString(16).toUpperCase();
    const hexPad = Math.max(Math.ceil(rawHex.length / 2) * 2, currentBitSize / 4);
    const hexStr = '0x' + rawHex.padStart(hexPad, '0');
    const octStr = '0o' + unsigned.toString(8);
    const ascStr = getAscii(unsigned);
    const decStr = v.toString(10);
    const uStr   = unsigned.toString(10);
    const sStr   = signed.toString(10);

    document.getElementById('r-dec').innerHTML     = formatNumber(decStr);
    document.getElementById('r-hex').innerHTML     = formatNumber(hexStr);
    document.getElementById('r-oct').innerHTML     = formatNumber(octStr);
    document.getElementById('r-ascii').textContent   = ascStr;
    document.getElementById('r-unsigned').innerHTML = formatNumber(uStr);
    document.getElementById('r-signed').innerHTML   = formatNumber(sStr);

    setCopy('copy-dec',      decStr);
    setCopy('copy-hex',      hexStr);
    setCopy('copy-oct',      octStr);
    setCopy('copy-ascii',    ascStr);
    setCopy('copy-unsigned', uStr);
    setCopy('copy-signed',   sStr);

    updateAsciiHint(unsigned);

    const overflowEl       = document.getElementById('conv-overflow');
    const signedOverflowEl = document.getElementById('conv-signed-overflow');
    const maxUnsigned = (1n << BigInt(currentBitSize)) - 1n;
    const maxSigned   = (1n << BigInt(currentBitSize - 1)) - 1n;
    const minSigned   = -(1n << BigInt(currentBitSize - 1));
    const isTruncated = v > maxUnsigned || v < minSigned;

    if (isTruncated) {
      overflowEl.textContent = 'Value exceeds int' + currentBitSize + ' storage width. Higher bits were truncated.';
      overflowEl.style.display = 'block';
      signedOverflowEl.style.display = 'none';
    } else if (v >= 0n && unsigned > maxSigned) {
      signedOverflowEl.innerHTML = 'Value exceeds signed int' + currentBitSize + ' range (' + formatNumber(minSigned.toString()) + ' to ' + formatNumber(maxSigned.toString()) + '). Signed interpretation differs from unsigned.';
      signedOverflowEl.style.display = 'block';
      overflowEl.style.display = 'none';
    } else {
      overflowEl.style.display = 'none';
      signedOverflowEl.style.display = 'none';
    }

    document.getElementById('raw-caption').textContent =
      "Two's complement representation for int" + currentBitSize + " (stored raw value)";
    document.getElementById('raw-caption').style.display = 'block';

    document.getElementById('conv-table').style.display = 'table';
    document.getElementById('sign-grid').style.display  = 'grid';
    document.getElementById('conv-placeholder').style.display = 'none';

    updateSizesTable(v);
  }

  function clearConvResult() {
    document.getElementById('bin-visual').style.display          = 'none';
    document.getElementById('conv-table').style.display          = 'none';
    document.getElementById('sign-grid').style.display           = 'none';
    document.getElementById('raw-caption').style.display         = 'none';
    document.getElementById('conv-overflow').style.display       = 'none';
    document.getElementById('conv-signed-overflow').style.display = 'none';
    document.getElementById('conv-placeholder').style.display    = 'block';
    document.getElementById('ascii-hint').style.display          = 'none';
    document.getElementById('sizes-table').style.display         = 'none';
    document.getElementById('sizes-placeholder').style.display   = 'block';
  }

  function setBitSize(size) {
    currentBitSize = size;
    document.querySelectorAll('#bit-selector .bit-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
    });
    const raw = document.getElementById('conv-input').value || '';
    updateConverter(raw);
    runCalc();
  }

  const convInput = document.getElementById('conv-input');
  if (convInput) {
    convInput.addEventListener('input', () => updateConverter(convInput.value));
  }

  // ─── Tooltip ────────────────────────────────────────────────────────────────

  const tooltip = document.getElementById('tooltip');
  let tooltipTimer = null;

  function positionTooltip(x, y) {
    if (!tooltip) return;
    const margin = 8;
    tooltip.style.left = '0px';
    tooltip.style.top  = '0px';
    const rect = tooltip.getBoundingClientRect();
    let left = x + 12;
    let top  = y + 18;
    if (left + rect.width  > window.innerWidth  - margin) left = window.innerWidth  - rect.width  - margin;
    if (top  + rect.height > window.innerHeight - margin) top  = y - rect.height - 10;
    if (top < margin) top = margin;
    tooltip.style.left = left + 'px';
    tooltip.style.top  = top  + 'px';
  }

  function showTooltip(event) {
    if (!tooltip) return;
    const text = event.currentTarget.dataset.tooltip;
    if (!text) return;
    tooltipTimer = setTimeout(() => {
      tooltip.textContent = text;
      tooltip.classList.add('show');
      positionTooltip(event.clientX, event.clientY);
    }, 150);
  }

  function hideTooltip() {
    if (!tooltip) return;
    if (tooltipTimer) { clearTimeout(tooltipTimer); tooltipTimer = null; }
    tooltip.classList.remove('show');
    tooltip.style.left = '-9999px';
    tooltip.style.top  = '-9999px';
  }

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mousemove', event => {
      if (tooltip && tooltip.classList.contains('show')) positionTooltip(event.clientX, event.clientY);
    });
    el.addEventListener('mouseleave', hideTooltip);
  });

  // ─── All Sizes Table ─────────────────────────────────────────────────────────

  function updateSizesTable(v) {
    const sizes = [8, 16, 32, 64];
    const tbody = document.getElementById('sizes-tbody');
    tbody.innerHTML = '';
    for (const sz of sizes) {
      const u    = maskUnsigned(v, sz);
      const s    = toSigned(u, sz);
      const uStr = u.toString(10);
      const sStr = s.toString(10);
      const tr   = document.createElement('tr');
      const CBTN = (val) => '<button type="button" class="copy-btn" onclick="doCopy(this)" data-label="Copy" data-value="' + val + '"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>';
      tr.innerHTML =
        '<td class="size-label">int' + sz + '</td>' +
        '<td class="u-val">' + formatNumber(uStr) + '</td>' +
        '<td class="copy-cell">' + CBTN(uStr) + '</td>' +
        '<td class="s-val">' + formatNumber(sStr) + '</td>' +
        '<td class="copy-cell">' + CBTN(sStr) + '</td>';
      tbody.appendChild(tr);
    }
    document.getElementById('sizes-table').style.display       = 'table';
    document.getElementById('sizes-placeholder').style.display = 'none';
  }

  // ─── Calculator ──────────────────────────────────────────────────────────────

  function selectOp(op) {
    currentOp = op;
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });
    // Hide/show the B wrapper (NOT operation only needs one operand)
    const bWrap = document.getElementById('hw-calc-b');
    const lblB  = document.getElementById('lbl-b');
    if (op === 'NOT') {
      bWrap.style.display = 'none';
      lblB.style.display  = 'none';
    } else {
      bWrap.style.display = '';
      lblB.style.display  = '';
    }
    runCalc();
  }

  function evaluateOp(op, a, b) {
    switch (op) {
      case 'ADD': return a + b;
      case 'SUB': return a - b;
      case 'MUL': return a * b;
      case 'DIV': if (b === 0n) throw new Error('Division by zero'); return a / b;
      case 'MOD': if (b === 0n) throw new Error('Modulo by zero');   return a % b;
      case 'AND': return a & b;
      case 'OR':  return a | b;
      case 'XOR': return a ^ b;
      case 'NOT': return ~a;
      case 'SHL': {
        const shift = Number(b);
        if (!Number.isInteger(shift) || shift < 0) throw new Error('Invalid shift count');
        return a << BigInt(shift);
      }
      case 'SHR': {
        const shift = Number(b);
        if (!Number.isInteger(shift) || shift < 0) throw new Error('Invalid shift count');
        return a >> BigInt(shift);
      }
      default: throw new Error('Unknown op: ' + op);
    }
  }

  function inputNibbleWidth(raw) {
    const s = raw.trim();
    if (/^0[xX]([0-9a-fA-F]+)$/.test(s)) {
      const digits = s.replace(/^0[xX]/, '').length;
      return Math.ceil(digits / 2) * 2 * 4;
    }
    if (/^0[bB]([01]+)$/.test(s)) {
      const bits = s.replace(/^0[bB]/, '').length;
      return Math.ceil(bits / 4) * 4;
    }
    if (/^0[oO]([0-7]+)$/.test(s)) {
      const val = BigInt(s.replace(/^0[oO]/, '0o'));
      const bits = val === 0n ? 1 : val.toString(2).length;
      return Math.ceil(bits / 4) * 4;
    }
    const p = parseInput(s);
    if (!p.valid) return 4;
    const bits = p.value <= 0n ? 4 : p.value.toString(2).length;
    return Math.ceil(bits / 4) * 4;
  }

  function runCalc() {
    const errEl = document.getElementById('calc-error');
    const resEl = document.getElementById('calc-result');
    const phEl  = document.getElementById('calc-placeholder');

    if (!currentOp) {
      errEl.textContent = '';
      resEl.style.display = 'none';
      phEl.style.display  = 'block';
      return;
    }

    const aRaw = document.getElementById('calc-a').value;
    const bRaw = document.getElementById('calc-b').value;

    const pA = parseInput(aRaw);
    if (!pA.valid && aRaw.trim()) {
      errEl.textContent = 'A: ' + pA.error;
      resEl.style.display = 'none';
      phEl.style.display  = 'block';
      return;
    }

    if (currentOp !== 'NOT') {
      const pB = parseInput(bRaw);
      if (!pB.valid && bRaw.trim()) {
        errEl.textContent = 'B: ' + pB.error;
        resEl.style.display = 'none';
        phEl.style.display  = 'block';
        return;
      }
      if (!pA.valid || !pB.valid) {
        errEl.textContent = '';
        resEl.style.display = 'none';
        phEl.style.display  = 'block';
        return;
      }
      try {
        const result      = evaluateOp(currentOp, pA.value, pB.value);
        const displayBits = Math.max(inputNibbleWidth(aRaw), inputNibbleWidth(bRaw));
        showCalcResult(result, currentOp + ' ' + aRaw + ' ' + bRaw, displayBits);
        errEl.textContent = '';
      } catch(e) {
        errEl.textContent = e.message;
        resEl.style.display = 'none';
        phEl.style.display  = 'block';
      }
    } else {
      if (!pA.valid) {
        errEl.textContent = '';
        resEl.style.display = 'none';
        phEl.style.display  = 'block';
        return;
      }
      try {
        const result = evaluateOp('NOT', pA.value, 0n);
        showCalcResult(result, 'NOT ' + aRaw, inputNibbleWidth(aRaw));
        errEl.textContent = '';
      } catch(e) {
        errEl.textContent = e.message;
        resEl.style.display = 'none';
        phEl.style.display  = 'block';
      }
    }
  }

  function showCalcResult(result, expr, displayBits) {
    const unsigned = maskUnsigned(result, currentBitSize);
    const signed   = toSigned(unsigned, currentBitSize);

    const rawBin    = unsigned.toString(2);
    const nibblePad = Math.max(Math.ceil(rawBin.length / 4) * 4, displayBits);
    const grouped   = groupBinary(rawBin.padStart(nibblePad, '0'));

    const rawHex = unsigned.toString(16).toUpperCase();
    const hexPad = Math.max(Math.ceil(rawHex.length / 2) * 2, displayBits / 4);
    const hexStr = '0x' + rawHex.padStart(hexPad, '0');
    const decStr = unsigned.toString(10);
    const octStr = '0o' + unsigned.toString(8);
    const uStr   = unsigned.toString(10);
    const sStr   = signed.toString(10);

    document.getElementById('calc-expr-text').textContent = '\u25B6 ' + expr;
    document.getElementById('cr-hex').innerHTML = formatNumber(hexStr);
    document.getElementById('cr-dec').innerHTML = formatNumber(decStr);
    document.getElementById('cr-bin').innerHTML = '<span class="num-value">' + grouped + '</span>';
    document.getElementById('cr-oct').innerHTML = formatNumber(octStr);
    document.getElementById('cr-u').innerHTML   = formatNumber(uStr);
    document.getElementById('cr-s').innerHTML   = formatNumber(sStr);

    setCopy('copy-expr',   expr);
    setCopy('copy-cr-hex', hexStr);
    setCopy('copy-cr-dec', decStr);
    setCopy('copy-cr-bin', '0b' + rawBin.padStart(nibblePad, '0'));
    setCopy('copy-cr-oct', octStr);
    setCopy('copy-cr-u',   uStr);
    setCopy('copy-cr-s',   sStr);

    document.getElementById('calc-result').style.display      = 'block';
    document.getElementById('calc-placeholder').style.display = 'none';
  }

  // ─── Event listeners ────────────────────────────────────────────────────────

  const calcA = document.getElementById('calc-a');
  const calcB = document.getElementById('calc-b');
  if (calcA) {
    calcA.addEventListener('input', runCalc);
    // Note: Enter on calc-a is handled by initInputHistory (push) above;
    // this separate handler ensures runCalc fires too.
    calcA.addEventListener('keydown', e => { if (e.key === 'Enter') runCalc(); });
  }
  if (calcB) {
    calcB.addEventListener('input', runCalc);
    calcB.addEventListener('keydown', e => { if (e.key === 'Enter') runCalc(); });
  }

  document.body.addEventListener('click', event => {
    const btn = event.target.closest && event.target.closest('button.copy-btn');
    if (btn) doCopy(btn);
  });

  document.querySelectorAll('#bit-selector .bit-btn').forEach(btn => {
    btn.addEventListener('click', () => setBitSize(Number(btn.dataset.size)));
  });

  document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => selectOp(btn.dataset.op));
  });

  // ─── Section toggle ──────────────────────────────────────────────────────────

  const sectionState = { converter: true, sizes: true, calc: true };

  function toggleSection(name) {
    sectionState[name] = !sectionState[name];
    const content = document.getElementById(
      name === 'converter' ? 'conv-content' :
      name === 'sizes'     ? 'sizes-content' : 'calc-content'
    );
    const header = content.previousElementSibling;
    if (sectionState[name]) {
      content.classList.remove('hidden');
      header.classList.remove('collapsed');
    } else {
      content.classList.add('hidden');
      header.classList.add('collapsed');
    }
  }
  window.toggleSection = toggleSection;

  // ─── Messages from extension host ───────────────────────────────────────────

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'setInput') {
      // ── Auto-switch to the correct top-level tab ──────────────────────────
      // 'float' values go to the IEEE-754 tab; everything else (integers,
      // hex, binary, octal) stays on the Integers tab.
      if (msg.valueType === 'float') {
        switchTab('ieee754');
        const fpInput = document.getElementById('fp-input');
        if (fpInput) {
          fpInput.value = msg.value;
          if (typeof updateFpVisualizer === 'function') { updateFpVisualizer(msg.value); }
        }
        if (typeof fpSectionState !== 'undefined' && !fpSectionState.vis) {
          toggleFpSection('vis');
        }
      } else {
        switchTab('integers');
        const input = document.getElementById('conv-input');
        input.value = msg.value;
        updateConverter(msg.value);
        if (!sectionState.converter) { toggleSection('converter'); }
      }
      // Push externally-set values into history too (e.g. values sent from
      // the editor via right-click → "Analyse Selected Value")
      historyPush('hw-conv', msg.value);
    } else if (msg.type === 'copyDone') {
      const btn = document.getElementById(msg.id);
      if (btn) showSuccess(btn);
    }
  });

  // Default to ADD on load
  selectOp('ADD');

  // ─── Tab switching ───────────────────────────────────────────────────────────

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    if (name === 'integers') {
      document.getElementById('tab-int-btn').classList.add('active');
      document.getElementById('tab-integers').classList.add('active');
    } else {
      document.getElementById('tab-fp-btn').classList.add('active');
      document.getElementById('tab-ieee754').classList.add('active');
    }
  }
  window.switchTab = switchTab;

  // ══════════════════════════════════════════════════════════════════════════════
  //  IEEE-754 VISUALIZER
  // ══════════════════════════════════════════════════════════════════════════════

  let currentFpPrec = 32;   // 32 or 64

  // ─── FP section toggle (mirrors integer section toggle) ─────────────────────

  const fpSectionState = { vis: true };

  function toggleFpSection(name) {
    fpSectionState[name] = !fpSectionState[name];
    const content = document.getElementById('fp-' + name + '-content');
    const header = content.previousElementSibling;
    if (fpSectionState[name]) {
      content.classList.remove('hidden');
      header.classList.remove('collapsed');
    } else {
      content.classList.add('hidden');
      header.classList.add('collapsed');
    }
  }
  window.toggleFpSection = toggleFpSection;

  // ─── Precision selector ─────────────────────────────────────────────────────

  document.querySelectorAll('#fp-precision-selector .bit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFpPrec = Number(btn.dataset.prec);
      document.querySelectorAll('#fp-precision-selector .bit-btn').forEach(b =>
        b.classList.toggle('active', b === btn));
      updateFpLegend();
      const raw = document.getElementById('fp-input').value;
      if (raw.trim()) updateFpVisualizer(raw);
    });
  });

  function updateFpLegend() {
    const expBits  = currentFpPrec === 32 ? 8 : 11;
    const mantBits = currentFpPrec === 32 ? 23 : 52;
    const legExp  = document.getElementById('fp-leg-exp');
    const legMant = document.getElementById('fp-leg-mant');
    if (legExp) {
      const txt = legExp.querySelector(':not(div)') || legExp.lastChild;
      if (txt && txt.nodeType === Node.TEXT_NODE) txt.textContent = 'Exponent (' + expBits + ' bits)';
      else legExp.innerHTML = legExp.innerHTML.replace(/Exponent.*/, 'Exponent (' + expBits + ' bits)');
    }
    if (legMant) {
      const txt = legMant.querySelector(':not(div)') || legMant.lastChild;
      if (txt && txt.nodeType === Node.TEXT_NODE) txt.textContent = 'Mantissa (' + mantBits + ' bits)';
      else legMant.innerHTML = legMant.innerHTML.replace(/Mantissa.*/, 'Mantissa (' + mantBits + ' bits)');
    }
  }

  // ─── Preset buttons ─────────────────────────────────────────────────────────

  document.querySelectorAll('.fp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      let val = btn.dataset.val;
      // Resolve dynamic presets based on current precision
      if (val === '__MAX__') {
        val = currentFpPrec === 32 ? '3.4028234663852886e+38' : '1.7976931348623157e+308';
      } else if (val === '__MIN__') {
        val = currentFpPrec === 32 ? '1.1754943508222875e-38' : '2.2250738585072014e-308';
      } else if (val === '__EPS__') {
        val = currentFpPrec === 32 ? '1.1920928955078125e-7' : '2.220446049250313e-16';
      }
      const input = document.getElementById('fp-input');
      input.value = val;
      updateFpVisualizer(val);
      historyPush('hw-fp', val);
    });
  });

  // ─── Float → raw bits ───────────────────────────────────────────────────────

  function floatToRawBits32(f) {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = f;
    return new Uint32Array(buf)[0];
  }

  function floatToRawBits64(f) {
    const buf = new ArrayBuffer(8);
    new Float64Array(buf)[0] = f;
    const lo = new Uint32Array(buf)[0];
    const hi = new Uint32Array(buf)[1];
    // Return as BigInt for consistent bit manipulation
    return (BigInt(hi) << 32n) | BigInt(lo >>> 0);
  }

  // ─── Parse float input ──────────────────────────────────────────────────────

  function parseFpInput(raw) {
    const s = raw.trim();
    if (!s) return { valid: false, error: 'Empty input' };
    // Accept NaN, Infinity, -Infinity as special tokens
    if (s === 'NaN' || s === 'nan') return { valid: true, value: NaN };
    if (s === 'Infinity' || s === '+Infinity' || s === 'inf' || s === '+inf')
      return { valid: true, value: Infinity };
    if (s === '-Infinity' || s === '-inf')
      return { valid: true, value: -Infinity };
    // Decimal only: allow sign, digits, dot, e/E notation
    if (!/^-?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?$/.test(s)) {
      return { valid: false, error: 'Decimal input only — no 0x/0b/0o prefixes supported for floating-point' };
    }
    const v = parseFloat(s);
    if (isNaN(v) && s !== 'NaN') return { valid: false, error: 'Malformed decimal value' };
    return { valid: true, value: v };
  }

  // ─── Analyse float value ─────────────────────────────────────────────────────

  function analyseFp(value, prec) {
    const is32 = prec === 32;
    const expBits  = is32 ? 8  : 11;
    const mantBits = is32 ? 23 : 52;
    const bias     = is32 ? 127 : 1023;
    const totalBits = prec;

    let rawBits, sign, expStored, mantRaw;

    if (is32) {
      const raw = floatToRawBits32(Math.fround(value));
      rawBits    = BigInt(raw >>> 0);
      sign       = Number((rawBits >> BigInt(31)) & 1n);
      expStored  = Number((rawBits >> BigInt(mantBits)) & ((1n << BigInt(expBits)) - 1n));
      mantRaw    = rawBits & ((1n << BigInt(mantBits)) - 1n);
    } else {
      rawBits    = floatToRawBits64(value);
      sign       = Number((rawBits >> BigInt(63)) & 1n);
      expStored  = Number((rawBits >> BigInt(mantBits)) & ((1n << BigInt(expBits)) - 1n));
      mantRaw    = rawBits & ((1n << BigInt(mantBits)) - 1n);
    }

    const maxExp = (1 << expBits) - 1;  // all-ones exponent

    // Classify
    let classification;
    if (expStored === maxExp) {
      classification = mantRaw === 0n ? (sign ? 'neginf' : 'inf') : 'nan';
    } else if (expStored === 0) {
      classification = mantRaw === 0n ? (sign ? 'negzero' : 'zero') : 'subnormal';
    } else {
      classification = 'normal';
    }

    const expActual = expStored - bias;

    // Full bit string (MSB first)
    const bitStr = rawBits.toString(2).padStart(totalBits, '0');

    // Hex
    const hexDigits = totalBits / 4;
    const hexStr    = '0x' + rawBits.toString(16).toUpperCase().padStart(hexDigits, '0');

    // Stored float for precision comparison
    const storedValue = is32 ? Math.fround(value) : value;

    return {
      prec, is32, expBits, mantBits, bias, totalBits,
      sign, expStored, expActual, mantRaw, rawBits,
      classification, bitStr, hexStr, storedValue
    };
  }

  // ─── Build formula string ────────────────────────────────────────────────────

  function buildFormula(a, inputValue) {
    const { classification, sign, expStored, expActual, mantRaw, mantBits, bias, is32 } = a;

    if (classification === 'nan') {
      return '(-1)^' + sign + ' \u00D7 NaN  \u2014  not-a-number encoding';
    }
    if (classification === 'inf' || classification === 'neginf') {
      return '(-1)^' + sign + ' \u00D7 \u221E  \u2014  exponent all-1s, mantissa=0';
    }
    if (classification === 'negzero' || classification === 'zero') {
      return '(-1)^' + sign + ' \u00D7 0  \u2014  exponent=0, mantissa=0';
    }
    if (classification === 'subnormal') {
      const mantHex = '0x' + mantRaw.toString(16).toUpperCase().padStart(Math.ceil(mantBits / 4), '0');
      return '(-1)^' + sign + ' \u00D7 0.' + mantHex + ' \u00D7 2^(1\u2212' + bias + ')  \u2014  subnormal (implicit leading bit = 0)';
    }
    // Normal
    const mantHex = '0x' + mantRaw.toString(16).toUpperCase().padStart(Math.ceil(mantBits / 4), '0');
    return '(-1)^' + sign + ' \u00D7 1.' + mantHex + ' \u00D7 2^(' + expStored + '\u2212' + bias + ') = (-1)^' + sign + ' \u00D7 1.mantissa \u00D7 2^' + expActual;
  }

  // ─── Render bit visual ────────────────────────────────────────────────────────

  function renderFpBits(a) {
    const { bitStr, expBits, mantBits } = a;
    const row = document.getElementById('fp-bits-row');
    row.innerHTML = '';

    // sign bit
    const addBit = (ch, cls) => {
      const el = document.createElement('span');
      el.className = 'fp-bit ' + cls + (ch === '1' ? ' bit-one' : ' bit-zero');
      el.textContent = ch;
      row.appendChild(el);
    };
    const addSep = () => {
      const s = document.createElement('span');
      s.className = 'fp-bit-sep';
      s.textContent = '|';
      row.appendChild(s);
    };

    addBit(bitStr[0], 'sign-bit');
    addSep();
    for (let i = 1; i <= expBits; i++) addBit(bitStr[i], 'exp-bit');
    addSep();
    for (let i = 1 + expBits; i < bitStr.length; i++) addBit(bitStr[i], 'mant-bit');
  }

  // ─── Render grouped display ──────────────────────────────────────────────────

  function renderFpGroups(a) {
    const { bitStr, expBits, mantBits } = a;
    const signBit = bitStr[0];
    const expBitStr  = bitStr.slice(1, 1 + expBits);
    const mantBitStr = bitStr.slice(1 + expBits);
    const el = document.getElementById('fp-groups');
    el.innerHTML =
      '<span class="fp-g-sign">' + signBit + '</span>' +
      '<span class="fp-g-sep">|</span>' +
      '<span class="fp-g-exp">' + expBitStr + '</span>' +
      '<span class="fp-g-sep">|</span>' +
      '<span class="fp-g-mant">' + mantBitStr + '</span>';
  }

  // ─── Render special-value badges ─────────────────────────────────────────────

  function renderFpBadges(a) {
    const { classification } = a;
    const badgesEl = document.getElementById('fp-badges');
    const badges = [];
    if (classification === 'nan') {
      badges.push(['badge-nan', 'NaN']);
    } else if (classification === 'inf') {
      badges.push(['badge-inf', '+\u221E']);
    } else if (classification === 'neginf') {
      badges.push(['badge-neginf', '\u2212\u221E']);
    } else if (classification === 'subnormal') {
      badges.push(['badge-subnorm', 'SUBNORMAL']);
    } else if (classification === 'negzero') {
      badges.push(['badge-negzero', '\u22120']);
    } else if (classification === 'normal') {
      badges.push(['badge-normal', 'NORMAL']);
    } else if (classification === 'zero') {
      badges.push(['badge-normal', '+0']);
    }
    if (badges.length) {
      badgesEl.innerHTML = badges.map(([cls, label]) =>
        '<span class="fp-badge ' + cls + '">' + label + '</span>'
      ).join('');
      badgesEl.style.display = 'flex';
    } else {
      badgesEl.style.display = 'none';
    }
  }

  // ─── Render precision error box ───────────────────────────────────────────────

  function renderFpPrecision(inputValue, a) {
    const box = document.getElementById('fp-precision-box');
    const { storedValue, classification } = a;

    if (classification === 'nan' || classification === 'inf' || classification === 'neginf') {
      box.style.display = 'none';
      return;
    }

    document.getElementById('fp-prec-input').textContent = inputValue;
    document.getElementById('fp-prec-stored').textContent = storedValue.toPrecision(20).replace(/0+$/, '').replace(/\.$/, '');
    const exact = String(inputValue) === String(storedValue);
    const exactEl = document.getElementById('fp-prec-exact');
    exactEl.textContent = exact ? '\u2713 exact' : '';
    exactEl.style.color = exact ? 'var(--text-ok)' : '';
    box.style.display = 'block';
  }

  // ─── Main update function ────────────────────────────────────────────────────

  function updateFpVisualizer(raw) {
    const errEl = document.getElementById('fp-error');
    const input = document.getElementById('fp-input');

    if (!raw.trim()) {
      clearFpResult();
      errEl.textContent = '';
      input.classList.remove('error');
      return;
    }

    const parsed = parseFpInput(raw);
    if (!parsed.valid) {
      errEl.textContent = parsed.error;
      input.classList.add('error');
      clearFpResult();
      return;
    }

    errEl.textContent = '';
    input.classList.remove('error');

    const value = parsed.value;
    const a = analyseFp(value, currentFpPrec);

    // Show all panels
    document.getElementById('fp-placeholder').style.display = 'none';
    document.getElementById('fp-visual').style.display = 'block';
    document.getElementById('fp-groups').style.display = 'block';
    document.getElementById('fp-formula-box').style.display = 'block';
    document.getElementById('fp-info-table').style.display = 'table';
    document.getElementById('fp-outputs').style.display = 'table';

    renderFpBits(a);
    renderFpGroups(a);
    renderFpBadges(a);

    // Formula
    document.getElementById('fp-formula-text').textContent = buildFormula(a, value);

    // Info table
    document.getElementById('fp-i-sign').textContent = a.sign + (a.sign === 0 ? '  (+)' : '  (\u2212)');
    document.getElementById('fp-i-exp-stored').textContent = a.expStored + '  (0x' + a.expStored.toString(16).toUpperCase().padStart(2, '0') + ')';
    document.getElementById('fp-i-bias').textContent = a.bias;
    document.getElementById('fp-i-exp-actual').textContent = a.expActual;
    const mantHexPad = Math.ceil(a.mantBits / 4);
    const mantHexStr = '0x' + a.mantRaw.toString(16).toUpperCase().padStart(mantHexPad, '0');
    document.getElementById('fp-i-mant').textContent = mantHexStr;

    setCopy('fp-c-sign',       String(a.sign));
    setCopy('fp-c-exp-stored', String(a.expStored));
    setCopy('fp-c-exp-actual', String(a.expActual));
    setCopy('fp-c-mant',       mantHexStr);

    // Outputs
    const decStr = a.storedValue.toPrecision(20).replace(/0+$/, '').replace(/\.$/, '');
    document.getElementById('fp-o-dec').textContent = decStr;
    document.getElementById('fp-o-hex').innerHTML = formatNumber(a.hexStr);
    document.getElementById('fp-o-bin').innerHTML = formatNumber('0b' + a.bitStr);
    setCopy('fp-co-dec', decStr);
    setCopy('fp-co-hex', a.hexStr);
    setCopy('fp-co-bin', '0b' + a.bitStr);
    setCopy('fp-bin-copy', '0b' + a.bitStr);

    // Precision
    renderFpPrecision(raw.trim(), a);

    // History
    scheduleHistoryAutoSave('fp-input', 'hw-fp', raw);
  }

  function clearFpResult() {
    document.getElementById('fp-placeholder').style.display = 'block';
    document.getElementById('fp-badges').style.display = 'none';
    document.getElementById('fp-visual').style.display = 'none';
    document.getElementById('fp-groups').style.display = 'none';
    document.getElementById('fp-formula-box').style.display = 'none';
    document.getElementById('fp-info-table').style.display = 'none';
    document.getElementById('fp-outputs').style.display = 'none';
    document.getElementById('fp-precision-box').style.display = 'none';
  }

  // ─── Wire up fp input ────────────────────────────────────────────────────────
  // Note: initInputHistory('hw-fp', 'fp-input') is already called above in the
  // batch registration block (line ~1988). Calling it again here would register
  // duplicate event listeners on the input, breaking real-time validation.

  const fpInput = document.getElementById('fp-input');
  if (fpInput) {
    fpInput.addEventListener('input', () => updateFpVisualizer(fpInput.value));
    fpInput.addEventListener('keydown', e => { if (e.key === 'Enter') updateFpVisualizer(fpInput.value); });
  }

  // Initialise legend bit counts
  updateFpLegend();


  // Tab button wiring — script runs at end of <body> so elements exist now.
  const tabIntBtn = document.getElementById('tab-int-btn');
  const tabFpBtn  = document.getElementById('tab-fp-btn');
  if (tabIntBtn) tabIntBtn.addEventListener('click', () => switchTab('integers'));
  if (tabFpBtn)  tabFpBtn.addEventListener('click',  () => switchTab('ieee754'));

</script>
</body>
</html>`;
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}