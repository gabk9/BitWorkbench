/**
 * BitWorkbench — Numeric Conversion Utilities
 *
 * Handles parsing and conversion between binary, decimal,
 * hexadecimal, octal, and ASCII with strict prefix enforcement.
 */

export type IntSize = 8 | 16 | 32 | 64;

export interface ParsedValue {
  value: bigint;
  originalInput: string;
  base: 'binary' | 'decimal' | 'hex' | 'octal';
  valid: boolean;
  error?: string;
}

export interface NumericRepresentation {
  binary: string;
  binaryGrouped: string;
  decimal: string;
  hex: string;
  octal: string;
  ascii: string | null;
  asciiLabel: string;
  signedValues: Record<IntSize, string>;
  unsignedValues: Record<IntSize, string>;
}

/**
 * Parse an input string using strict prefix rules.
 * - 0x / 0X  → hexadecimal
 * - 0b / 0B  → binary
 * - 0o / 0O  → octal
 * - digits only → decimal
 * No prefix ambiguity: bare letters or bare numbers without
 * a recognized prefix are rejected.
 */
export function parseInput(input: string): ParsedValue {
  const raw = input.trim();

  if (!raw) {
    return { value: 0n, originalInput: raw, base: 'decimal', valid: false, error: 'Empty input' };
  }

  try {
    if (/^0[xX][0-9a-fA-F]+$/.test(raw)) {
      return { value: BigInt(raw), originalInput: raw, base: 'hex', valid: true };
    }

    if (/^0[bB][01]+$/.test(raw)) {
      return { value: BigInt(raw), originalInput: raw, base: 'binary', valid: true };
    }

    if (/^0[oO][0-7]+$/.test(raw)) {
      // BigInt supports '0o' prefix natively
      return { value: BigInt(raw.replace(/^0[oO]/, '0o')), originalInput: raw, base: 'octal', valid: true };
    }

    if (/^-?[0-9]+$/.test(raw)) {
      return { value: BigInt(raw), originalInput: raw, base: 'decimal', valid: true };
    }

    return {
      value: 0n,
      originalInput: raw,
      base: 'decimal',
      valid: false,
      error: `Unrecognized format. Use prefixes: 0x (hex), 0b (binary), 0o (octal), or plain digits (decimal).`,
    };
  } catch {
    return {
      value: 0n,
      originalInput: raw,
      base: 'decimal',
      valid: false,
      error: 'Value out of range or malformed.',
    };
  }
}

/**
 * Group a binary string into chunks of 4, separated by spaces,
 * with bytes separated by a wider gap marker.
 */
export function groupBinary(binStr: string): string {
  // Pad to multiple of 4
  const padded = binStr.padStart(Math.ceil(binStr.length / 4) * 4, '0');
  const nibbles: string[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    nibbles.push(padded.slice(i, i + 4));
  }
  // Group nibble pairs (bytes) with a '·' separator for readability
  const bytes: string[] = [];
  for (let i = 0; i < nibbles.length; i += 2) {
    if (i + 1 < nibbles.length) {
      bytes.push(`${nibbles[i]} ${nibbles[i + 1]}`);
    } else {
      bytes.push(nibbles[i]);
    }
  }
  return bytes.join('  ');
}

/**
 * Mask a bigint value to the given bit-width (unsigned).
 */
function maskUnsigned(value: bigint, bits: IntSize): bigint {
  const mask = (1n << BigInt(bits)) - 1n;
  return ((value % (1n << BigInt(bits))) + (1n << BigInt(bits))) & mask;
}

/**
 * Interpret a bit-masked unsigned value as signed (two's complement).
 */
function toSigned(unsigned: bigint, bits: IntSize): bigint {
  const signBit = 1n << BigInt(bits - 1);
  if (unsigned >= signBit) {
    return unsigned - (1n << BigInt(bits));
  }
  return unsigned;
}

/**
 * Get ASCII representation of a value.
 * Returns null if not representable as a single ASCII char.
 */
function getAscii(value: bigint): { char: string | null; label: string } {
  if (value < 0n || value > 127n) {
    return { char: null, label: 'N/A (out of ASCII range)' };
  }
  const code = Number(value);
  const nonPrintable: Record<number, string> = {
    0: 'NUL', 1: 'SOH', 2: 'STX', 3: 'ETX', 4: 'EOT', 5: 'ENQ',
    6: 'ACK', 7: 'BEL', 8: 'BS', 9: 'HT', 10: 'LF', 11: 'VT',
    12: 'FF', 13: 'CR', 14: 'SO', 15: 'SI', 16: 'DLE', 17: 'DC1',
    18: 'DC2', 19: 'DC3', 20: 'DC4', 21: 'NAK', 22: 'SYN', 23: 'ETB',
    24: 'CAN', 25: 'EM', 26: 'SUB', 27: 'ESC', 28: 'FS', 29: 'GS',
    30: 'RS', 31: 'US', 127: 'DEL',
  };
  if (nonPrintable[code]) {
    return { char: null, label: `<${nonPrintable[code]}>` };
  }
  const ch = String.fromCharCode(code);
  return { char: ch, label: `'${ch}'` };
}

/**
 * Convert a parsed (valid) value into all representations.
 */
export function buildRepresentation(parsed: ParsedValue, intSize: IntSize): NumericRepresentation {
  const raw = parsed.value;

  // Use absolute binary for display base
  const absBig = raw < 0n ? -raw : raw;
  const isNegative = raw < 0n;

  // For unsigned interpretations, mask to intSize
  const unsigned = maskUnsigned(raw, intSize);

  // Binary: always show as unsigned bits at intSize width
  const binStr = unsigned.toString(2).padStart(intSize, '0');
  const binaryGrouped = groupBinary(binStr);

  // Hex: uppercase, padded to intSize/4 chars
  const hexStr = '0x' + unsigned.toString(16).toUpperCase().padStart(intSize / 4, '0');

  // Octal
  const octStr = '0o' + unsigned.toString(8);

  // Decimal (raw signed value)
  const decStr = raw.toString(10);

  // ASCII
  const { char, label } = getAscii(unsigned);

  // Signed / unsigned for all sizes
  const sizes: IntSize[] = [8, 16, 32, 64];
  const signedValues: Record<IntSize, string> = {} as Record<IntSize, string>;
  const unsignedValues: Record<IntSize, string> = {} as Record<IntSize, string>;

  for (const size of sizes) {
    const u = maskUnsigned(raw, size);
    const s = toSigned(u, size);
    unsignedValues[size] = u.toString(10);
    signedValues[size] = s.toString(10);
  }

  return {
    binary: binStr,
    binaryGrouped,
    decimal: decStr,
    hex: hexStr,
    octal: octStr,
    ascii: char,
    asciiLabel: label,
    signedValues,
    unsignedValues,
  };
}

/**
 * Evaluate an assembly-style bitwise/arithmetic operation.
 * Syntax: OP OPERAND_A [OPERAND_B]
 * Returns a ParsedValue with the result, or an error.
 */
export function evaluateOperation(expression: string): ParsedValue {
  const parts = expression.trim().split(/\s+/);
  const op = parts[0]?.toUpperCase();
  const aRaw = parts[1];
  const bRaw = parts[2];

  if (!op || !aRaw) {
    return { value: 0n, originalInput: expression, base: 'decimal', valid: false, error: 'Invalid expression.' };
  }

  const parsedA = parseInput(aRaw);
  if (!parsedA.valid) {
    return { ...parsedA, error: `Operand A: ${parsedA.error}` };
  }

  const a = parsedA.value;

  // Unary operations
  if (op === 'NOT') {
    return { value: ~a, originalInput: expression, base: parsedA.base, valid: true };
  }

  if (!bRaw) {
    return { value: 0n, originalInput: expression, base: 'decimal', valid: false, error: `Operation ${op} requires two operands.` };
  }

  const parsedB = parseInput(bRaw);
  if (!parsedB.valid) {
    return { ...parsedB, error: `Operand B: ${parsedB.error}` };
  }

  const b = parsedB.value;

  switch (op) {
    case 'ADD': return { value: a + b, originalInput: expression, base: parsedA.base, valid: true };
    case 'SUB': return { value: a - b, originalInput: expression, base: parsedA.base, valid: true };
    case 'MUL': return { value: a * b, originalInput: expression, base: parsedA.base, valid: true };
    case 'DIV':
      if (b === 0n) return { value: 0n, originalInput: expression, base: 'decimal', valid: false, error: 'Division by zero.' };
      return { value: a / b, originalInput: expression, base: parsedA.base, valid: true };
    case 'MOD':
      if (b === 0n) return { value: 0n, originalInput: expression, base: 'decimal', valid: false, error: 'Modulo by zero.' };
      return { value: a % b, originalInput: expression, base: parsedA.base, valid: true };
    case 'AND': return { value: a & b, originalInput: expression, base: parsedA.base, valid: true };
    case 'OR':  return { value: a | b, originalInput: expression, base: parsedA.base, valid: true };
    case 'XOR': return { value: a ^ b, originalInput: expression, base: parsedA.base, valid: true };
    case 'SHL': return { value: a << b, originalInput: expression, base: parsedA.base, valid: true };
    case 'SHR': return { value: a >> b, originalInput: expression, base: parsedA.base, valid: true };
    default:
      return { value: 0n, originalInput: expression, base: 'decimal', valid: false, error: `Unknown operation: ${op}` };
  }
}
