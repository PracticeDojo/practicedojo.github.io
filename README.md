# Practice Dojo

A sandbox for theorycrafting Disney Lorcana: play out lines by hand, branch them into a multiverse of timelines, and import Duels.ink logs and replays to study real games.

- **Play:** https://practicedojo.win/app/
- **About:** https://practicedojo.win/

Everything runs in the browser and is served by Cloudflare from this repo. GitHub Pages still serves it at `practicedojo.github.io`, which sends visitors on to `practicedojo.win`. There's no build step: open `app/index.html` through any static server.

## Layout

| Path | What it is |
|---|---|
| `index.html` | Landing page |
| `css/`, `js/` | Landing page styles and scripts |
| `app/index.html` | The Dojo |
| `app/js/` | Small modules (`library.js`: decks and sessions on this device) |
| `app/defaults/` | Default decks and demos |
| `app/css/` | The CSS: `base.css` (original styles) and `field-unit.css` (the Field Unit design system on top) |
| `app/fonts/` | Self-hosted fonts: Inter, Inter Display and Liberation Mono (OFL) |
| `img/` | Shared images |
| `tools/` | Repo scripts: `refresh-landing.mjs` keeps the landing page in step with the app |
| `docs/` | Feature list, dev guide, architecture and test protocols |

Start with `docs/features.md` and `docs/personal_dojo_dev_guide.md`. The deck and session library (built), share links and optional accounts (planned) are described in `docs/ARCH-accounts-and-library.md`.
