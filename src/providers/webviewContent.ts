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
    .calc-result .expr:hover .copy-btn { opacity: 1; }

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

    .hint span { color: var(--accent2); }
    .hint [data-tooltip] { color: var(--accent2); cursor: help; }
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

    .calc-operands input {
      // font-size: 13px;
      flex: 1 1 180px;
      min-width: 140px;

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

      .calc-operands input {
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
  </style>
</head>
<body>
  <div class="tooltip" id="tooltip" aria-hidden="true"></div>

<!-- ═══════════════════════════════════════════════════
     SECTION 1 — CONVERTER
═══════════════════════════════════════════════════ -->
<div class="section" id="sec-converter">
  <div class="section-header" onclick="toggleSection('converter')">
    <span>⬡</span> Converter
    <span class="chevron">▾</span>
  </div>
  <div class="section-content" id="conv-content">

    <div class="hint">
      Prefixes required: <span data-tooltip="Hexadecimal prefix."><span class="num-prefix">0x</span><span class="num-value">FF</span></span> · <span data-tooltip="Binary prefix."><span class="num-prefix">0b</span><span class="num-value">1010</span></span> · <span data-tooltip="Octal prefix."><span class="num-prefix">0o</span><span class="num-value">77</span></span> · <span data-tooltip="Decimal literal."><span class="num-value">255</span></span> · negatives: <span data-tooltip="Negative hexadecimal value prefix."><span class="num-prefix">-0x</span><span class="num-value">FF</span></span> or [<span class="msb" data-tooltip="Most Significant Bit. If 1, number is negative in two's complement.">MSB</span>]
    </div>

    <div class="input-row">
      <input type="text" id="conv-input" placeholder="0xFF, -0xFF, 0b1010, -0b1010, 255, -255 …" maxlength="256"
             autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
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

    <!-- ASCII hint box — explains the character shown above -->
    <div class="ascii-hint-box" id="ascii-hint" style="display:none"></div>

    <!-- Signed / unsigned cards -->
    <div class="sign-grid" id="sign-grid" style="display:none">
      <div class="sign-card unsigned">
        <div class="card-title">Unsigned interpretation</div>
        <div class="card-value" id="r-unsigned">—</div>
        <button type="button" class="copy-btn card-copy" id="copy-unsigned" onclick="doCopy(this)" data-label="Copy"><span class="copy-tooltip">Copy</span><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
      </div>
      <div class="sign-card signed">
        <div class="card-title">Signed interpretation</div>
        <div class="card-value" id="r-signed">—</div>
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
    <span>⊞</span> Signed / Unsigned (all sizes)
    <span class="chevron">▾</span>
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
    <span>⊕</span> Bitwise Calculator
    <span class="chevron">▾</span>
  </div>
  <div class="section-content" id="calc-content">

    <div class="hint">
      Select an instruction · enter operands · result updates instantly
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

    <!-- Operand inputs -->
    <div class="calc-operands">
      <label id="lbl-a">A:</label>
      <input type="text" id="calc-a" placeholder="0xFF" maxlength="256"
             autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <label id="lbl-b">B:</label>
      <input type="text" id="calc-b" placeholder="0x0F" maxlength="256"
             autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
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

<script nonce="${nonce}">
  // ─── State ──────────────────────────────────────────────────────────────────
  const vscode = acquireVsCodeApi();

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

  // Set the data-value on a copy button by id
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
        return { valid: false, error: 'Use prefix: 0x hex · 0b binary · 0o octal · digits decimal · prefix negatives with - before the prefix' };
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
        ? renderedByte + '<span class="bit-sep"> │ </span>'
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

  // Full descriptions for the ASCII hint box
  const ASCII_DESCRIPTIONS = {
    0:  'NUL — Null. String terminator in C/C++.',
    1:  'SOH — Start of Heading.',
    2:  'STX — Start of Text.',
    3:  'ETX — End of Text. Ctrl+C in many terminals.',
    4:  'EOT — End of Transmission. Ctrl+D (EOF on Unix).',
    5:  'ENQ — Enquiry.',
    6:  'ACK — Acknowledge.',
    7:  'BEL — Bell. Triggers an audible alert (\\\\a in C).',
    8:  'BS — Backspace (\\\\b in C).',
    9:  'HT — Horizontal Tab (\\\\t in C).',
    10: 'LF — Line Feed. Unix/Linux newline character (\\\\n in C).',
    11: 'VT — Vertical Tab (\\\\v in C).',
    12: 'FF — Form Feed. Advances to next page (\\\\f in C).',
    13: 'CR — Carriage Return (\\\\r in C). Windows lines end with CR+LF.',
    14: 'SO — Shift Out.',
    15: 'SI — Shift In.',
    16: 'DLE — Data Link Escape.',
    17: 'DC1 — Device Control 1 (XON — resume transmission).',
    18: 'DC2 — Device Control 2.',
    19: 'DC3 — Device Control 3 (XOFF — pause transmission).',
    20: 'DC4 — Device Control 4.',
    21: 'NAK — Negative Acknowledge.',
    22: 'SYN — Synchronous Idle.',
    23: 'ETB — End of Transmission Block.',
    24: 'CAN — Cancel.',
    25: 'EM — End of Medium.',
    26: 'SUB — Substitute. Ctrl+Z (EOF on Windows).',
    27: 'ESC — Escape. Starts ANSI escape sequences in terminals.',
    28: 'FS — File Separator.',
    29: 'GS — Group Separator.',
    30: 'RS — Record Separator.',
    31: 'US — Unit Separator.',
    32: 'SP — Space. Printable whitespace (0x20).',
    127:'DEL — Delete. Non-printable control character.'
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
    if (v < 0n || v > 127n) {
      hintEl.style.display = 'none';
      return;
    }
    let text = '';
    if (ASCII_DESCRIPTIONS[n]) {
      text = ASCII_DESCRIPTIONS[n];
    } else if (n >= 33 && n <= 126) {
      text = "'" + String.fromCharCode(n) + "' — Printable ASCII character, code " + n + " (" + formatNumber("0x" + n.toString(16).toUpperCase()) + ").";
    }
    if (text) {
      hintEl.innerHTML = text;
      hintEl.style.display = 'block';
    } else {
      hintEl.style.display = 'none';
    }
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

    // Rebuild binary visual with copy button appended
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

    // ASCII hint
    updateAsciiHint(unsigned);

    // Overflow warnings
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
    document.querySelectorAll('.bit-btn').forEach(btn => {
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
    const bWrap = document.getElementById('calc-b');
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

    document.getElementById('calc-expr-text').textContent = '▶ ' + expr;
    document.getElementById('cr-hex').innerHTML = formatNumber(hexStr);
    document.getElementById('cr-dec').innerHTML = formatNumber(decStr);
    document.getElementById('cr-bin').innerHTML = '<span class="num-prefix">0b</span><span class="num-value">' + grouped + '</span>';
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

  document.querySelectorAll('.bit-btn').forEach(btn => {
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

  // ─── Messages from extension host ───────────────────────────────────────────

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'setInput') {
      const input = document.getElementById('conv-input');
      input.value = msg.value;
      updateConverter(msg.value);
      if (!sectionState.converter) toggleSection('converter');
    } else if (msg.type === 'copyDone') {
      const btn = document.getElementById(msg.id);
      if (btn) showSuccess(btn);
    }
  });

  // Default to ADD on load
  selectOp('ADD');
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