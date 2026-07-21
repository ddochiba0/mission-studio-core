# Sprint 6 — Templates and safe exchange

## Goal

Reuse missions without copying implementation logic and exchange them through a validated, versioned format.

## Included

- project-agnostic Template Engine
- safe duplication with new mission and checkpoint identifiers
- versioned `sia.mission` JSON exchange document
- import validation with user-facing error explanations
- browser file upload/download adapter

## User verification

1. Duplicate a mission and confirm the original remains unchanged.
2. Export a mission and confirm a JSON file downloads.
3. Import the exported file and confirm a new draft appears.
4. Attempt to import an unrelated JSON file and confirm a clear error appears.
