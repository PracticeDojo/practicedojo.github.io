# TEST PROTOCOL — Practice Dojo v2.22.0

Scope: **Feature 41 · Duels.ink text logs in both formats.** Fixtures in `docs/samples/`.

| # | Step | Expected |
|---|------|----------|
| 1 | Home screen: paste `new_log_20261004.txt` | Readout DUELS.INK LOG · "A 26-turn game" · *Study this game* |
| 2 | *Study this game* | 26 nodes; final lore 20–14; title "… (Duels.ink)" |
| 3 | Turn 2 node | Your hand has 8 cards including *Besties, Assemble!* (comma name kept whole); opponent has 1 ink |
| 4 | Turn 11 node | Your board: Alma Madrigal (1 damage), Cheshire Cat, Hamm (1 damage); no Junior Woodchuck Guidebook (banished by its ability) |
| 5 | Turn 15 node | Cheshire Cat and Ursula each have a card under them; Chernabog has 2 damage |
| 6 | Any opponent node | Opponent's hand is face-down unknown cards; cards they've played are named |
| 7 | Turn 2 node comment | Lists your plays without "You"; on your Turn 20 node "Opponent drew a card" keeps its prefix |
| 8 | Import `01a08b6d-…_p1.replay.gz` too, compare nodes | Same lore, hand, deck, ink, discard counts on every node, except turns 9–10 (Guidebook on board in the text import) and turn 18 (Chernabog exerted in the replay) |
| 9 | Paste `log_example_v01.md` (old format) | 34 nodes, final lore 21–12, both hands named |
| 10 | Paste `new_log_style_v01.md` | 34 nodes, final lore 21–12, opponent hand unknown |
| 11 | In game: Timelines → Log → paste the new log | Validates as "Valid Duels.ink log detected — 26 turns found"; imports |
