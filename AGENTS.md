# AI Agents Context and Instructions

This file provides system instructions and context for AI agents working in this repository.

## Read the main context files
1. **`docs/features.md`**: The single source of truth for current and planned features, user stories, and progress. Always refer to it when working on a feature, and update its progress checkboxes when a feature is completed.
2. **`docs/personal_dojo_dev_guide.md`**: The dev guide. Read it to understand how the tool works.
3. **`docs/ARCH-accounts-and-library.md`**: The agreed architecture for the deck and session library, share links, and optional accounts. Follow its phases and decision log.
4. **`docs/TODO-accounts-and-library.md`**: The checklist of what's done and what's left in that plan. Tick items (with how they were verified) when they reach `main`, and add new work to it.
5. **`app/index.html`**: Where the tool lives and where the user is going to be asking for changes. Treat it with respect. Don't change anything that isn't specifically asked for.
6. **`docs/DESIGN-field-unit.md`**: The "Field Unit" design system the app's look follows (colours, type, components, do's and don'ts). Read it before any visual change, and style new UI with its tokens. The Field Unit tokens, themes and component styles live in `app/css/field-unit.css`; put visual changes there.

## Repository layout

| Path | What it is |
|---|---|
| `index.html` | Landing page (`https://practicedojo.win/`) |
| `app/index.html` | The Practice Dojo (`https://practicedojo.win/app/`) |
| `css/` | Landing page styles. `landing.css` = Field Unit's marketing chassis (its palette mirrors `app/css/field-unit.css`) |
| `js/` | Landing page scripts. `landing-multiverse.js` + `-data.js` = the multiverse sections, built from the Set 13 demo |
| `app/js/` | Small modules split out of the app (see "Splitting rule"). `library.js` = device library |
| `app/defaults/` | Default decks and demos shipped with the app (manifests + files) |
| `app/css/` | All of the app's CSS. `base.css` = the original stylesheet (loaded first), `field-unit.css` = the Field Unit design system on top (tokens, day/night themes, palettes, component styles) |
| `app/fonts/` | Self-hosted Field Unit fonts, used by the app and the landing page: Inter and Inter Display (built from Inter 4.1, OFL — see `Inter-OFL.txt`) and Liberation Mono (OFL — see `OFL.txt`). Never load fonts from a font CDN |
| `img/` | Images used by the landing page and the app |
| `docs/` | Feature list, dev guide, architecture, implementation and research notes, test protocols |
| `.claude/skills/` | Agent skills. `dojo-screenshots/` = the screenshot tool (see below) |
| `tools/` | Node scripts for the repo, never loaded by the site. `refresh-landing.mjs` = keeps the landing page in step with the app (see below) |
| `docs/samples/` | Sample Duels.ink logs and replays for testing imports |

## Screenshots
To see a UI change or show the user what something looks like, use the screenshot tool in `.claude/skills/dojo-screenshots/` (Claude Code loads it as the `dojo-screenshots` skill). Don't write your own Playwright or http-server script. Read its `SKILL.md` for recipes; the common one is:

```bash
node .claude/skills/dojo-screenshots/shoot.mjs --demo --widths 1440,390 --themes day,night --out /tmp/shots
```

It serves the repo, opens the Set 13 demo and saves PNGs. It can also shoot any git ref for before/after (`--ref origin/main`), drive the page (`--steps`), inject mock-ups (`--inject`), and `compose.mjs` lays labelled shots out on one sheet. Keep screenshots out of the repo.

## Keeping the landing page current
The landing page (`index.html`) shows the app: its version, screenshots of the board and the phone, and the Set 13 demo's multiverse. After any visible change to the app (or a version bump), run:

```bash
node tools/refresh-landing.mjs
```

It copies `APP_VERSION` into the page, rebuilds `js/landing-multiverse-data.js` from the demo, and retakes `img/dojo_board_*.webp` and `img/dojo_phone_*.webp`. Commit what it changed in the same PR. If the board's layout moved, check the numbered pins over the screenshots in `index.html`. `--no-shots` skips the browser; `--check` only reports whether the version and data are stale. The landing's multiverse (`js/landing-multiverse.js`, `css/landing.css`) is a port of the app's tree: when a change reshapes the Multiverse node or panel, port it there too.

## Splitting rule (YAGNI)
The app started as a single HTML file. A new concern with its own reason to change (for example device storage or Supabase) gets its own classic `<script src>` file in `app/js/`, exposing one global. Existing code is only extracted when a feature has to change it substantially anyway. No build step, no bundler, no framework.

## Styles
CSS lives in `app/css/`, never in a `<style>` block in `app/index.html`. The landing page's CSS is `css/landing.css`, on the same terms. New and changed styles go in `field-unit.css`. `base.css` is the older layer: leave it alone unless a change needs a rule there removed or fixed, and prune its overridden rules only in the area you are working on. Inline `style="…"` is for values set at runtime (positions, sizes, card images, palette variables), not for static styling.

## Versioning Convention

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`) to track progress, and this version number is displayed in the UI (e.g., `v1.12.0`).

- **MAJOR**: Increment when making massive, incompatible rewrites to the core application (e.g., `v2.0.0`).
- **MINOR**: Increment this every time you complete a new Feature listed in `docs/features.md`. Reset `PATCH` to `0` when you do this.
- **PATCH**: Increment this for pure bug fixes or minor refactors that don't add new functionality.

**Whenever you complete a feature or patch that requires a version bump:**
1. Update `APP_VERSION` in `app/index.html` (the UI reads it from there).
2. Run `node tools/refresh-landing.mjs` to carry it (and the new look) to the landing page (`index.html`).

## Branch naming

Every branch is named `<type>/<slug>`. Branches made by an AI agent put `claude/` in front: `claude/<type>-<slug>`.

| Type | Use it for | Version bump |
|---|---|---|
| `feat` | A feature from `docs/features.md` | MINOR |
| `fix` | A bug fix | PATCH |
| `design` | A visual change (Field Unit, CSS, landing page look) | PATCH |
| `refactor` | Moving or tidying code with no change in behaviour | PATCH |
| `docs` | Docs only | none |
| `chore` | Tooling, workflows, skills, repo housekeeping | none |

- The slug says what changes, in 2–5 lowercase words joined by hyphens. Start with the area when it helps: `multiverse-`, `landing-`, `library-`, `board-`.
- For a feature, put its number from `docs/features.md` first: `feat/23-share-links`.
- No version numbers, dates or names in the branch name.
- One branch per piece of work, one PR per branch. Delete the branch after it merges.

Examples: `feat/23-share-links`, `fix/landing-pin-05-position`, `design/multiverse-glass-notes`, `docs/branch-naming`, `claude/fix-lore-box-count`.

If your session starts on a branch named for you (for example `claude/epic-meitner-blh8tb`), create the conventional branch from it before your first commit and push that instead. If the environment won't let you push to it, keep the assigned branch, give the PR a title in the form `type: what changes`, and tell the user the conventional name so they can rename the branch on GitHub.

## Keeping a dev guide
- Whenever the user asks to `update the dev guide`, add a concise distillation of the session as a section in `docs/personal_dojo_dev_guide.md`.
