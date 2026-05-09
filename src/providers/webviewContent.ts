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
  // CSP nonce for inline scripts
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

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-ui);
      font-size: 12px;
      line-height: 1.5;
      overflow-x: hidden;
      padding-bottom: 24px;
    }

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

    input[type="text"]:focus {
      border-color: var(--accent);
    }

    input[type="text"].error {
      border-color: var(--text-err);
    }

    .hint {
      color: var(--text-dim);
      font-size: 10px;
      margin-bottom: 8px;
      font-family: var(--font-mono);
    }

    .hint span { color: var(--accent2); }

    /* ─── Error message ─────────────────────────────────── */
    .error-msg {
      color: var(--text-err);
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 4px 0;
      min-height: 16px;
    }

    /* ─── Overflow message ───────────────────────────────── */
    .overflow-msg {
      color: #ffcc00;
      font-size: 11px;
      font-family: var(--font-mono);
      padding: 4px 0;
      min-height: 16px;
    }

    /* ─── Signed overflow message ────────────────────────── */
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
      vertical-align: top;
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
      gap: var(--gap);
      margin-bottom: 8px;
    }

    .calc-operands input { font-size: 12px; }
    .calc-operands label {
      font-size: 10px;
      color: var(--text-dim);
      font-family: var(--font-mono);
      white-space: nowrap;
      align-self: center;
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
      color: var(--text-dim);
      margin-bottom: 4px;
      font-size: 10px;
    }

    .calc-result-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }

    .calc-result-row .r-label { color: var(--text-dim); }
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

    /* ─── Source badge ──────────────────────────────────── */
    .source-badge {
      display: inline-block;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 2px;
      background: #264f78;
      color: var(--accent);
      margin-left: 4px;
      vertical-align: middle;
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

    /* ─── Tooltip ───────────────────────────────────────── */
    [title] { cursor: help; }

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
    }

    .all-sizes-table .size-label {
      color: var(--text-dim);
      white-space: nowrap;
    }

    .all-sizes-table .u-val { color: var(--accent2); }
    .all-sizes-table .s-val { color: #f48771; }
  </style>
</head>
<body>

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
      Prefixes required: <span>0x</span>FF · <span>0b</span>1010 · <span>0o</span>77 · <span>255</span> · negatives: <span>-0x</span>FF
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

    <!-- Binary visual -->
    <div class="binary-visual" id="bin-visual" style="display:none"></div>
    <div class="raw-caption" id="raw-caption" style="display:none"></div>

    <!-- Main conversions -->
    <table class="result-table" id="conv-table" style="display:none">
      <tr><td class="label">Input (signed)</td>  <td class="value dec"   id="r-dec"></td></tr>
      <tr><td class="label">Raw hex</td>          <td class="value hex"   id="r-hex"></td></tr>
      <tr><td class="label">Raw oct</td>          <td class="value oct"   id="r-oct"></td></tr>
      <tr><td class="label">ASCII</td>            <td class="value ascii" id="r-ascii"></td></tr>
    </table>

    <!-- Signed / unsigned cards -->
    <div class="sign-grid" id="sign-grid" style="display:none">
      <div class="sign-card unsigned">
        <div class="card-title">Unsigned interpretation</div>
        <div class="card-value" id="r-unsigned">—</div>
      </div>
      <div class="sign-card signed">
        <div class="card-title">Signed interpretation</div>
        <div class="card-value" id="r-signed">—</div>
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
          <th>Signed</th>
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
      Click an op · enter operands · result updates instantly
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
      <div class="expr" id="calc-expr"></div>
      <div class="calc-result-row"><span class="r-label">HEX</span><span class="r-value hex" id="cr-hex"></span></div>
      <div class="calc-result-row"><span class="r-label">DEC</span><span class="r-value dec" id="cr-dec"></span></div>
      <div class="calc-result-row"><span class="r-label">BIN</span><span class="r-value bin" id="cr-bin"></span></div>
      <div class="calc-result-row"><span class="r-label">OCT</span><span class="r-value oct" id="cr-oct"></span></div>
      <hr>
      <div class="calc-result-row"><span class="r-label">Unsigned (sel)</span><span class="r-value hex" id="cr-u"></span></div>
      <div class="calc-result-row"><span class="r-label">Signed (sel)</span>  <span class="r-value" style="color:#f48771" id="cr-s"></span></div>
    </div>

    <div class="placeholder" id="calc-placeholder">Select an operation and enter operands.</div>
  </div>
</div>

<script nonce="${nonce}">
  // ─── State ──────────────────────────────────────────────────────────────────
  const vscode = acquireVsCodeApi();
  let currentBitSize = 16;
  let currentOp = null;

  // ─── Utility: BigInt math (browser-safe, no imports) ────────────────────────

  function parseInput(raw) {
    const s = raw.trim();
    if (!s) return { valid: false, error: 'Empty input' };
    const negative = s.startsWith('-');
    const unsigned = negative ? s.slice(1) : s;
    try {
      if (/^0[xX][0-9a-fA-F]+$/.test(unsigned)) {
        const value = BigInt(unsigned);
        return { valid: true, value: negative ? -value : value };
      }
      if (/^0[bB][01]+$/.test(unsigned)) {
        const value = BigInt(unsigned);
        return { valid: true, value: negative ? -value : value };
      }
      if (/^0[oO][0-7]+$/.test(unsigned)) {
        const value = BigInt(unsigned.replace(/^0[oO]/, '0o'));
        return { valid: true, value: negative ? -value : value };
      }
      if (/^[0-9]+$/.test(unsigned)) {
        const value = BigInt(unsigned);
        return { valid: true, value: negative ? -value : value };
      }
      return { valid: false, error: 'Use prefix: 0x hex · 0b binary · 0o octal · digits decimal · prefix negatives with - before the prefix' };
    } catch(e) {
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
      if (i + 1 < nibbles.length) bytes.push(nibbles[i] + ' ' + nibbles[i+1]);
      else bytes.push(nibbles[i]);
    }
    return bytes.join('  ');
  }

  function renderBinary(binStr) {
    let html = '';
    let nibbleCount = 0;
    for (let i = 0; i < binStr.length; i++) {
      const ch = binStr[i];
      if (ch === ' ') {
        nibbleCount++;
        if (nibbleCount % 2 === 0 && nibbleCount > 0) {
          html += '<span class="bit-sep">│</span>';
        } else {
          html += ' ';
        }
        continue;
      }
      html += ch === '1'
        ? '<span class="bit-1">1</span>'
        : '<span class="bit-0">0</span>';
    }
    return html;
  }

  const ASCII_LABELS = {
    0:'NUL',1:'SOH',2:'STX',3:'ETX',4:'EOT',5:'ENQ',6:'ACK',7:'BEL',
    8:'BS',9:'HT',10:'LF',11:'VT',12:'FF',13:'CR',14:'SO',15:'SI',
    16:'DLE',17:'DC1',18:'DC2',19:'DC3',20:'DC4',21:'NAK',22:'SYN',23:'ETB',
    24:'CAN',25:'EM',26:'SUB',27:'ESC',28:'FS',29:'GS',30:'RS',31:'US',
    127:'DEL'
  };

  function getAscii(v) {
    const n = Number(v);
    if (v < 0n || v > 127n) return 'N/A';
    if (ASCII_LABELS[n]) return '<' + ASCII_LABELS[n] + '>';
    return "'" + String.fromCharCode(n) + "'";
  }

  // ─── Converter ─────────────────────────────────────────────────────────────

  function updateConverter(raw) {
    const errEl  = document.getElementById('conv-error');
    const input  = document.getElementById('conv-input');

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

    const v = parsed.value;
    const unsigned = maskUnsigned(v, currentBitSize);
    const signed   = toSigned(unsigned, currentBitSize);

    const binStr  = unsigned.toString(2).padStart(currentBitSize, '0');
    const grouped = groupBinary(binStr);

    document.getElementById('bin-visual').innerHTML = renderBinary(grouped);
    document.getElementById('bin-visual').style.display = 'block';

    document.getElementById('r-dec').textContent   = v.toString(10);
    document.getElementById('r-hex').textContent   = '0x' + unsigned.toString(16).toUpperCase().padStart(currentBitSize / 4, '0');
    document.getElementById('r-oct').textContent   = '0o' + unsigned.toString(8);
    document.getElementById('r-ascii').textContent = getAscii(unsigned);

    document.getElementById('r-unsigned').textContent = unsigned.toString(10);
    document.getElementById('r-signed').textContent   = signed.toString(10);

    // Check for truncation or signed interpretation note
    const overflowEl = document.getElementById('conv-overflow');
    const signedOverflowEl = document.getElementById('conv-signed-overflow');
    const maxUnsigned = (1n << BigInt(currentBitSize)) - 1n;
    const maxSigned = (1n << BigInt(currentBitSize - 1)) - 1n;
    const minSigned = -(1n << BigInt(currentBitSize - 1));
    const isTruncated = v > maxUnsigned || v < minSigned;

    if (isTruncated) {
      overflowEl.textContent = 'Value exceeds int' + currentBitSize + ' storage width. Higher bits were truncated.';
      overflowEl.style.display = 'block';
      signedOverflowEl.style.display = 'none';
    } else if (v >= 0n && unsigned > maxSigned) {
      signedOverflowEl.textContent = 'Value exceeds signed int' + currentBitSize + ' range (' + minSigned.toString() + ' to ' + maxSigned.toString() + '). Signed interpretation differs from unsigned.';
      signedOverflowEl.style.display = 'block';
      overflowEl.style.display = 'none';
    } else {
      overflowEl.style.display = 'none';
      signedOverflowEl.style.display = 'none';
    }

    document.getElementById('raw-caption').textContent =
      "Two's complement representation for int" + currentBitSize + " (stored raw value)";
    document.getElementById('raw-caption').style.display = 'block';

    document.getElementById('conv-table').style.display  = 'table';
    document.getElementById('sign-grid').style.display   = 'grid';
    document.getElementById('conv-placeholder').style.display = 'none';

    updateSizesTable(v);
  }

  function clearConvResult() {
    document.getElementById('bin-visual').style.display = 'none';
    document.getElementById('conv-table').style.display = 'none';
    document.getElementById('sign-grid').style.display  = 'none';
    document.getElementById('raw-caption').style.display = 'none';
    document.getElementById('conv-overflow').style.display = 'none';
    document.getElementById('conv-signed-overflow').style.display = 'none';
    document.getElementById('conv-placeholder').style.display = 'block';
    document.getElementById('sizes-table').style.display = 'none';
    document.getElementById('sizes-placeholder').style.display = 'block';
  }

  function setBitSize(size) {
    currentBitSize = size;
    document.querySelectorAll('.bit-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
    });
    const raw = document.getElementById('conv-input').value || '';
    updateConverter(raw);
  }

  const convInput = document.getElementById('conv-input');
  if (convInput) {
    convInput.addEventListener('input', () => updateConverter(convInput.value));
  }

  // ─── All Sizes Table ────────────────────────────────────────────────────────

  function updateSizesTable(v) {
    const sizes = [8, 16, 32, 64];
    const tbody = document.getElementById('sizes-tbody');
    tbody.innerHTML = '';
    for (const sz of sizes) {
      const u = maskUnsigned(v, sz);
      const s = toSigned(u, sz);
      const tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="size-label">int' + sz + '</td>' +
        '<td class="u-val">' + u.toString(10) + '</td>' +
        '<td class="s-val">' + s.toString(10) + '</td>';
      tbody.appendChild(tr);
    }
    document.getElementById('sizes-table').style.display = 'table';
    document.getElementById('sizes-placeholder').style.display = 'none';
  }

  // ─── Calculator ─────────────────────────────────────────────────────────────

  function selectOp(op) {
    currentOp = op;
    document.querySelectorAll('.op-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.op === op);
    });
    // NOT is unary — hide B input
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
    switch(op) {
      case 'ADD': return a + b;
      case 'SUB': return a - b;
      case 'MUL': return a * b;
      case 'DIV': if (b === 0n) throw new Error('Division by zero'); return a / b;
      case 'MOD': if (b === 0n) throw new Error('Modulo by zero');   return a % b;
      case 'AND': return a & b;
      case 'OR':  return a | b;
      case 'XOR': return a ^ b;
      case 'NOT': return ~a;
      case 'SHL': return a << b;
      case 'SHR': return a >> b;
      default: throw new Error('Unknown op: ' + op);
    }
  }

  function runCalc() {
    const errEl = document.getElementById('calc-error');
    const resEl = document.getElementById('calc-result');
    const phEl  = document.getElementById('calc-placeholder');

    if (!currentOp) {
      errEl.textContent = '';
      resEl.style.display = 'none';
      phEl.style.display = 'block';
      return;
    }

    const aRaw = document.getElementById('calc-a').value;
    const bRaw = document.getElementById('calc-b').value;

    const pA = parseInput(aRaw);
    if (!pA.valid && aRaw.trim()) {
      errEl.textContent = 'A: ' + pA.error;
      resEl.style.display = 'none';
      phEl.style.display = 'block';
      return;
    }

    if (currentOp !== 'NOT') {
      const pB = parseInput(bRaw);
      if (!pB.valid && bRaw.trim()) {
        errEl.textContent = 'B: ' + pB.error;
        resEl.style.display = 'none';
        phEl.style.display = 'block';
        return;
      }
      if (!pA.valid || !pB.valid) {
        errEl.textContent = '';
        resEl.style.display = 'none';
        phEl.style.display = 'block';
        return;
      }

      try {
        const result = evaluateOp(currentOp, pA.value, pB.value);
        showCalcResult(result, currentOp + ' ' + aRaw + ' ' + bRaw);
        errEl.textContent = '';
      } catch(e) {
        errEl.textContent = e.message;
        resEl.style.display = 'none';
        phEl.style.display = 'block';
      }
    } else {
      if (!pA.valid) {
        errEl.textContent = '';
        resEl.style.display = 'none';
        phEl.style.display = 'block';
        return;
      }
      try {
        const result = evaluateOp('NOT', pA.value, 0n);
        showCalcResult(result, 'NOT ' + aRaw);
        errEl.textContent = '';
      } catch(e) {
        errEl.textContent = e.message;
        resEl.style.display = 'none';
        phEl.style.display = 'block';
      }
    }
  }

  function showCalcResult(result, expr) {
    const unsigned = maskUnsigned(result, currentBitSize);
    const signed   = toSigned(unsigned, currentBitSize);

    const binRaw = unsigned.toString(2).padStart(currentBitSize, '0');
    const grouped = groupBinary(binRaw);

    document.getElementById('calc-expr').textContent  = '▶ ' + expr;
    document.getElementById('cr-hex').textContent     = '0x' + unsigned.toString(16).toUpperCase().padStart(currentBitSize / 4, '0');
    document.getElementById('cr-dec').textContent     = result.toString(10);
    document.getElementById('cr-bin').textContent     = grouped;
    document.getElementById('cr-oct').textContent     = '0o' + unsigned.toString(8);
    document.getElementById('cr-u').textContent       = unsigned.toString(10);
    document.getElementById('cr-s').textContent       = signed.toString(10);

    document.getElementById('calc-result').style.display = 'block';
    document.getElementById('calc-placeholder').style.display = 'none';
  }

  const calcA = document.getElementById('calc-a');
  const calcB = document.getElementById('calc-b');
  if (calcA) calcA.addEventListener('input', runCalc);
  if (calcB) calcB.addEventListener('input', runCalc);

  // Enter key on either operand triggers calculation
  document.querySelectorAll('.bit-btn').forEach(btn => {
    btn.type = 'button';
    btn.addEventListener('click', () => setBitSize(Number(btn.dataset.size)));
  });

  document.querySelectorAll('.op-btn').forEach(btn => {
    btn.type = 'button';
    btn.addEventListener('click', () => selectOp(btn.dataset.op));
  });

  if (calcA) {
    calcA.addEventListener('keydown', e => {
      if (e.key === 'Enter') runCalc();
    });
  }
  if (calcB) {
    calcB.addEventListener('keydown', e => {
      if (e.key === 'Enter') runCalc();
    });
  }

  // ─── Section toggle ──────────────────────────────────────────────────────────

  const sectionState = { converter: true, sizes: true, calc: true };

  function toggleSection(name) {
    sectionState[name] = !sectionState[name];
    const content = document.getElementById(name === 'converter' ? 'conv-content' : name === 'sizes' ? 'sizes-content' : 'calc-content');
    const header = content.previousElementSibling;
    if (sectionState[name]) {
      content.classList.remove('hidden');
      header.classList.remove('collapsed');
    } else {
      content.classList.add('hidden');
      header.classList.add('collapsed');
    }
  }

  // ─── Messages from extension host (e.g. selected text) ──────────────────────

  window.addEventListener('message', event => {
    const msg = event.data;
    if (msg.type === 'setInput') {
      const input = document.getElementById('conv-input');
      input.value = msg.value;
      updateConverter(msg.value);
      if (!sectionState.converter) toggleSection('converter');
    }
  });

  // Default to ADD on load so the calculator is immediately usable
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