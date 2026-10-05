# Home: the key colours as ways in

Exploration, not shipped. Today's home is three similar-looking blocks: the black paste well, then two paper boxes. Nothing tells a player where to start. These options give each way in its own colour from the Field Unit key family (docs/DESIGN-field-unit.md · Function keys). Each colour keeps the meaning it already has on the card drawer's keys:

| Way in | Colour | Why |
|---|---|---|
| Paste a game (decklist, log, file) | **Glass** `#121212` | Data lives in the glass well; it already is |
| New match (seats, decks, Start) | **Trace** `#2F9E96` | Trace is Exert / Ready: getting a table ready |
| Pick up again (sessions, demos) | **Olive** `#8C8A2E` | Olive is Quest / Ink, the keys that bank something: your saved work |
| Start match | **Ember** signal | Still the one signal key on the view |

Coral isn't used: next to Ember it reads as the same orange.

The three options go from quiet to loud:

- **A · Keyed**: the layout stays as it is. Each section gets a coloured key-cap label and a coloured top edge, the session you were on gets an olive Resume key, and on desktop the torii sits beside the headline. `screens/A-keyed-*.png`
- **B · Three ways in**: the page asks "What do you want to practise?" and answers with three modules side by side, each headed by a full-colour band. On desktop, the torii leads the page at 132px. On phones, a row of three colour keys under the question jumps straight to each way in. `screens/B-three-ways-*.png`
- **C · Front panel**: the page is laid out like the front panel of a device. On desktop the header becomes a nameplate (a 236px torii, the name, the question, account and library), and each way in is a full slab of its colour. Glass display windows show what's loaded (seated decks, the last session), and the choices are keys (paper deck keys, the Ember Start key, the olive Resume key). On phones the slabs stack and the deck keys scroll sideways in one row. `screens/C-front-panel-*.png`

`screens/0-today-*.png` is the current home, for comparison.

## Trying them

Each option is a stylesheet plus a small script that rearranges the live home DOM. Nothing in `app/` changes. Serve the repo root and open the preview:

```
python3 -m http.server 8000
# http://localhost:8000/docs/design/home-signal/preview.html#C-front-panel
```

The pill at the bottom left switches between Today, A, B and C.

## If one is picked

- The DOM moves in the option's `.js` become markup in `app/index.html`. The `.css` moves into `app/css/field-unit.css` with the `.hs-*` scope removed, and the image path becomes `../../img/`.
- docs/DESIGN-field-unit.md needs a "Home" entry saying that key colours may mark the ways in, with the same fixed meaning as the drawer keys, and that the signal is still only Start match.
- The night (Kiln) theme has been checked for all three; C is shown in `screens/C-front-panel-desktop-night.png`.
