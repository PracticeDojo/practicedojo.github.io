# The in-app manual

Sources for the Dojo's Help (Feature 57) and guided tours (Feature 58). The plan, the
formats and the milestones are in [`docs/ARCH-help-and-tour.md`](../../docs/ARCH-help-and-tour.md);
what's left is in [`docs/TODO-help-and-tour.md`](../../docs/TODO-help-and-tour.md).

| Path | What it is |
|---|---|
| `sections.json` | The sections, in order, and their folders |
| `articles/<NN-section>/<id>.md` | One article per file: front matter, then Markdown (ARCH §5.2–§5.3) |
| `targets.json` | Named UI targets for *Show me* and tours, a selector per device (ARCH §7.1) |
| `synonyms.json` | Player words → Dojo words, for search (ARCH §6.3) |
| `tours/` | Guided tours and their practice boards (ARCH §8) |
| `img/` | The few screenshots the manual uses (ARCH §5.6) |
| `manual.json` | **Generated.** The only file the app fetches. Never edit it by hand |

## Writing an article

1. Replace the `TODO` body of the stub. Its `summary` is the article's scope.
2. Follow the style in ARCH §5.5: plain, short, controls named exactly as the app labels them, in bold.
3. Put device-specific steps in `:::desktop` / `:::phone` blocks (also `mouse`, `touch`; `:::desktop touch` is a tablet).
   Keys are `{key:M}`, gestures `{gesture:long-press}`, live controls `[Show me](show:<target>)`, other articles `[text](help:<id>)`.
4. Check every sentence in the app at 1440 and 390 wide (the dojo-screenshots skill), then set `verified` to the app version.
5. Add a golden query or two for it in `tools/help-golden.json`.
6. Run `node tools/help.mjs` and commit `manual.json` with your change. If `manual.json` conflicts with another branch, re-run the tool; don't merge it by hand.

A control without a target: add it to `targets.json` (give the element an `id` in `app/index.html` if it has none).
