# Plan: New Log Format Compatibility (v2 "You/Opponent" Perspective)

## Context

Duels.ink changed its log export format. The old format ("v1") named both players explicitly (`Player 1`, `Player 2`) and revealed both players' draws. The new format ("v2") uses a first-person perspective (`You` / `Opponent`) and **hides the opponent's drawn cards**. This is a privacy/UX change on Duels.ink's side.

The existing `parseDojoLog` → `buildSessionFromLog` pipeline was written only for v1. This plan updates it to handle v2 logs while remaining fully backward compatible with v1.

---

## Format Diff Summary

| Aspect | v1 (old) | v2 (new) |
|--------|----------|----------|
| Your opening hand | `Player 1's starting hand: A, B, C` | `Your starting hand: A, B, C` |
| Opponent opening hand | `Player 2's starting hand: A, B, C` | **NOT SHOWN** |
| Your mulligan | `Player 1 mulliganed N cards: X. Drew: Y` | `You mulliganed N cards: X. Drew: Y` |
| Opponent mulligan | `Player 2 mulliganed N cards: X. Drew: Y` | `Opponent mulliganed N cards` (count only, no cards!) |
| Turn begins | `Player N's turn begins` | `Your turn begins` / `Opponent's turn begins` |
| Your draws | `Player 1 drew X` / `Player 1 drew K cards: A, B` | `You drew X` / `You drew K cards: A, B` |
| **Opponent draws** | `Player 2 drew X` (card name visible!) | `Opponent drew a card` / `Opponent drew N cards` (**hidden!**) |
| Ink | `Player N added X to ink` | `You added X to ink` / `Opponent added X to ink` |
| Play | `Player N played X (cost N)` | `You played X (cost N)` / `Opponent played X (cost N)` |
| Quest | `Player N quested with X (+N, old->new)` | `You quested with X` / `Opponent quested with X` |
| Challenge | `Player N challenged X with Y` | `You challenged X with Y` / `Opponent challenged X with Y` |
| Timer | `Player N's timer started` | `Your timer started` / `Opponent's timer started` |
| End turn | `Player N ended Player N's turn` | `You ended your turn` / `Opponent ended their turn` |
| Set step lore | `Set step: X grants Player N +2 [LORE]` | `Set step: X grants You/Opponent +2 [LORE]` |

**Key implication:** In v2, "You" is always the log owner (mapped to `players[0]` / P1 internally). "Opponent" is always `players[1]` / P2. The opponent's hand cards are never named in v2 — only their field, inkwell, and discard are knowable.

---

## Player Mapping for v2

- `You` → `players[0]` (always index 0, the local/log-owner player)
- `Opponent` → `players[1]`
- Who goes first: determined by Turn 1's `Your turn begins` (→ you go first, `activePlayerIndex = 0`) vs `Opponent's turn begins` (→ opponent goes first, `activePlayerIndex = 1`)

---

## Changes Required

### 1. `parseDojoLog` — Format Detection

At the top of the function, detect which format the log uses:

```js
const isV2 = /^Your starting hand:/m.test(logText) || /^Your turn begins/m.test(logText) || /^Opponent's turn begins/m.test(logText);
```

Store this on the returned object: `return { players, turns, format: isV2 ? 'v2' : 'v1' }`.

---

### 2. `parseDojoLog` — New Line Patterns for v2

Add these patterns **before** (or alongside) the existing v1 patterns. Use early-`continue` so they short-circuit cleanly:

#### Opening hand (v2)
```
/^Your starting hand:\s*(.+)$/
→ players[0].openingHand = splitCards(m[1])
```

#### Mulligan (v2)
```
/^You mulliganed \d+ cards?:\s*(.+)\.\s*Drew:\s*(.+)$/
→ players[0].mulliganedCards = splitCards(m[1])
→ players[0].drawnAfterMulligan = splitCards(m[2])

/^Opponent mulliganed (\d+) cards?$/
→ players[1].opponentMulliganCount = parseInt(m[1])
  (No cards are listed — opponent hand stays unknown)
```

#### Turn begins (v2)
```
/^Your turn begins$/         → currentTurn.activePlayerIndex = 0
/^Opponent's turn begins$/   → currentTurn.activePlayerIndex = 1
```

#### Draws (v2)
```
/^You drew (.+)$/                            → push m[1] to currentTurn.draws (active p=0)
/^You drew \d+ cards?:\s*(.+)$/              → push each of splitCards(m[1])
/^Opponent drew a card$/                     → push '__UNKNOWN__' to currentTurn.draws (hidden draw, p=1)
/^Opponent drew (\d+) cards?$/               → push N '__UNKNOWN__' entries (no names given)
```

> `'__UNKNOWN__'` is the sentinel string used throughout for hidden/unresolvable cards. It already exists as `makeUnknownCardInstance()` in `buildSessionFromLog`.

#### Ink, Play, Quest, Challenge (v2)
These are the same as v1 but with `You`/`Opponent` instead of `Player N`:
```
/^You added (.+) to ink$/                                         → inked for p=0
/^Opponent added (.+) to ink$/                                    → inked for p=1
/^You played (.+?) \(cost \d+\)$/                                 → played for p=0
/^Opponent played (.+?) \(cost \d+\)$/                            → played for p=1
/^You quested with (.+?) \(\+\d+.*?,\s*(\d+)\s*->\s*(\d+)\)$/    → quest for p=0
/^Opponent quested with (.+?) \(\+\d+.*?,\s*(\d+)\s*->\s*(\d+)\)$/ → quest for p=1
/^You challenged (.+?) with (.+?)(?:\s*\|.*)?$/                   → challenge {attacker, target, playerIdx:0}
/^Opponent challenged (.+?) with (.+?)(?:\s*\|.*)?$/              → challenge {attacker, target, playerIdx:1}
```

> Note: ink/play/quest/challenge for the opponent are parsed into the same `currentTurn` arrays but with the correct `playerIdx`. This differs from v1, where all actions were implicitly for the active player only. The builder already uses `playerIdx` on quest/challenge, and `activePlayerIndex` for ink/play — this needs a small fix (see §4 below).

---

### 3. `parseDojoLog` — Final Hand for v2

After all lines are parsed, in the "build final hands" block at the bottom:
```js
// v2: opponent's hand is unknown — initialize as 7 unknown sentinels
// (standard 7-card start; mulligan replaces cards so count stays 7)
if (isV2) {
    players[1].finalHand = Array(7).fill('__UNKNOWN__');
}
```

For `players[0]` (You) in v2 the existing logic already works because we have the real opening hand and mulligan cards.

---

### 4. `buildSessionFromLog` — Fix Ink/Play Attribution for v2

Currently `inked` and `played` in `currentTurn` only contain the **active player's** actions. In v2 we're storing opponent actions in those arrays too (with opponent `playerIdx`). Two options:

**Option A (cleanest):** Store actions per-player instead of per-turn-active-player:
- Change the per-turn structure to `played: [[], []]` and `inked: [[], []]` (indexed by player)
- v1 still fills `played[activePlayerIndex]`; v2 fills the correct index per action

**Option B (minimal diff):** Keep the flat arrays but add a `playerIdx` field to each ink/play entry (similar to how quested/challenged already work):
```js
currentTurn.inked.push({ name: 'Card Name', playerIdx: 0 })
currentTurn.played.push({ name: 'Card Name', playerIdx: 0 })
```
Then update `buildSessionFromLog` to use `.playerIdx` instead of `t.activePlayerIndex` when processing inks and plays.

**Recommendation: Option B** — least refactor surface, keeps the existing shape, just adds the `playerIdx` field. For v1 logs, all entries will have `playerIdx === t.activePlayerIndex` (same as before). For v2, opponent actions during opponent turns will have `playerIdx: 1`.

Migration:
- v1 parse: change `currentTurn.inked.push(m[2].trim())` → `currentTurn.inked.push({ name: m[2].trim(), playerIdx: currentTurn.activePlayerIndex })`
- v2 parse: same but with explicit 0 or 1
- `buildSessionFromLog` processing: `for (const item of t.inked) { const p = item.playerIdx; ... }`

---

### 5. `buildSessionFromLog` — Opponent Unknown Hand Handling

With v2, `hands[1]` (opponent) is initialized from `players[1].finalHand` which is `Array(7).fill('__UNKNOWN__')`.

When removing from `hands[1]` during ink/play processing:
```js
// Current code:
removeFirst(hands[p], cardName);

// Must become (for unknown hand slots):
const removeFromHand = (handArr, name) => {
    const idx = handArr.indexOf(name);
    if (idx !== -1) { handArr.splice(idx, 1); return; }
    // Fallback: remove any unknown slot (card was in hand, we just didn't know which slot)
    const unkIdx = handArr.indexOf('__UNKNOWN__');
    if (unkIdx !== -1) handArr.splice(unkIdx, 1);
};
```

When building hand card instances (in `buildPlayerState`):
```js
hand: hands[p].map(name => {
    if (!name || name === '__UNKNOWN__') return this.makeUnknownCardInstance();
    const dbCard = this.resolveCardName(name);
    return this.makeCardInstance(dbCard ? dbCard.id : -999);
}),
```
This is an extension of the existing logic (which already handles `dbCard === null`), so minimal change.

---

### 6. `buildSessionFromLog` — Deck for Unknown-Draw Players

For the opponent in v2, all draw entries in `allDraws[1]` will be `'__UNKNOWN__'`. The existing `buildDeckForSnapshot` already handles this:

```js
if (i < futureDraws.length) {
    const dbCard = this.resolveCardName(futureDraws[i]);  // returns null for '__UNKNOWN__'
    deck.push(this.makeCardInstance(dbCard ? dbCard.id : -999));
}
```

`resolveCardName('__UNKNOWN__')` will return `null` → `makeCardInstance(-999)` → unknown placeholder. This already works correctly. No change needed here.

---

### 7. `buildSessionFromLog` — knownCards for Opponent (v2)

For v1, `knownCards[1]` accumulated opening hand + mulligan + draws + inks + plays — used for `buildDeckString`.

For v2, opponent's known cards are only: **played cards + inked cards** (draws are hidden). The current code adds drawn cards to `knownCards`:
```js
for (const cardName of t.draws) {
    hands[p].push(cardName);
    drawnPointers[p]++;
    knownCards[p].push(cardName);  // ← this will push '__UNKNOWN__' for opp in v2
}
```

Fix: filter out `'__UNKNOWN__'` before pushing to `knownCards`:
```js
if (cardName !== '__UNKNOWN__') knownCards[p].push(cardName);
```

---

### 8. `buildSessionFromLog` — Bookmark Comment Filtering for v2

The `SKIP_PATTERNS` list strips boilerplate lines from the turn comment. Add v2 patterns:

```js
/^Your turn begins$/,
/^Opponent's turn begins$/,
/^Your timer started/,
/^Opponent's timer started/,
/^You gained \d+ seconds/,
/^Opponent gained \d+ seconds/,
/^You ended your turn$/,
/^Opponent ended their turn$/,
/^Ready step/,
/^Set step$/,
/^Draw step$/,
/^Game started!$/,
/^You requested an undo$/,
/^You took back their action/,
```

Also update the prefix-strip regex in `.map()`:
```js
// Current: removes "Player N " prefix
.map(l => `- ${l.replace(/^Player \d+ /, '')}`)

// Updated: also remove "You " and "Opponent " prefixes
.map(l => `- ${l.replace(/^(?:Player \d+|You|Opponent) /, '')}`)
```

---

### 9. `validateDojoLog` — Accept v2 Format

Current check:
```js
const hasOpeningHand = /^Player \d+'s starting hand:/m.test(text);
```

Update to:
```js
const hasOpeningHand = /^(?:Player \d+'s|Your) starting hand:/m.test(text);
```

Also update the `ok` message to mention the format:
```js
const fmt = /^Your starting hand:/m.test(text) ? ' (v2 perspective)' : '';
return { valid: true, level: 'ok', message: `Valid Duels.ink log detected${fmt} — ${turnCount} turn${...} found.` };
```

---

## Files to Change

Only one file: `practice_dojo/practice_dojo.html`

Affected functions (all within the same `App` object):
1. `parseDojoLog` (~line 1952) — main parsing logic
2. `buildSessionFromLog` (~line 2102) — state reconstruction
3. `validateDojoLog` (~line 2365) — format validation

---

## Edge Cases

| Case | Handling |
|------|----------|
| Opponent draws 3 cards (hidden) | Push 3 `'__UNKNOWN__'` to draws; all become unknown instances |
| Opponent opening hand | Init as `Array(7).fill('__UNKNOWN__')` — always 7 after mulligan in standard play |
| Opponent mulligan (no card names) | Just record the count; hand stays all-unknown (7 → replaces N → still 7) |
| Opponent plays a card not yet in knownCards | Correctly adds to field AND to knownCards for deck string |
| v1 log loaded after this change | Fully backward compatible — v1 regex patterns unchanged, Option B keeps v1 ink/play working |
| Mixed/ambiguous log | `isV2` flag set conservatively; if no `Your`/`Opponent` pattern found, treated as v1 |
| Chat messages in v2 (`You: "..."`) | No action pattern matches — will appear in comment as boilerplate (fine) |

---

## Version Bump

Per AGENTS.md: increment MINOR since this is new feature functionality.
- Current version: check `APP_VERSION` in `practice_dojo.html`
- Bump to next MINOR (e.g. if currently `v1.16.x` → `v1.17.0`)

---

## Verification Steps

1. Load `practice_dojo.html`, open Import Log modal
2. Paste `logs/log_example_v01.md` (v1) → confirm still imports correctly, 34 turns, both players' hands visible
3. Paste `logs/new_log_style_v01.md` (v2) → confirm 34 turns, badge shows "v2 perspective"
4. In v2 import: check Turn 1 state → P1 (You) hand shows real cards, P2 (Opponent) hand shows all card-backs
5. Check a mid-game node (Turn 15) → opponent's field shows `Tinker Bell - Giant Fairy` + `Sail the Azurite Sea` in inkwell (visible from log)
6. Check opponent's deck in inspect view → all unknown card-backs (no named cards in deck)
7. Check P1 deck → known future draws appear at the top
8. Verify version number updated in UI
