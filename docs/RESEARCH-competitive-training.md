# Research: training for competitive play

*2026-10-19 · app v3.17.4 · status: proposal, three prototypes on their own branches*

**The question.** How can the Dojo help a player learn the meta matchups faster and climb toward a competitive level?

**The short answer.** The Dojo already has what most training tools lack: a free sandbox, a branching record of every line (the Multiverse) and imports of real games (Duels.ink logs and replays). It doesn't yet have the three things the research says turn practice into improvement:

1. **Try first, then get feedback.** Today a replay shows you the answer, but studying works better when you try first.
2. **Reasoning about hidden information.** It gives odds for your own deck, but not for your opponent's hand.
3. **A record of results and mistakes.** Without one, practice can't be aimed at your weakest matchup.

Three small features close those gaps (Features 64–66). Each is a working prototype on its own branch, so it can be tried, kept or dropped.

| # | Feature | Branch | What it trains | Main evidence |
|---|---|---|---|---|
| 64 | **Their hand odds** | `claude/feat-64-their-hand-odds` | Playing around the opponent's cards | Frequency formats help people reason about chances (Gigerenzer & Hoffrage 1995; McDowell & Jacobs 2017) |
| 65 | **Hide the line** | `claude/feat-65-hide-the-line` | Finding the best line in a matchup, from real games | Serious study predicts chess skill (Charness et al. 2005); trying before feedback (Roediger & Karpicke 2006; Kornell et al. 2009) |
| 66 | **Debrief and matchups** | `claude/feat-66-debrief-matchups` | Knowing which matchups you lose and why, and aiming practice there | Debriefs d = 0.67 (Tannenbaum & Cerasoli 2013); recorded progress d = 0.40 (Harkin et al. 2016) |

---

## 1. What the research says works

No published studies of learning Lorcana exist that I could find. The evidence below comes from expertise research (mostly chess), learning science and forecasting. Each feature says how far the evidence transfers.

| Finding | Source | Size and caveats |
|---|---|---|
| **Deliberate practice:** practice aimed at specific weaknesses, with feedback and repetition, separates experts from people who just play a lot | Ericsson, Krampe & Tesch-Römer 1993 | A meta-analysis found practice explains **26%** of the variance in performance in *games*, the most of any field (music 21%, sports 18%, education 4%). It matters, but it isn't the whole story (Macnamara, Hambrick & Oswald 2014) |
| **Serious study beats just playing:** in chess, time spent alone studying positions and games was the strongest predictor of rating, more than tournament games played | Charness et al. 2005 | Two samples (N = 239 and 180, Elo 1150–2650). Grandmasters reported about 5,000 hours of serious study in their first decade, about five times as much as intermediate players. A 2019 reanalysis keeps study as a main predictor but finds other factors matter too (Burgoyne et al. 2019) |
| **Experts see patterns in real positions:** chess masters recall real game positions far better than novices, but not random ones | Chase & Simon 1973 | This is why training should use positions from real games, not made-up boards |
| **Testing yourself beats rereading** | Roediger & Karpicke 2006 | Rereading wins at 5 minutes. Testing wins clearly at 2 days and a week. Dunlosky et al. 2013 rate practice testing and spaced practice as the only two "high utility" study techniques |
| **A wrong guess still helps, if feedback follows straight away** | Kornell, Hays & Bjork 2009; Hays, Kornell & Bjork 2013 | Failed attempts followed by the answer beat simply being shown the answer. Delayed feedback lost most of the benefit |
| **Explaining why helps** | Chi et al. 1989; Bisra et al. 2018 | Meta-analysis: g = 0.55 across 64 reports |
| **Debriefs and after-action reviews** | Tannenbaum & Cerasoli 2013 | 46 samples, N = 2,136. Performance up about **20–25%** (d = 0.67), for individuals as well as teams, and for simulations as well as real tasks |
| **Recording your progress** | Harkin et al. 2016 | 138 studies, N = 19,951. Goal attainment d = 0.40, larger when progress is **written down** or reported |
| **Feedback can backfire** | Kluger & DeNisi 1996 | Average d = 0.41, but **over a third** of feedback interventions made performance worse. Feedback works when it is about the task, and fails when it is about the person (a score of *you*) |
| **Chances are easier as counts than as probabilities** | Gigerenzer & Hoffrage 1995; McDowell & Jacobs 2017 | Meta-analysis: about 24% solve a Bayesian problem posed in natural frequencies, against 4% when it's posed in probabilities. Training people to picture counts lasted longer than training a formula (Sedlmeier & Gigerenzer 2001) |
| **Worked examples help beginners, then get in the way** | Kalyuga, Ayres, Chandler & Sweller 2003 | The *expertise reversal effect*: beginners learn more from seeing solutions, while experienced learners learn more from solving |
| **Mixing practice topics** helps people tell similar categories apart | Brunmair & Richter 2019 | g = 0.42 overall, larger when the categories look alike, as two decks in the same inks do |
| **Spacing practice out** beats cramming | Cepeda et al. 2006 | 839 assessments in 317 experiments. The best gap grows with how long you need to remember |
| **Probability judgment can be trained** | Chang, Chen, Mellers & Tetlock 2016 | Under an hour of training improved forecasters' Brier scores by **6–11%**. Practice added a separate gain |

## 2. What competitive skill is made of, and what the Dojo covers today

A Lorcana game is a series of decisions: the mulligan, what to ink, what to play and in what order, quest or challenge, what to play around, and the plan for this matchup (race for lore, or control the board). The Dojo already helps with some of these:

| Decision | Today | Gap |
|---|---|---|
| Mulligan | Mulligan mode, mulligan odds, Craft hand | No feedback on whether a keep was right (see §4) |
| Your own draws | Draw odds (hypergeometric) | None |
| Quest or challenge, combat maths | Challenge mode with forecast, lore race in the panel | None |
| What the opponent might hold | Nothing: the opponent's hand is just hidden | **Feature 64** |
| What a strong player does in this matchup | Replays import as nodes, but the line is shown before you can think | **Feature 65** |
| Which matchups you lose, and why | Nothing is recorded across games | **Feature 66** |
| Trying other lines | The Multiverse: play from any node, branches kept | None. This is the Dojo's strength |

## 3. The three prototypes

### Feature 64 · Their hand odds — `claude/feat-64-their-hand-odds`

**What it does.** The Draw odds pane gets a **Mine · Theirs** switch. *Theirs* lists the opponent's cards with the chance that they hold at least one copy **now**, and **after their next draw**. The count column shows how many copies are unseen and out of how many cards, so the chance also reads as a count ("2 of 38").

**The maths.** From your seat the opponent's hand and deck are one unseen pool. With U unseen cards, k unseen copies of a card and h cards in their hand, P(they hold one) = 1 − C(U−k, h) / C(U, h). That's the same hypergeometric the pane already uses for your draws, with the hand size as the window.

**How it makes you a better player.** Playing around a card means comparing what you lose by waiting with how likely the answer is. Players misjudge that likelihood. A 4-of is in a 7-card opening hand only **40%** of the time. By the midgame, 3 copies left among 38 unseen cards are in a 4-card hand **29%** of the time, and 35% after their draw. People reason far better with counts than with abstract probabilities (24% against 4%, McDowell & Jacobs 2017), and training with counts lasts (Sedlmeier & Gigerenzer 2001). The aim is to learn the base rates, so that in a real match you know roughly how likely *Let It Go* is without a calculator.

**How far the evidence transfers.** The finding about counts transfers directly: it's the same kind of judgment. The skill gain assumes you look at the number *after* making your own guess. If you just read it, it becomes a crutch (Kluger & DeNisi 1996). The manual says to guess first.

**Limits.** The odds are exact when the opponent's list is known: in the Dojo you loaded it, often a meta list. After an import, the opponent's unrevealed cards are Unknown, so the odds for known cards are lower bounds. Desktop only, like Draw odds.

**Try it.** Start a match with two default decks, open Draw odds, choose **Theirs**, and play a few turns.

### Feature 65 · Hide the line — `claude/feat-65-hide-the-line`

**What it does.** A **Hide the line** switch in the Multiverse panel. While it is on, every node saved *before* you switched it on hides what happened on that turn (its note, the turn recap and the cards played or quested), until you press **Reveal the line**. Nodes you make afterwards (your own lines) show as usual.

**How to study with it.**

1. Import a replay of a strong player in the matchup you want to learn (Duels.ink).
2. Turn on **Hide the line**.
3. On one of their turns, press **Play from here** and play the turn yourself. Your line is saved as a branch.
4. Open the Multiverse, select their node and press **Reveal the line**. Compare it with yours, then write in the note why theirs (or yours) was better.

**How it makes you a better player.** This is how chess players study master games: guess the move, then check it. Serious solitary study was the strongest predictor of chess skill (Charness et al. 2005), and pattern knowledge comes from real positions (Chase & Simon 1973). Trying before seeing the answer is retrieval practice (Roediger & Karpicke 2006). A wrong attempt still helps when the answer follows straight away (Kornell et al. 2009), and Reveal is straight away. Writing why is self-explanation (g = 0.55, Bisra et al. 2018). Because it's a switch, beginners can leave the line showing and learn from worked examples, and stronger players can hide it and solve (Kalyuga et al. 2003).

**How far the evidence transfers.** The chess evidence is about games of skill with hidden lines, so it transfers well. Lorcana adds hidden information and shuffles, so a strong player's line is a good line, not always the best one. Compare and reason about it, don't just copy it.

**Limits.** Each node's lore score still shows in its stats, so the outcome of later turns is visible. The switch isn't saved: it resets when you reload, and any node then counts as new.

**Try it.** Home → Demos → open a demo, turn on **Hide the line** in the Multiverse, and select a node.

### Feature 66 · Debrief and matchups — `claude/feat-66-debrief-matchups`

**What it does.**

- **Debrief** (on the win dialog, or *Debrief this game* in the Multiverse panel): a 30-second form for the session. Which side you were, the result, the turn it was decided, what went wrong (tags) and one lesson. It's saved with the session, so imports of real games can be debriefed too.
- **Matchups** (on the library's Sessions tab): every debriefed session on this device, grouped by matchup (your inks against theirs). Each row shows games, wins and losses, win rate, the most common mistake and the latest lesson. The **weakest matchup comes first**.

The tags are about decisions: *Mulligan, Inking, Curve / tempo, Quest vs challenge, Played into an answer, Misread their deck, Lore race maths, Sequencing*.

**How it makes you a better player.** Debriefs improve performance by about 20–25% (d = 0.67), for individuals as well as teams (Tannenbaum & Cerasoli 2013). Writing progress down roughly doubles the effect of monitoring it (Harkin et al. 2016). Deliberate practice means working on your weakest area (Ericsson et al. 1993), and the table shows which one that is. The lesson field is self-explanation. The tags describe decisions, not a score of *you*, which is the kind of feedback that helps rather than hurts (Kluger & DeNisi 1996).

**How far the evidence transfers.** Debrief studies cover medicine, the military and simulations, with similar effects in every setting, so the transfer is reasonable. The matchup table is a tool for deciding what to practise, so it pays off only if you then play that matchup.

**Limits.** Win rates over a few games are noise: a row with fewer than 5 games is marked *few games*. Matchups are grouped by ink pair, so two different decks in the same inks share a row. It covers this device only. Account sync carries the debrief with the session, but there's no cross-device table.

**Try it.** Finish a game (or open any session and press **Debrief this game** in the Multiverse panel), fill it in, then go Home → Sessions → **Matchups**.

## 4. Ideas considered and not built (yet)

| Idea | Evidence | Why not now |
|---|---|---|
| **Lessons come back:** when a session starts in a matchup, show its last lessons | Spacing (Cepeda et al. 2006), retrieval (Roediger & Karpicke 2006) | Small and strong, but it needs Feature 66's data first. It's the natural next step if 66 is kept |
| **Win-chance calls:** before ending a turn, guess your chance to win, then get a Brier score per matchup when the game ends | Forecast training, 6–11% (Chang et al. 2016) | Judging who is ahead in the lore race matters, but the link from calibration to better plays is indirect. Worth trying after 64–66 |
| **Gauntlet:** a random meta opponent, weighted to your least-played matchups | Mixing practice topics, g = 0.42, more for look-alike categories (Brunmair & Richter 2019) | In the Dojo you play both sides, so you see their hand. Mixing still helps the plan, but recognising the deck is lost. The Matchups table already points at what to play next |
| **Mulligan drill:** deal hands, keep or mulligan, get feedback | Testing with feedback | No source of truth for the right keep yet. Wrong feedback is worse than none (Kluger & DeNisi 1996). Feasible later from many debriefed games (keep → result) |
| **"Win this turn" puzzles** from real positions | Pattern knowledge from real positions (Chase & Simon 1973) | Checking a solution needs a rules engine, and the Dojo is deliberately a sandbox. Hand-written puzzles could use the tour engine |
| **Flash cards of meta cards** (cost, stats, abilities) | Testing and spacing are the strongest study techniques (Dunlosky et al. 2013) | Knowing the cards is the entry ticket, not the gap. Feature 64 and replays teach the meta lists in context |
| **Playing to a clock** | Training under mild pressure helps experts under pressure (Oudejans & Pijpers 2009, perceptual-motor tasks) | Evidence is from motor skills. Low priority |

## 5. How to tell whether a prototype works

Each test is on one player, so the outcome is a judgment call, not an experiment. Measure it anyway:

- **Feature 66 measures the others.** Debrief real games (Duels.ink imports) for two weeks before and after adopting a feature, and watch the win rate and the top mistake tag in your weakest matchup.
- **Feature 65:** keep a tally per studied replay. On how many turns did your line match theirs, or do you still prefer yours after the reveal? The match rate should rise across replays of the same matchup.
- **Feature 64:** before switching to *Theirs*, write down your guess for one key card, then compare. Your guesses should get closer over a dozen games, as in forecast training.

Keep a feature if the number moves, or if you notice yourself using it without being reminded.

## 6. Sources

- Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F., & Winne, P. H. (2018). Inducing self-explanation: A meta-analysis. *Educational Psychology Review, 30*, 703–725.
- Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. https://doi.org/10.1037/bul0000209
- Burgoyne, A. P., Nye, C. D., Macnamara, B. N., Charness, N., & Hambrick, D. Z. (2019). The impact of domain-specific experience on chess skill: Reanalysis of a key study. *American Journal of Psychology, 132*(1), 27–38.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. *Psychological Bulletin, 132*(3), 354–380. https://pubmed.ncbi.nlm.nih.gov/16719566/
- Chang, W., Chen, E., Mellers, B., & Tetlock, P. (2016). Developing expert political judgment: The impact of training and practice on judgmental accuracy in geopolitical forecasting tournaments. *Judgment and Decision Making, 11*(5), 509–526.
- Charness, N., Tuffiash, M., Krampe, R., Reingold, E., & Vasyukova, E. (2005). The role of deliberate practice in chess expertise. *Applied Cognitive Psychology, 19*(2), 151–165.
- Chase, W. G., & Simon, H. A. (1973). Perception in chess. *Cognitive Psychology, 4*(1), 55–81.
- Chi, M. T. H., Bassok, M., Lewis, M. W., Reimann, P., & Glaser, R. (1989). Self-explanations: How students study and use examples in learning to solve problems. *Cognitive Science, 13*(2), 145–182.
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques. *Psychological Science in the Public Interest, 14*(1), 4–58.
- Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993). The role of deliberate practice in the acquisition of expert performance. *Psychological Review, 100*(3), 363–406.
- Gigerenzer, G., & Hoffrage, U. (1995). How to improve Bayesian reasoning without instruction: Frequency formats. *Psychological Review, 102*(4), 684–704.
- Harkin, B., Webb, T. L., Chang, B. P. I., Prestwich, A., Conner, M., Kellar, I., Benn, Y., & Sheeran, P. (2016). Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence. *Psychological Bulletin, 142*(2), 198–229.
- Hays, M. J., Kornell, N., & Bjork, R. A. (2013). When and why a failed test potentiates the effectiveness of subsequent study. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 39*(1), 290–296.
- Kalyuga, S., Ayres, P., Chandler, P., & Sweller, J. (2003). The expertise reversal effect. *Educational Psychologist, 38*(1), 23–31.
- Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance. *Psychological Bulletin, 119*(2), 254–284.
- Kornell, N., Hays, M. J., & Bjork, R. A. (2009). Unsuccessful retrieval attempts enhance subsequent learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 35*(4), 989–998. https://pubmed.ncbi.nlm.nih.gov/19586265/
- Macnamara, B. N., Hambrick, D. Z., & Oswald, F. L. (2014). Deliberate practice and performance in music, games, sports, education, and professions: A meta-analysis. *Psychological Science, 25*(8), 1608–1618.
- McDowell, M., & Jacobs, P. (2017). Meta-analysis of the effect of natural frequencies on Bayesian reasoning. *Psychological Bulletin, 143*(12), 1273–1312.
- Oudejans, R. R. D., & Pijpers, J. R. (2009). Training with anxiety has a positive effect on expert perceptual–motor performance under pressure. *Quarterly Journal of Experimental Psychology, 62*(8), 1631–1647.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255.
- Sedlmeier, P., & Gigerenzer, G. (2001). Teaching Bayesian reasoning in less than two hours. *Journal of Experimental Psychology: General, 130*(3), 380–400.
- Tannenbaum, S. I., & Cerasoli, C. P. (2013). Do team and individual debriefs enhance performance? A meta-analysis. *Human Factors, 55*(1), 231–245. https://pubmed.ncbi.nlm.nih.gov/23516804/
