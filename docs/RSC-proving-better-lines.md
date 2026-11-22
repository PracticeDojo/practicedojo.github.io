# Proving better lines: TLA+, Lean, or the engine itself

Research only. Nothing here is built. Written 2026-11-22, on `main` at v3.23.1.

**Asked (the owner):** explore how TLA+ and/or Lean could be used when we look for better lines, so that we can *prove* there were, or weren't, better moves.

Terms used here:
- **TLA+** is a language for describing a system as states and the steps between them. Its model checker, **TLC**, visits every reachable state and either proves a property holds in all of them or prints the steps to a state where it fails (a **counterexample**). AWS uses it to check its designs.
- **Lean** is a proof assistant: you write definitions and proofs, and Lean checks each step of each proof. Mathematics (Mathlib) and verified software use it.
- **Exhaustive search** looks at every legal line, not just the best few. A **beam** (what Proposed plays and What-if use today) keeps the best 6 lines at each step and drops the rest.
- A **witness** is the line itself, offered as evidence that a better line existed.

---

## 1. Verdict

- **We can prove narrow, exact claims, and that is worth doing.** For example: "no line wins this turn", "here is the line that wins", or "whatever they do with the cards in play, they can't reach 20 next turn".
- **"There was no better move" can't be proved in general.** "Better" by the score is a guess with tuned weights, so a proof about the score proves nothing about the game. Only results (a win, a loss, lore reached) can be proved. Hidden cards and the opponent's choices multiply the lines past what any machine can search after a turn or two (§5).
- **TLA+ and Lean aren't the tool for game positions.** Both need the rules written out again in their language, every card included: about 3,440 cards. The study already rejected writing our own engine (`RSC-lorcana-engine.md` §10). Two rule sets would also disagree, and the proof would cover the copy, not the engine the Dojo uses. The toy spec in §3 shows the cost: a few lines per card for a board of 2 characters and 2 cards.
- **The engine can be its own model checker.** What TLC does (visit every state, merge repeats, report a counterexample or "none") is what the engine's search does once the beam is taken off. Measured on the Set 14 demo (§4): a whole turn is a median of **108 positions and 2.6 s**, at most 7,878 positions and under 6 min (2 of 76 boards didn't finish in 20,000 nodes). The shipped 300-node beam found **every win this turn the full search found** (15 of 15), but ended on a worse board than the best, by its own score, on **21 of 74** (by more than a point on 14).
- **Where TLA+ does pay:** the app's parts that run at the same time (§6). AWS's lesson is about designs like that, not about games.
- **Lean:** not now (§6).

## 2. Two kinds of claim

| Claim | Kind | What proves it | Today |
|---|---|---|---|
| "There was a better line" | there is one | The line itself (a witness), replayed in the engine | What-if does this: each line is a branch you can replay. It's as good as the engine's rules and its guess of their moves |
| "There was no better line" | none exists | Every legal line looked at, none better | Not done: the beam drops lines |

"Better" has to be a result for either to mean anything:

| Question | Hidden information | Exact? |
|---|---|---|
| **Lethal:** can I reach 20 this turn? | My draws this turn, if a card draws | Yes, if no card draws mid-turn, or the deck order is known (a replay, or the Dojo's deck "as set") |
| **Safe:** can they reach 20 next turn, whatever they do with the cards in play? | Their hand, their draw | Yes for the cards in play; their hand can only make it worse, so "safe" must say "from the cards in play" |
| **Hindsight win** (What-if): with the cards that actually came, did a line win in N turns, whatever their replies with the cards they had? | None: a replay knows the draws, and by its end most of their hand | In principle; the cost explodes past 1–2 turns (§5) |
| **Best by the score** | None: the score ignores hidden cards | It proves "best for these weights". Useful for testing the beam (§4), not as a claim about the game |

## 3. A turn in TLA+ (the toy)

A made-up board: 14 lore, 3 ink, Vixey (quests for 2, cost 3) and Beast (quests for 1, cost 5) ready, and in hand a song that costs 4 ("gain 3 lore") and a spare inkable card. The whole spec:

```tla
---- MODULE LethalTurn ----
EXTENDS Naturals
CONSTANT StartLore
VARIABLES lore, ink, inked, hand, ready
vars == <<lore, ink, inked, hand, ready>>

Chars     == {"Vixey", "Beast"}
QuestLore == [Vixey |-> 2, Beast |-> 1]
Cost      == [Vixey |-> 3, Beast |-> 5]   \* a character can sing a song that costs no more than it does
SongCost  == 4
SongLore  == 3                            \* the toy song: "gain 3 lore"

Init == /\ lore = StartLore /\ ink = 3 /\ inked = FALSE
        /\ hand = {"Song", "Spare"} /\ ready = Chars

InkSpare == /\ ~inked /\ "Spare" \in hand
            /\ hand' = hand \ {"Spare"} /\ ink' = ink + 1 /\ inked' = TRUE
            /\ UNCHANGED <<lore, ready>>
Quest(c) == /\ c \in ready
            /\ ready' = ready \ {c} /\ lore' = lore + QuestLore[c]
            /\ UNCHANGED <<ink, inked, hand>>
PaySong  == /\ "Song" \in hand /\ ink >= SongCost
            /\ hand' = hand \ {"Song"} /\ ink' = ink - SongCost /\ lore' = lore + SongLore
            /\ UNCHANGED <<inked, ready>>
Sing(c)  == /\ "Song" \in hand /\ c \in ready /\ Cost[c] >= SongCost
            /\ hand' = hand \ {"Song"} /\ ready' = ready \ {c} /\ lore' = lore + SongLore
            /\ UNCHANGED <<ink, inked>>

Next == InkSpare \/ PaySong \/ \E c \in Chars : Quest(c) \/ Sing(c)
Spec == Init /\ [][Next]_vars
NoLethal == lore < 20   \* broken = a winning line; holds = proof there is none (in this model)
====
```

TLC 1.8.0 (checked with `INVARIANT NoLethal`, deadlock check off):
- **StartLore 14:** "Invariant NoLethal is violated", and the line: ink the spare, pay 4 for the song (17), quest Vixey (19), quest Beast (20). Singing with Beast is the trap: it exerts Beast, so the best is 19.
- **StartLore 13:** "No error has been found", 16 distinct states. That is a proof that no line reaches 20, *in this model*.

What it shows:
- The method is right: every state, repeats merged, a line or "none".
- Each card is code someone writes, and gets wrong. A real board has 10–30 cards with triggered abilities, bags, choices, shift, locations and modifiers. The engine already has all of that, with about 2,865 card test files upstream.
- Generating TLA+ from the engine's card data would mean writing the engine's effect system in TLA+: the same rewrite.

## 4. The engine as the model checker (measured)

The worker's `explore` op already takes the search's limits. With every limit lifted (`beam` and `perNode` unbounded, `depth` 60, no reply, no bot finish, 20,000 nodes at most), it visits every position the engine's candidate list reaches in the rest of the turn, merging positions reached twice. That is TLC's method on the real rules. The shipped search (300 nodes) was run on the same boards with the same objective (the end-of-turn score, no reply), so the two can be compared. To repeat it, load the bundle in Node as `tools/engine-spike.mjs` does, then for each demo board (`DojoRules.boardFromState`):

```js
DojoEngine.explore({ board, nodes: 300, timeMs: 1e9, lines: 1, weights: { reply: 0 } });                       // shipped
DojoEngine.explore({ board, beam: 1e9, perNode: 1e9, depth: 60, nodes: 20000, timeMs: 1e9, lines: 1,
                     weights: { reply: 0 }, finish: false });                                                  // full
```

Measured in Node 22 on the vendored engine (`6de59de`), the 76 boards of the Set 14 demo, 4 jobs at once on 4 cores (each time is one core's; a node took 14 ms at the median):

| | Shipped beam (300 nodes) | Full search |
|---|---|---|
| Finished | 76 of 76 | 74 of 76: boards 8 and 22 stopped at 20,000 nodes (5,467 and 7,406 positions) |
| Nodes (candidates tried) | median 60, max 206 | median 232, 90% at most 4,808, max 19,936 |
| Positions | | median 108, 90% at most 1,866, max 7,878 |
| Time | 1.0 s median on a desktop (handover §3) | median 2.6 s; every board under 100 positions (37) under 3.4 s; 90% at most 71 s; max 341 s |
| A line wins this turn | 15 boards | the same 15 |
| No candidate line wins | | 59 boards |
| Best end of turn below the full search's | 21 of 74; by more than 1 point on 14; at most 9.1 | |

What it says:
- **A whole turn is small.** Once repeats are merged, half the boards have about 100 positions or fewer; the biggest that finished had 7,878. A lethal check is affordable: seconds on most boards, minutes on the busiest. It must run in the background with progress, and on a phone it needs a cap that says "not settled" rather than guessing.
- **The beam found every win the full search found.** On 15 boards a line wins this turn, and the shipped search found all 15. On 59 boards no candidate line wins. That is a claim the search could make once the gaps in §4.1 are closed.
- **The beam misses good turns.** On 21 boards it ended on a worse board, by its own score. Board 5 (turn 3, 0–1): the beam challenges with Angel and plays Max Goof (−0.07). The best is 11 steps: ink Max Goof, play Akood et Emuti, Don Karnage for free, sing Akood et Emuti with Angel, then Tod and two Max Goofs for free (+2.82). Its first steps score low, so a 6-line beam drops it before it pays. The study warned of this (§8, "the beam can miss deep combos"); now it's counted.
- **A capped search proves nothing.** Board 8 stopped at 20,000 nodes on a best 0.26 *below* the beam's: the cap cut it before it reached the beam's line.

### 4.1 What stops it being a proof today

The full search above is exhaustive **within the engine's candidate list**. Five gaps stand between it and a proof, each small:

1. **Inks are capped:** `search()` tries at most 2 ink candidates per position ("the strategy's two favourites will do"). A proof mode must try them all. That multiplies the positions by up to the number of inkable cards in hand, once (you ink once a turn; the merge already folds the order of inking away). Not measured.
2. **Targets are capped:** the bot's candidates stop at 8 targets a prompt (handover gotcha 18). Pass `EVERY` as What-if's `realTurn` does.
3. **Moves the bot never lists:** Bodyguard's exerted entry, playing from the discard (gotcha 13), paying with ink drops (gotcha 19). A proof that misses a legal move is wrong. Either add them to the candidates or say which moves a claim doesn't cover.
4. **Their choices during my turn are the bot's** (`settle` takes their first candidate). For "no line wins", every choice of theirs must be tried, and my line wins only if it wins against each one.
5. **The merge can join different positions.** `positionKey` counts the continuous effects but doesn't compare them, and leaves out most of the turn's records (`cardsPlayedThisTurn`, `pendingCostReductionsByPlayer`, `challengesByPlayerThisTurn`, …). Two positions that differ only there are merged, and the second is never searched. That's fine for a beam, not for a proof. A proof mode needs a key built from the whole state (engine ids aside).

And one that no tool removes: **the proof is only as right as the engine's rules.** Our evidence they're right is upstream's card tests, and What-if's check that a replay of the real game ends as it did (exact from most turns tried in the owner's games; where it isn't, the drift has been a bug in the import or the engine, handover gotchas 16–21).

**A check anyone can re-run.** The search is deterministic (a node budget, not the clock), so the same board gives the same answer on any device. A proof could also list the positions it visited (a hash for each, with its children), so a second run can confirm each step. This is the same idea as Lean checking each step of a proof, without Lean.

## 5. Why not "no better move, ever"

- **Their turn too:** one turn is up to 7,878 positions here. To say "nothing won in 2 turns" you search my turn, then their whole turn from each of my ends (every reply), then mine again: the product, before hidden cards.
- **Hidden cards:** in a live game, their hand and both decks are unknown. Each draw and each possible hand splits the search again. "Whatever they hold" can only be bounded by what's visible.
- **The score:** past a win or a loss, "better" is the score's opinion. Proving the best line by the score proves the weights, which `engine-tune.mjs` tunes against the bot, not the game.

So the claims worth proving are the short ones: this turn, and their next turn from what's in play.

## 6. Where TLA+ and Lean do fit

**TLA+, for the app's design.** The AWS paper (Newcombe et al., *How Amazon Web Services Uses Formal Methods*, CACM 2015) used TLA+ on designs where things happen at the same time, and found bugs that needed long, unlikely orderings to show (one of DynamoDB's needed 35 steps). The Dojo has a few of those:
- the bot's late replies: `botCall` drops a reply from an older generation or for a changed board (handover gotcha 8), and a pause mustn't outlive the bot's turn;
- What-if runs: a run for a replaced game drops what it still reports; *Keep going*; a reload;
- the library and share links (`ARCH-accounts-and-library.md`): the device library and an account saving the same deck from two tabs or devices. The Stripe page on idempotent requests is the pattern: a save sent twice, after a timeout, must save once.

A spec of each is 50–150 lines, and TLC checks every ordering of a handful of steps. It's separate work from better lines.

**Lean.** Lean proves things for all inputs, but everything must be in Lean: the rules as a Lean program, then proofs about it. seL4, a verified kernel of about 9,000 lines of C, took on the order of 20 person-years of proof (in Isabelle/HOL, a tool like Lean). The engine is many times that size. One narrow use was considered: a proved upper bound on the lore left this turn, so "no lethal" needs no search. Cards that gain lore by ability break any simple bound, and the search is cheap anyway (§4). Not worth it.

## 7. Next steps (owner to choose)

1. **Lethal check** (smallest, most use): in Proposed plays and in each What-if turn back, an exact search for a win this turn, with gaps 1–5 closed for this mode only. It answers "Proved: no line wins this turn (N positions)" or shows the line. The beam stays for everything else.
2. **Safe check:** "can they reach 20 next turn from the cards in play, whatever they do?" The same search on their turn, every reply. Its claim names what it covers ("from the cards in play; their hand not known").
3. **Measure the beam against the full search**, as §4 did, on more boards (sessions, replays) and on phones. Where the beam misses, decide whether to widen it, or to run the full search when it's small.
4. **TLA+ for the bot, What-if and library sync** (§6), as its own piece of work.
5. **Lean:** skip.

## 8. The links shared

They reached me cut off (each ended in "…"), so I couldn't open them, and nothing above rests on what they say. From the names: Lean and Mathlib checking a proof (§6, Lean); AWS's formal methods (§6, TLA+); seL4 (§6, the cost); proofs for open-source libraries and the crashlens PR (not opened; not used); Stripe's idempotent requests (§6, the library).
