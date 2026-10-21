---
name: stream-to-log
description: Watch a recorded or streamed Disney Lorcana match (a video file, a YouTube / Twitch VOD, a direct .mp4 or .m3u8 URL) and write a turn-by-turn log of it in the Duels.ink "You / Opponent" text format, which the Practice Dojo imports (Import log). Use when someone wants a match from a video, stream or VOD turned into a Dojo game, a match log, or a multiverse to study. Pulls timestamped frames and contact sheets with ffmpeg, looks up exact card names, and checks the log against the app's own importer before it is handed over.
---

# Stream to log

You watch the match through still frames and write the log by hand, one line per
action. Two scripts in this folder do the rest:

- `frames.mjs` grabs frames from the video with ffmpeg: a series every N seconds plus
  contact sheets with each cell stamped with its time, or single full-size frames
  (`--at`) to read a card. `--crop` zooms on part of the screen.
- `check.mjs` runs your log through the Dojo's real importer (headless, through the
  `dojo-screenshots` tool) and lists everything that would import wrong. `--find`
  looks up exact card names.

`node <script> --help` (or no arguments) prints the options. Run from the repo root.
`$OUT` is your scratchpad (or `/tmp/stream-log`). Never commit frames or logs.

```bash
K=.claude/skills/stream-to-log
node $K/frames.mjs match.mp4 --every 30 --out $OUT/overview          # the whole match, 16 per sheet
node $K/frames.mjs match.mp4 --from 12:00 --to 15:30 --every 4 --out $OUT/t05   # one turn, close up
node $K/frames.mjs match.mp4 --at 12:41,13:02 --out $OUT/cards        # full-size frames
node $K/frames.mjs match.mp4 --at 12:41 --crop 600:400:1300:600 --out $OUT/cards  # zoom (w:h:x:y)
node $K/check.mjs --find "stitch" "queen hearts"                      # exact names, cost, ink
node $K/check.mjs $OUT/match.txt                                     # does it import cleanly?
```

A page URL (YouTube, Twitch …) needs `yt-dlp` (`pip install yt-dlp`). If the network
won't reach the site, ask the user for the video file.

## Workflow

1. **Overview.** Frames every 20–30 s, then Read the sheets. Find the game start, where
   each turn changes, the two decks' ink colours, and whose view the video shows.
   **You** = the player whose hand the video shows (the streamer, the bottom of a
   digital board, the near side of a table). **Opponent** = the other one. With no hand
   on screen, pick the player the casters follow and say so.
2. **Each turn.** Frames every 3–5 s across the turn, `--at` full size where a card is
   played or a challenge happens, `--crop` to read a card's name or the lore counters.
   If the client shows its own game log (Duels.ink, Lorcanito, Inktable…), crop it and
   read it: it is the best source there is.
3. **Keep a tally** as you go: lore, ink count, cards in play, damage. A quest line
   carries the lore before and after, so the counter on screen checks you each turn.
4. **Names.** Every card is its full name, `Name - Version` (actions, songs and most
   items have no version). Read the name, then `check.mjs --find` it and pick the
   version by the cost and ink colour you can see.
5. **Check** with `check.mjs` and fix everything it lists until it prints `clean`.
6. **Hand over** the `.txt` (in your scratchpad or the user's folder, not the repo) and
   tell the user: in the Dojo, **Import log**, paste it or pick the file. Say which
   turns or cards you were unsure of.

Never guess a card into the log. A card you can't read is a hidden one: `Opponent
drew a card`, `You added a card to ink`. A wrong name builds the wrong board, a hidden
one just shows face down. Keep doubts in your reply, not in the log.

## The format

The Dojo reads only the lines below (`app/index.html`, `parseDojoLog`). Real
examples: `docs/samples/new_log_20261004.txt`, `app/defaults/examples/duels-ink-log.txt`.
Anything else is dropped, and `check.mjs` says so.

```text
Your starting hand: A - V, B - V, C, D - V, E - V, F - V, G - V
You mulliganed 2 cards: A - V, C. Drew: H - V, I - V
Opponent mulliganed 3 cards
Game started!

--- Turn 1 ---
Opponent's turn begins
Opponent added Card - V to ink
Opponent played Card - V (cost 2)
Opponent ended their turn

--- Turn 2 ---
Your turn begins
Draw step
You drew Card - V
You added Card - V to ink
You played Card - V (cost 3)
You quested with Card - V (+2 [LORE], 0 -> 2)
You challenged Defender - V with Attacker - V | 3 [STRENGTH] dealt 3 dmg to Defender - V (3/3 [WILLPOWER] - banished!), took 1 dmg (1/4 [WILLPOWER])
Defender - V was banished
You sang Song Name with Singer - V
You ended your turn
```

- **Turns** count both players: 1, 2, 3 … Each starts `--- Turn N ---` then
  `Your turn begins` or `Opponent's turn begins`. The first player doesn't draw on turn 1.
- **Draws:** `Draw step` then `You drew Card - V` (or `You drew 2 cards: A - V, B - V`).
  The opponent's are always hidden: `Opponent drew a card`, `Opponent drew 2 cards`.
- **Ink:** `You added Card - V to ink`. Ink from the top of the deck:
  `A card was put into their inkwell` (or `your`).
- **Play:** `You played Card - V (cost N)`. A song sung instead of paid for is
  `You sang Song with Singer - V` (several singers: `with A - V, B - V`), not a play.
- **Quest:** `You quested with Card - V (+N [LORE], before -> after)`. The lore part is
  required.
- **Challenge:** the **defender comes first**: `challenged Defender with Attacker`. After
  `|` the damage totals in brackets set each card's damage (`(3/3 …)` = 3 damage on a
  3-willpower card); without them only the attacker is exerted. Then
  `Card - V was banished` for each card that leaves.
- **Other moves:** `You discarded Card - V` · `You boosted Card - V (1 card under)` ·
  `A card was put under Card - V` · `Card - V was returned to your deck` (or
  `Opponent's deck`) · `Card - V's ABILITY returns Other - V to hand` ·
  `Moved 2 damage counters from A - V to B - V` · `You activated ABILITY on Card - V` ·
  `You revealed Card - V (ABILITY) - put into hand` ·
  `Set step: Location - V grants You +2 [LORE] (8 -> 10)`.
- **Took it back:** `You took back their action` removes that player's last line.
- **End:** `You won with 20 [LORE]!` (or `Opponent won …`).
- Opening hand not on screen? Fill `Your starting hand:` from what you saw played,
  inked or discarded early that you never saw drawn, and say so. Draws you can't read are
  `You drew a card`.
- Steps, timers and `You ended your turn` are optional narration.
