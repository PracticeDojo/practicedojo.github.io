# Practice Dojo v2 — User Test Protocol

**A/B setup:** `practice_dojo.html` = untouched original (A). `practice_dojo_v2.html` = this change set (B).
Open both side by side when a check says "compare".

**Scope of v2** (from `/impeccable critique` → harden + polish + audit fixes):
1. All native browser `confirm/prompt/alert` dialogs replaced with styled in-app dialogs
2. Timeline node delete now has an Undo toast (no more silent one-tap destruction)
3. Keyboard + screen-reader access: cards focusable, context menus are real buttons, Escape closes things
4. Multiverse tree, toasts, auto-save list ported from legacy purple/gray Tailwind onto the design tokens
5. Bookmark colors route through `--p1`/`--p2` tokens (follow the Tweaks palette)

> ⚠️ Compatibility note: v2 saves bookmark colors as `var(--p1)`-style token references. A session exported
> from v2 and imported into the OLD file will show default-colored node borders (nothing breaks, colors just
> fall back). Old sessions imported into v2 are fine — legacy hex colors are mapped onto tokens at render.

---

## 1. Styled dialogs (harden)

- [ ] **Game over:** play a branch to 20 lore (tip: Quest-all with a loaded board, or `Q` hotkey repeatedly).
      Expect: after ~0.5s a styled in-app dialog with trophy icon, "<winner> wins the branch!", a turn/lore
      stat line, buttons **View Multiverse** / **Stay Here**. NOT a gray browser confirm box.
- [ ] "View Multiverse" opens the tree zoomed out. "Stay Here" just closes. Escape = Stay Here. Enter = View Multiverse.
- [ ] **Cloud save name:** sidebar → Save to Cloud. Expect styled dialog with a text input + placeholder,
      **Save** disabled-ish behavior: clicking Save with empty input just refocuses the field. Cancel and
      Escape both abort without saving.
- [ ] **Error dialog:** go offline (DevTools → Network → Offline), then Save to Cloud with a name.
      Expect styled red-accented dialog "Cloud save failed" with a recovery sentence — not `alert()`.
- [ ] **Bad import file:** import a random `.json` (e.g. `{}`) via Import Session. Expect styled
      "Invalid session file" / "Couldn't read file" dialog.
- [ ] While any dialog is open: press `Space`, `Q`, `M` — the game must NOT end turn / quest / open tree.

## 2. Node delete guard (harden)

- [ ] Open Multiverse (`M`), delete a middle node (trash icon). Node disappears, children re-attach to
      grandparent, and a toast appears: `Deleted "<name>"` with an **Undo** pill.
- [ ] Click **Undo** within ~8s. Expect: node returns, children re-attach to it, tree redraws correctly.
- [ ] Delete the node you are currently ON (active node). Expect active pointer moves to its parent;
      Undo restores it as active.
- [ ] Delete an auto-save from the drawer list. Same Undo toast behavior.
- [ ] Let an Undo toast expire without clicking. Deletion sticks after reload (localStorage).

## 3. Keyboard & screen reader (audit)

- [ ] Click the board background once, then press `Tab` repeatedly. Cards on field/hand/inkwell receive a
      visible amber focus ring.
- [ ] With a card focused, press `Enter` or `Space`. Its context menu opens centered on the card.
- [ ] In the open menu: `ArrowDown`/`ArrowUp` cycle items, `Enter` activates, `Escape` closes.
- [ ] Menu items are real `<button>`s: in DevTools, inspect `#context-menu` children → `button.ctx-item`.
- [ ] Press `Escape` with these open (one at a time): context menu, tree modal, inspect deck, inspect
      discard, import log, card search. Each closes. Mulligan/Craft Hand intentionally do NOT close on Escape.
- [ ] With a button focused (e.g. a context-menu item), `Space` activates the button — it must NOT end the turn.
- [ ] `Ctrl+T` / other browser combos no longer trigger game hotkeys (modifier guard).
- [ ] Optional (NVDA/VoiceOver): cards announce name + state ("… exerted, 2 damage"); modals announce their titles.

## 4. Multiverse tree redesign (polish)

- [ ] Open Multiverse (`M`). **Compare vs A:** header, background, and nodes now match the app's warm dark
      token look — no purple Tailwind theme.
- [ ] Nodes: colored left edge + subtle tint = active player's identity color (P1 warm amber, P2 cyan).
      Lines between nodes match the child node's color.
- [ ] Active node shows an amber ring; arrow-key navigation ring (white outline) still works.
- [ ] Node title button restores the timeline; pencil opens inline edit (token-styled inputs + Cancel/Save);
      trash deletes with Undo (section 2).
- [ ] "Cards Played" strip on auto-save nodes renders thumbnails, scrolls if many.
- [ ] Empty multiverse (fresh session, no saves): italic "The Multiverse is empty…" hint, token gray.
- [ ] **Victory node (multi-ink winner):** win a branch with a 2-color deck. The "Game Over" node shows a
      trophy icon (gold), a 4px vertical deck-ink **gradient strip** on the left edge (rounded corners
      intact — no square border-image artifacts), and a subtle gradient tint across the node body.
- [ ] **Victory node (mono-ink winner):** win with a single-color deck (or fill a test deck with one ink).
      Same trophy treatment, edge strip in that ink's solid color.
- [ ] Victory node from an OLD session import: renders with trophy + gradient (detected via stored gradient);
      its connector line is victory gold, not white.
- [ ] **Palette test:** Tweaks panel → switch palette. NEW nodes created after the switch follow the new
      P1/P2 colors; old v2 nodes follow too (they store token refs). Nodes from imported OLD sessions
      keep mapped colors.
- [ ] Toasts (any action): dark pill with amber clock icon top-center — no purple pill. **Compare vs A.**
- [ ] Time-jump flash on restore is a soft amber wash, not purple.
- [ ] Auto-save list in the Timelines drawer: token-styled cards, hover shows "Restore Auto-Save" overlay;
      keyboard: Tab to an item, Enter restores.
- [ ] Setup screen with an existing session: "Restore Auto-Save" button is the standard primary button
      (amber), not an emerald gradient.

## 5. Mobile 360px (hard requirement — regression pass)

Set DevTools to 360×800, touch emulation on.

- [ ] Game-over / save / error dialogs fit the screen with margins; buttons tappable; input focusable
      without zoom weirdness.
- [ ] Undo pill on toasts is tappable with a thumb.
- [ ] Tree modal: header fits (hint text hidden), pan/pinch still work, node buttons (restore/edit/delete)
      respond to taps, tapping a node does not pan the canvas.
- [ ] Long-press a card → context menu items are comfortably tappable (they're buttons now).
- [ ] Sidebar drawer + Timelines drawer open/close as before (dead legacy class was removed — verify no
      drawer gets stuck open after restoring a timeline or importing a session).

## 6. General regression sweep

- [ ] Full game loop: draw, ink, play, quest, challenge-drag, end turn (`Space`), undo — unchanged vs A.
- [ ] Import a session exported from A into B. Tree renders, colors mapped, restore works.
- [ ] Auto-save-on-turn toggle still creates nodes each turn with recap comments.
- [ ] Reload mid-game: session restores from localStorage; no console errors on boot (F12 → Console).

---

**If B passes:** replace `practice_dojo.html` with the v2 content (or keep v2 as the live page) — your call.
**If something fails:** note the checkbox + what you saw; the original A is untouched.
