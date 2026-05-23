# Changelog

All notable changes to this project will be documented in this file.

---

## v1.3.0 - 2026

### Added
* IEEE-754 float32 / float64 visualizer
  * Sign, exponent, and mantissa field breakdown
  * Hex and binary output with `0x` / `0b` highlighted prefixes
  * Precision box comparing input value vs stored value
  * Special value presets: `+INF`, `-INF`, `NaN`, `MAX`, `MIN`, `ε`, `π`, `e`
* `0b` prefix on binary output in the IEEE-754 visualizer

---

## v1.2.0 - 2026

### Added
* Input history system for all text-based inputs
* Keyboard navigation through input history (Arrow Up / Arrow Down)
* Visual history navigation buttons with hover and active states
* Session-persistent input history
* Automatic deduplication and removal of oldest entries beyond the 500-entry limit

### Improved
* Input workflow efficiency for repetitive conversions and calculations
* Internal modularity and maintainability of input systems