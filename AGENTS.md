# AI Agents Context and Instructions

This file provides system instructions and context for AI agents working in this repository.

## Read the main context files
1. **`docs/features.md`**: The single source of truth for current and planned features, user stories, and progress. Always refer to it when working on a feature, and update its progress checkboxes when a feature is completed.
2. **`docs/personal_dojo_dev_guide.md`**: The dev guide. Read it to understand how the tool works.
3. **`docs/ARCH-accounts-and-library.md`**: The agreed architecture for the deck and session library, share links, and optional accounts. Follow its phases and decision log.
4. **`docs/TODO-accounts-and-library.md`**: The checklist of what's done and what's left in that plan. Tick items (with how they were verified) when they reach `main`, and add new work to it.
5. **`app/index.html`**: Where the tool lives and where the user is going to be asking for changes. Treat it with respect. Don't change anything that isn't specifically asked for.

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Landing page (`https://practicedojo.github.io/`) |
| `app/index.html` | The Practice Dojo (`https://practicedojo.github.io/app/`) |
| `app/js/` | Small modules split out of the app (see "Splitting rule"). `library.js` = device library |
| `app/defaults/` | Default decks and demos shipped with the app (manifests + files) |
| `img/` | Images used by the landing page and the app |
| `docs/` | Feature list, dev guide, architecture, implementation and research notes, test protocols |
| `docs/samples/` | Sample Duels.ink logs and replays for testing imports |

## Splitting rule (YAGNI)
The app started as a single HTML file. A new concern with its own reason to change (for example device storage or Supabase) gets its own classic `<script src>` file in `app/js/`, exposing one global. Existing code is only extracted when a feature has to change it substantially anyway. No build step, no bundler, no framework.

## Versioning Convention

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`) to track progress, and this version number is displayed in the UI (e.g., `v1.12.0`).

- **MAJOR**: Increment when making massive, incompatible rewrites to the core application (e.g., `v2.0.0`).
- **MINOR**: Increment this every time you complete a new Feature listed in `docs/features.md`. Reset `PATCH` to `0` when you do this.
- **PATCH**: Increment this for pure bug fixes or minor refactors that don't add new functionality.

**Whenever you complete a feature or patch that requires a version bump:**
1. Update `APP_VERSION` in `app/index.html` (the UI reads it from there).
2. Update the version label in the landing page (`index.html`).

## Keeping a dev guide
- Whenever the user asks to `update the dev guide`, add a concise distillation of the session as a section in `docs/personal_dojo_dev_guide.md`.
