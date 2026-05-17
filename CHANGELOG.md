# Changelog

All notable changes to this project will be documented in this file.

---

# v1.2.0 - 2026

## Added

* Input history system for all text-based inputs
* Keyboard navigation through input history

  * Arrow Up → previous entry
  * Arrow Down → next entry
* Reusable and centralized history management system
* Visual history navigation buttons inspired by native HTML number input spinners
* Styled history controls with hover and active states
* Configurable maximum history size
* Default history limit set to 500 entries
* Automatic removal of oldest entries when history limit is exceeded
* Prevention of duplicate consecutive history entries
* Ignoring empty or whitespace-only history entries
* Session-persistent input history behavior
* Accessibility improvements for history controls

  * Keyboard accessibility
  * Focus handling
  * ARIA labels/tooltips
* Smooth transitions and UI polish for history navigation

## Improved

* Input workflow efficiency for repetitive conversions and calculations
* Overall UX consistency across all text inputs
* Internal modularity and maintainability of input systems
* Code configurability through centralized constants/settings

## Technical Notes

* History limit can be easily changed through internal configuration
* History logic implemented as a reusable global system
* Optimized behavior for large history sizes
* Designed to avoid conflicts with existing keyboard shortcuts
