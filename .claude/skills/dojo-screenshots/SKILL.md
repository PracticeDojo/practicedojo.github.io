---
name: dojo-screenshots
description: Screenshot the Practice Dojo app or landing page in headless Chromium — the board with the Set 13 demo loaded, any panel, phone and desktop widths, day and night — plus before/after against any git ref, mock-ups injected into the live app, and labelled comparison sheets. Use whenever you need to see a UI change, show the user what something looks like, compare layouts, or check a width or theme. Do not write your own Playwright or http-server script; use these.
---

# Dojo screenshots

Two scripts in this folder. Both need only Node and Playwright (already in
cloud sessions; the scripts find it themselves).

- `shoot.mjs` serves the repo on a free local port, opens the app (or the
  landing page), optionally opens the **Set 13 demo**, and saves PNGs.
- `compose.mjs` lays labelled PNGs out on one sheet (before/after, a stack
  of variants, a grid of widths).

`node .claude/skills/dojo-screenshots/shoot.mjs --help` lists every option.

## Recipes

Run from the repo root. `$OUT` is a folder outside the repo: your scratchpad
if you have one, otherwise `/tmp/shots`. Never commit screenshots.

```bash
K=.claude/skills/dojo-screenshots

# The board with the demo, desktop and phone, day and night
node $K/shoot.mjs --demo --widths 1440,390 --themes day,night --out $OUT

# Just the top bar strip at several widths
node $K/shoot.mjs --demo --widths 1440,1024,800,390 --clip top:60 --out $OUT

# One element
node $K/shoot.mjs --demo --clip 'sel:.sidebar' --out $OUT

# Before / after: shoot main (or any commit) and the working tree, then compose
node $K/shoot.mjs --demo --ref origin/main --name before- --clip top:60 --out $OUT
node $K/shoot.mjs --demo --clip top:60 --out $OUT
node $K/compose.mjs --out $OUT/topbar.png "Before=$OUT/before-page-1440-day.png" "After=$OUT/page-1440-day.png"

# Side by side, cropped to the interesting part (CSS px of the shot)
node $K/compose.mjs --out $OUT/side.png --cols 2 --crop 0,0,700,60 "Before=..." "After=..."

# The landing page
node $K/shoot.mjs --page landing --widths 1280,390 --clip full --out $OUT
```

Files are named `<--name prefix><shot>-<width>-<theme>.png`; a plain run's
shot is called `page`. The script prints every path it wrote.

## Driving the page: `--steps`

To open a panel, click through a flow, or take several shots per width,
pass a module. It runs once per width × theme, after the page (and demo)
is ready. `examples/multiverse.mjs`:

```js
export default async (page, { shot, wait, width, phone, theme }) => {
    await shot('board');
    await shot('topbar', { clip: 'top:60' });   // same clip specs as --clip
    await page.click('#btn-multiverse');
    await wait(1000);
    await shot('multiverse');
    await page.keyboard.press('Escape');
};
```

`page` is a Playwright page; `window.App` is the app object, so
`page.evaluate(() => App.openTreeModal())` works too.

## Mock-ups without touching the repo: `--inject`

To show design options, draw them into the live app instead of editing
files: `--inject mock.js` adds a script to the page, and the steps module
calls it once per variant. See `examples/mock-topbar.js` and
`examples/mock-topbar.mjs`. Build mock-ups from the app's own classes and
Field Unit tokens (`var(--accent)`, `.icon-btn`, …) so they look real.
Keep mock files in your scratchpad, not the repo.

## Showing the user

Send the finished PNGs with `SendUserFile` (`display: "render"`). A single
compose sheet with clear labels beats a pile of loose shots. Look at each
image yourself first with Read and fix anything wrong (an overlapping
popup, a half-loaded board) before sending.

## Good to know

- The app loads its card database from a CDN, so the first load needs the
  network and takes a few seconds; `--demo` waits for the board to appear.
- Under 761px wide is a phone: touch, 844px tall, the phone layout.
- Themes are set by `data-theme` on `<html>`; `--themes auto` leaves the
  app's own choice.
- Toasts are hidden so they don't cover the top bar; `--toasts` keeps them.
- In cloud sessions the browser goes through the HTTPS proxy for the CDN
  and straight to the local server. The script sets this up; don't
  start your own `python -m http.server`.
- `--ref` exports that commit with `git archive`, so uncommitted files
  aren't in it. The working tree is what you get without `--ref`.
- Shots are 2× (`--scale 2`). Read shows them scaled down; coordinates
  you pass to `--clip` and `--crop` are CSS pixels.
