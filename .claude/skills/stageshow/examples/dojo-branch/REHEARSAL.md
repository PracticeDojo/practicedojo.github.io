# Rehearsal: dojo-branch

A hero demo for the Practice Dojo landing page: rewind a lost match to turn 8,
note the plan, and the what-if line plays out to a win. Not on the landing
page yet: `mount.tsx` is the entry a build would use.

- **Gold copied:** `dark-hero` for the look (depth from surface steps on black,
  one lit colour); `story` for rolling figures. The layout is the Dojo's own
  multiverse canvas, cropped: cards on two columns, the turns between as dots.
- **Look:** Field Unit, values mirrored from `css/landing.css` (glass well,
  signal orange, Inter / Inter Display / Liberation Mono from `app/fonts`).
- **Data:** the Set 14 demo in `js/landing-multiverse-data.js`. The line played
  ends 3-21; the branch from turn 8 ends 27-18; the note is the demo's own
  turn-8 note. The lore steps in between (6-17, 13-18, 20-18) are invented.
- **Filmed:** `film.mjs --gate` at 1280 and 390 wide: `rehearsal passed` at
  both. The poster is the win frame.
- **Lines left:** `settle snap` and `jump: span "0".."9"` come from the kit's
  `Count` re-basing its digit strip (gold `story` prints the same); the caret
  `jump` is typing.
- **Not checked:** the fresh-eye review in `references/review.md`; night theme
  of the host page (the stage is dark in both); hover, pause and replay in the
  playground viewer; a real phone.
- **Simplified:** every node is drawn dark, where the Dojo draws Player 1's
  nodes on paper; the turns between a fork and its ending are dots; no card
  art; the branch grows without a seen cause (it stands for playing the turns).
