# TEST PROTOCOL — Practice Dojo v4.0.0

Scope: **Feature 64 · Two-player tables by turns** and **Feature 65 · Live tables** (`docs/ARCH-two-player.md`). Needs the migration `20261020120000_tables.sql` applied (it is, once the branch is on `main`). Use two browsers that don't share storage: a desktop (about 1440×900) as **Ann** and a phone (or a private window at 390×844) as **Bea**. Run once by day and once at night.

The same flows run headless on every push (`node tools/app-checks.mjs`, against a stand-in backend); this protocol is the real-service and real-device pass.

## A — Setting a table
| # | Step | Expected |
|---|------|----------|
| A.1 | Ann: open the Set 13 demo, press the two-people button after **Share** in the top bar | *Play with a friend* asks for a name (remembered next time) |
| A.2 | **Next**, then the side whose turn it is | *Table ready* with a `practicedojo.win/app/?t=…` link; **Copy link** copies it |
| A.3 | Close the box | The chip reads *Waiting for a player · Your turn*; the bar at the top says to send the link; the address bar has `?t=` |
| A.4 | Library | The demo copy is still there as it was; the table is a new session with a *Your turn* badge |
| A.5 | Phone: ⋯ → **Play with a friend** | The same flow; the chip is a dot after ☰ |

## B — Joining
| # | Step | Expected |
|---|------|----------|
| B.1 | Bea: open the link | *Join "…"*: who invited her, her side and its inks, her name |
| B.2 | **Join table** | The board opens on Ann's turn: Ann's hand at the bottom is face down, Bea's own hand at the top is face up; the bar says *Ann's turn. You're watching live.* |
| B.3 | Ann's chip | *Live with Bea · Your turn*, Trace dot; the sidebar names *Player 1 · …* and *Player 2 · …* with *(you)* |
| B.4 | A third browser opens the link | *This table is full* |
| B.5 | Bea reloads the page | She's back at the table without being asked again |

## C — The pen
| # | Step | Expected |
|---|------|----------|
| C.1 | Bea: click her deck, drag a card, press Space, press **End turn**, **Undo** | Nothing moves; a toast says it's Ann's turn. Hover previews and **Inspect discard** still work |
| C.2 | Bea: the Multiverse | Opens; renaming, deleting and editing notes are refused |
| C.3 | Ann draws, plays, quests | Each move shows on Bea's screen within about a second |
| C.4 | Ann holds **Reveal** on Bea's hand | Bea's bar: *Ann is looking at your hand*; the log names it |
| C.5 | Ann: **End turn** | The pen passes: Bea's chip says *Your turn*, her hand is at the bottom face up, a new node is in both Multiverses |
| C.6 | Bea: **Undo** until the turn goes back | Ann holds the pen again, on the board before her End turn |

## D — By turns
| # | Step | Expected |
|---|------|----------|
| D.1 | Bea closes her tab | Ann's chip: *Bea is away*; the dot is hollow |
| D.2 | Ann plays her turn and presses **End turn** | The bar: *Bea plays next. The table waits until they're back.* with **Copy link** |
| D.3 | Bea opens the Dojo (no link) | *Pick up again* shows the table first, with **Your turn** |
| D.4 | Bea opens it | Ann's turn is on the board and Bea holds the pen; the chip turns *Live with Ann* if Ann is still there |
| D.5 | Bea turns her network off, plays her turn, presses **End turn**, turns it back on | The chip's dot is dashed while offline; within a few seconds of reconnecting Ann has the turn |

## E — Moving the table
| # | Step | Expected |
|---|------|----------|
| E.1 | Either player: **Play from here** on an older node | The bar: *Waiting for … to go to "…"* with **Cancel**; their board doesn't move |
| E.2 | The other player: **Go there** | Both boards move there with the time flash; the board left is a "Left here" snapshot if it wasn't saved |
| E.3 | Ask again; the other player: **Stay** | The asker sees *… stayed where you are* |
| E.4 | Ask, close the other player's tab, reopen it later | The question is waiting in the bar |

## F — Leaving and seats
| # | Step | Expected |
|---|------|----------|
| F.1 | Ann: chip → **Take a copy** | A solo copy is on the board; the table stays in the Library |
| F.2 | Ann reopens the table; chip → **Free Bea's seat** | Bea's next open says she's no longer at the table, and her copy stays hers |
| F.3 | Bea opens the link again | She takes the free seat again |
| F.4 | Both: **Leave the table** | Each keeps a solo copy; after the second leave, the link says the table is no longer open |

## G — Another device
| # | Step | Expected |
|---|------|----------|
| G.1 | Bea signs in (Discord), then opens the table link on a second device and signs in there | She's at the table in her seat, without a join screen |
| G.2 | Supabase dashboard → Table Editor → `tables` | One row per open table; Storage → `tables` holds `<id>.json.gz` files |
