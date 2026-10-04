# TEST PROTOCOL — Practice Dojo v2.17.3

Scope: two mobile fixes only. No other behaviour changed.

- **Fix 1** — Inspect Discard was unreachable on touch.
- **Fix 2** — Shuffle Deck was unreachable on touch (desktop right-click only).

File under test: `practice_dojo/practice_dojo.html` (now the real monolith again — it
was a CDN loader shim before this change).

---

## Setup

1. Open `practice_dojo.html` on a phone, or DevTools device toolbar at **360×740**.
   The mobile rules live behind `@media (max-width: 760px)`.
2. Load any two decks and start a game.
3. Confirm the sidebar/setup shows **v2.17.3**.

---

## Fix 1 — Inspect Discard on mobile

| # | Step | Expected |
|---|------|----------|
| 1.1 | Look at the bottom (your) Discard pile — pile is empty | Small magnifier button visible in the pile's **top-left corner** |
| 1.2 | Discard a card from hand (drag to Discard) | Card appears in the pile **and the magnifier button is still there** ← this is the regression being fixed |
| 1.3 | Tap the magnifier | "Inspecting … Discard Pile (N Cards)" modal opens, full-screen, showing the discarded cards |
| 1.4 | Close, discard 3–4 more cards, tap magnifier again | Count in the title matches; all cards listed |
| 1.5 | Repeat 1.1–1.3 on the **top (opponent) Discard** | Same behaviour, opponent's pile |
| 1.6 | Stack 55+ cards into one discard (mill repeatedly) | Magnifier still on top of the card stack, still tappable |

## Fix 2 — Shuffle Deck on mobile

| # | Step | Expected |
|---|------|----------|
| 2.1 | Look at the bottom Deck pile | Top-left corner button is now a **vertical ellipsis (⋮)**, not a magnifier |
| 2.2 | Tap it | Context menu opens with **Inspect Deck** and **Shuffle Deck** |
| 2.3 | Tap **Shuffle Deck** | Menu closes, deck shuffles, log records it |
| 2.4 | Tap ⋮ → **Inspect Deck** | Inspect Deck modal opens as before |
| 2.5 | Tap ⋮ then tap anywhere else on the board | Menu closes, nothing else triggered |
| 2.6 | Repeat 2.1–2.3 on the **top (opponent) Deck** | Opponent's deck shuffles — this is the "shuffle this card into opponent's deck" case |
| 2.7 | Menu rows | Rows are finger-sized (~40px tall), not the desktop 26px |

## Regression checks (desktop, ≥761px)

| # | Step | Expected |
|---|------|----------|
| 3.1 | Any pile | Corner buttons are **hidden** (desktop keeps right-click) |
| 3.2 | Right-click Deck | Inspect Deck + Shuffle Deck, unchanged |
| 3.3 | Right-click Discard | Inspect Discard Pile, unchanged |
| 3.4 | Discard several cards | Stack renders offset as before, does not spill over the deck |
| 3.5 | Discard pile label | Reads "DISCARD" as before |
| 3.6 | From the Discard modal, move/play a card out | Modal auto-refreshes, board updates |

---

## Fail signals

- Magnifier disappears after the first card hits the discard → Fix 1 did not apply.
- Tapping ⋮ opens Inspect Deck directly with no menu → Fix 2 did not apply.
- Menu opens then instantly closes → the tap is bubbling to the document close handler.

---

## Addendum — discard card actions on touch

`renderInspectDiscardGrid` bound only `contextmenu` on its cards, so the modal's
cards were dead to taps. Added `click`, matching board cards.

| # | Step | Expected |
|---|------|----------|
| 4.1 | Discard 3 cards, tap the magnifier, **tap a card in the modal** | Menu opens: Play Card to Field / Return to Hand / Move to Top of Deck / Move to Bottom of Deck |
| 4.2 | Pick **Return to Hand** | Card leaves discard, enters hand, modal refreshes with the smaller count |
| 4.3 | Tap the **top card of the discard pile itself** (not the corner button) | Same 4-option menu — the 24px button must not swallow this tap |
| 4.4 | Desktop: right-click a card in the modal | Unchanged |
| 4.5 | Desktop: left-click a card in the modal | Now also opens the menu (was hover-preview only) |
