# BitWorkbench

> **A numeric systems workbench for low-level developers.**

BitWorkbench is a Visual Studio Code extension that provides an integrated numeric conversion and bitwise calculation panel — directly inside your editor. Stop switching between your IDE and an external hex calculator. Everything you need for systems programming, embedded development, and reverse engineering lives in the sidebar.

---

## Screenshot

```
┌─────────────────────────────────┐
│  ⬡ CONVERTER                    │
│  Prefixes required:             │
│  0xFF · 0b1010 · 0o77 · 255    │
│                                 │
│  [ 0xFF__________________ ]     │
│                                 │
│  [int8] [int16] [int32] [int64] │
│                                 │
│  1111 1111                      │ ← grouped binary
│                                 │
│  HEX   0x00FF                   │
│  DEC   255                      │
│  OCT   0o377                    │
│  ASCII 'ÿ'                      │
│                                 │
│  ┌──────────┬──────────┐        │
│  │ Unsigned │  Signed  │        │
│  │   255    │   -1     │        │
│  └──────────┴──────────┘        │
│                                 │
│  ⊞ SIGNED / UNSIGNED (all)      │
│  Width  Unsigned  Signed        │
│  int8      255       -1         │
│  int16     255      255         │
│  int32     255      255         │
│  int64     255      255         │
│                                 │
│  ⊕ BITWISE CALCULATOR           │
│  [ADD][SUB][MUL][DIV][MOD]      │
│  [AND][OR ][XOR][NOT][SHL][SHR] │
│                                 │
│  A: [ 0xF0________ ]            │
│  B: [ 0x0F________ ]            │
│                                 │
│  ▶ AND 0xF0 0x0F                │
│  HEX  0x0000                    │
│  DEC  0                         │
│  BIN  0000 0000                 │
│  OCT  0o0                       │
└─────────────────────────────────┘
```

---

## Features

### ✦ Numeric Converter

- Live conversion between **binary**, **decimal**, **hexadecimal**, and **octal**
- Strict **prefix enforcement** to eliminate ambiguity:
  - `0xFF` → hexadecimal
  - `0b1010` → binary
  - `0o77` → octal
  - `255` → decimal
- No silent guessing — values without recognized prefixes are rejected with a clear error message

### ✦ Signed / Unsigned Visualization

- Displays **unsigned** and **signed** (two's complement) values side-by-side
- Dynamically switch between **int8**, **int16**, **int32**, and **int64**
- All-sizes reference table for at-a-glance comparison across every integer width

```
Input: 0xFF

int8   → Unsigned: 255  | Signed: -1
int16  → Unsigned: 255  | Signed: 255
int32  → Unsigned: 255  | Signed: 255
int64  → Unsigned: 255  | Signed: 255
```

### ✦ Binary Visualization

Bits are grouped into nibbles (4 bits) and bytes for maximum readability:

```
0xFF  (int16)  →  0000 0000  1111 1111
                  ─────────  ─────────
                   high byte  low byte
```

Set bits (`1`) are highlighted; clear bits (`0`) are dimmed for instant visual scanning.

### ✦ ASCII Integration

- Every value is automatically looked up in the ASCII table
- Printable characters are shown as `'A'`
- Non-printable characters are labeled: `<NUL>`, `<LF>`, `<ESC>`, `<DEL>`, etc.
- Out-of-range values return `N/A`

```
0x41  →  'A'
0x0A  →  <LF>
0x1B  →  <ESC>
0xFF  →  N/A (out of ASCII range)
```

### ✦ Bitwise Calculator

An assembly-style expression evaluator supporting integer-only operations:

| Category   | Operations               |
|------------|--------------------------|
| Arithmetic | `ADD` `SUB` `MUL` `DIV` `MOD` |
| Bitwise    | `AND` `OR` `XOR` `NOT`   |
| Shift      | `SHL` `SHR`              |

Results are displayed in hex, decimal, binary, and octal — plus signed/unsigned at the currently selected integer width.

### ✦ Editor Integration

- **Select any numeric literal** in your code — BitWorkbench updates instantly
- Works with `0xFF`, `0b1010`, `0o77`, and plain decimal numbers
- Trigger manually via `Ctrl+Shift+B` / `Cmd+Shift+B` or the right-click context menu

---

## Installation

### From the Marketplace *(once published)*

1. Open Visual Studio Code
2. Press `Ctrl+P` and run:
   ```
   ext install bitworkbench.bitworkbench
   ```

### From source

```bash
git clone https://github.com/your-username/bitworkbench.git
cd bitworkbench
npm install
npm run compile
```

Then press `F5` in VSCode to launch the Extension Development Host.

### Building a `.vsix` package

```bash
npm install -g @vscode/vsce
vsce package
code --install-extension bitworkbench-1.0.0.vsix
```

---

## Usage

### Opening the panel

BitWorkbench appears as an icon in the **Activity Bar** (left sidebar). Click it to open the workbench panel, or run:

```
Ctrl+Shift+P → BitWorkbench: Open Panel
```

### Converter

Type any value in the input field using the required prefix:

| Input       | Meaning     |
|-------------|-------------|
| `0xFF`      | Hex 255     |
| `0b11110000`| Binary 240  |
| `0o377`     | Octal 255   |
| `255`       | Decimal 255 |
| `-1`        | Signed -1   |

Select the integer width (int8/int16/int32/int64) using the buttons below the input. All representations update instantly.

### Bitwise Calculator

1. Click an operation button (e.g. `AND`)
2. Enter operand A (e.g. `0xF0`)
3. Enter operand B (e.g. `0x0F`)
4. Results update immediately

```
AND  0xF0  0x0F   →  0x00   (0000 0000)
OR   0xF0  0x0F   →  0xFF   (1111 1111)
XOR  0xFF  0x0F   →  0xF0   (1111 0000)
SHL  0x01  4      →  0x10   (0001 0000)
NOT  0x00         →  0xFF…  (depends on width)
```

### Editor Integration

Select `0xFF` (or any numeric literal) in your code. If the BitWorkbench panel is already open, it updates automatically.

Press `Ctrl+Shift+B` (`Cmd+Shift+B` on macOS) to:
1. Open the panel
2. Analyze the currently selected text

Or right-click selected text → **BitWorkbench: Analyze Selected Value**.

---

## Supported Formats

| Format      | Example        | Prefix required |
|-------------|----------------|-----------------|
| Hexadecimal | `0xFF`         | `0x` or `0X`   |
| Binary      | `0b1010`       | `0b` or `0B`   |
| Octal       | `0o77`         | `0o` or `0O`   |
| Decimal     | `255` / `-42`  | none (digits)   |

> **Why strict prefixes?** Many existing tools silently guess whether a bare `FF` is hex or a variable name, or whether `010` is octal or decimal. In systems programming and reverse engineering, this ambiguity is dangerous. BitWorkbench requires prefixes so you always know exactly what you're looking at.

---

## Calculator Examples

```
ADD  0xFF   1        → 0x100   (256)
SUB  0x100  0x01     → 0xFF    (255)
MUL  0x10   0x10     → 0x100   (256)
DIV  0xFF   0x10     → 0x0F    (15)
MOD  0xFF   0x10     → 0x0F    (15)

AND  0b11110000  0b00001111   → 0b00000000  (0x00)
OR   0b11110000  0b00001111   → 0b11111111  (0xFF)
XOR  0b11111111  0b00001111   → 0b11110000  (0xF0)
NOT  0x00                     → 0xFF (int8) / 0xFFFF (int16) / …

SHL  0x01  4    → 0x10    (shift left 4 = multiply by 16)
SHR  0x80  3    → 0x10    (shift right 3 = divide by 8)
```

---

## Roadmap

- [ ] Byte-order / endianness toggle (little-endian / big-endian display)
- [ ] IEEE 754 float32 / float64 visualization
- [ ] Bit-field editor (click individual bits to toggle)
- [ ] Expression history / recent conversions
- [ ] Keyboard-driven calculator (type full `AND 0xF0 0x0F` in one input)
- [ ] Copy button for each output row
- [ ] Color-coded bit highlighting (per-nibble heatmap)
- [ ] Status bar integration (show value on hover / selection)
- [ ] Export / share conversion results

---

## Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please ensure:
- TypeScript compiles without errors (`npm run compile`)
- Code follows the existing style and file organization
- New features include comments explaining the logic

---

## Project Structure

```
bitworkbench/
├── src/
│   ├── extension.ts                     # Entry point, command registration
│   ├── providers/
│   │   ├── BitWorkbenchViewProvider.ts  # Webview sidebar provider
│   │   └── webviewContent.ts            # HTML/CSS/JS for the panel
│   └── utils/
│       ├── numeric.ts                   # Parsing, conversion, calculator logic
│       └── selectionDetector.ts         # Editor selection watcher
├── resources/
│   └── icon.svg                         # Activity bar icon
├── .vscode/
│   ├── launch.json                      # Debug configuration
│   └── tasks.json                       # Build tasks
├── package.json
├── tsconfig.json
└── README.md
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built for systems programmers, embedded engineers, reverse engineers, and anyone who thinks in bits.*
