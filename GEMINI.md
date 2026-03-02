# Gemini Context and Instructions

This file provides system instructions and context for Gemini (or other AI assistants) working in this directory.

## Versioning Convention

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`) to track progress, and this version number is displayed in the UI (e.g., `v1.12.0`).

- **MAJOR**: Increment when making massive, incompatible rewrites to the core application (e.g., `v2.0.0`).
- **MINOR**: Increment this every time you complete a new Feature listed in the `features.md` document. Reset `PATCH` to `0` when you do this.
- **PATCH**: Increment this for pure bug fixes or minor refactors that don't add new functionality.

**Whenever you complete a feature or patch that requires a version bump:**
1. Update the version number in all `.html` files in this directory (e.g., `practice_dojo.html`, `2player_practice_dojo.html`, etc.) by finding the old version string and replacing it with the new one.
2. Ensure you update all instances (e.g., in the loading screen, the setup modal, and the sidebar).

## Key Files

- **`features.md`**: Located in the same folder as this file (`./practice_dojo/features.md`). This document is the single source of truth for current and planned features, user stories, and progress. Always refer to this file when working on a feature, and ensure its progress checkboxes are updated when a feature is completed.
