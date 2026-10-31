// Feature 68 (experimental): What-if. A game played out again from one of your turns, to find a line that
// would have won it (a lost game) or ended with a better lore race (an unfinished one: your lore minus theirs,
// OPEN turns past its last turn). It goes back one of your turns at a time, up to five. At each:
//   1. the real game, replayed from there with both players' real moves, must still end as it did; where it
//      doesn't, the replay can't follow the game that far back and the run stops;
//   2. the control: your real move, then the search plays your later turns. If that wins, the win is in a
//      later turn, not this one;
//   3. the search's best lines other than your real move, each played out: your later turns are the
//      search's, theirs are what they really did unless the search finds clearly better for them.
// The first turn back with a winning line (and a control that loses) ends the run; Keep going looks further.
// The real moves come from a Duels.ink replay's or text log's lines, kept on each turn's Multiverse node at
// import (`real`). A game played in the Dojo has none: step 1 is skipped, their turns are the search's, and
// the control is the real board after your turn, played on by the search.
// The engine work is the worker's whatIf op (DojoRules.whatIf); study §12 has the measurements.
window.DojoWhatIf = (() => {
    const BACK = 5;      // turns of yours to go back, at most
    const LINES = 4;     // lines tried at each
    const PAST = 4;      // turns played past the real game's end before calling it
    const OPEN = 2;      // an unfinished game: turns played past its last one, then the lore race compared

    const FAMILIES = { CARD_INKED: 'putCardIntoInkwell', CARD_PLAYED: 'playCard', CARD_QUEST: 'quest', CARD_ATTACK: 'challenge', CARD_MOVED: 'moveCharacterToLocation', ABILITY_ACTIVATED: 'activateAbility' };
    const KNOWN = new Set(Object.values(FAMILIES));

    // Each turn's real moves and choices, from a replay's log, keyed by turn as the Dojo counts them (each
    // player's turn; so do the log's "turn begins" lines). Duels.ink player n is Dojo seat n - 1.
    function movesFromReplay(rp) {
        const real = {};
        let turn = 0;
        const T = () => (real[turn] = real[turn] || { moves: [], choices: [] });
        const exert = {}; // a player's "enter exerted / ready" choice, for the card they play next
        (rp && Array.isArray(rp.logs) ? rp.logs : []).forEach((l, i) => {
            if (l.type === 'TURN_START') turn++;
            if (!turn) return;
            const refs = Array.isArray(l.cardRefs) ? l.cardRefs : [];
            const by = l.player ? l.player - 1 : undefined;
            const opt = l.type === 'CHOICE_RESOLVED' && !refs.length && (String(l.message).match(/chose (option\w+)/) || [])[1];
            if (opt === 'optionEnterExerted' || opt === 'optionEnterReady') { exert[by] = opt === 'optionEnterExerted'; return; }
            if (opt) { T().choices.push({ option: opt === 'optionYes' ? 'yes' : opt.replace(/^option/, ''), by }); return; }
            if (l.type === 'ABILITY_DECLINED') { T().choices.push({ option: 'no', by }); return; }
            if (!refs.length) return;
            if (l.type === 'CHOICE_RESOLVED') {
                // Whose card it was: the next line that damages, discards, returns or moves a card of that name.
                refs.forEach(r => {
                    const nx = rp.logs.slice(i + 1, i + 6).find(x => /DAMAGE|DESTROY|RETURN|DISCARD|MOVED/.test(x.type) && (x.cardRefs || []).some(c => c.name === r.name));
                    T().choices.push({ name: r.name, owner: nx && nx.player ? nx.player - 1 : undefined, by });
                });
                return;
            }
            const family = FAMILIES[l.type];
            if (!family || (family === 'challenge' && String(l.message).includes('|'))) return; // the detail line repeats it
            const move = { family, card: refs[0].name };
            if ((family === 'challenge' || family === 'moveCharacterToLocation') && refs[1]) move.target = refs[1].name;
            if (family === 'playCard' && l.data && l.data.isSung) move.with = refs.slice(1).map(r => r.name);
            if (family === 'playCard' && exert[by] != null) { move.exerted = exert[by]; delete exert[by]; }
            T().moves.push(move);
        });
        // A game won on lore: the winner, on its last turn (a concession or a timeout leaves it unfinished).
        if (turn && (rp.winner === 1 || rp.winner === 2) && (!rp.victoryReason || rp.victoryReason === 'lore')) T().won = rp.winner - 1;
        return real;
    }

    // The same from a turn of a Duels.ink text log (parseDojoLog): the active player's moves, by name. A text
    // log names no choices, so the bot makes them.
    const LOG = { ink: 'putCardIntoInkwell', play: 'playCard', sing: 'playCard', quest: 'quest', challenge: 'challenge', activate: 'activateAbility' };
    function movesFromLog(t, p) {
        const real = { moves: [], choices: [] };
        for (const e of t.events) {
            if (e.t === 'loreSet') real.won = e.p; // "… won with 20 [LORE]!"
            const card = e.t === 'challenge' ? e.attacker : e.name, last = real.moves[real.moves.length - 1];
            if (e.p !== p || !LOG[e.t] || !card) continue;
            // A challenge's detail line ("… | dealt 2 dmg") repeats the line before it.
            if ('targetDamage' in e && last && last.family === 'challenge' && last.card === card && last.target === e.target) continue;
            const move = { family: LOG[e.t], card };
            if (e.t === 'challenge') move.target = e.target;
            if (e.t === 'sing') move.with = e.singers;
            real.moves.push(move);
        }
        return real;
    }

    // A node's real moves as data: known kinds of move and plain names only (a session file can come from
    // anyone). Null when the node has none.
    function realOf(node) {
        const r = node && node.real;
        if (!r || !Array.isArray(r.moves)) return null;
        const name = (v) => (typeof v === 'string' && v ? v.slice(0, 120) : undefined);
        const seat = (v) => (v === 0 || v === 1 ? v : undefined);
        return {
            moves: r.moves.filter(m => m && KNOWN.has(m.family) && name(m.card)).slice(0, 100).map(m => ({
                family: m.family, card: name(m.card), target: name(m.target),
                with: Array.isArray(m.with) ? m.with.map(name).filter(Boolean).slice(0, 8) : undefined,
                exerted: typeof m.exerted === 'boolean' ? m.exerted : undefined
            })),
            choices: (Array.isArray(r.choices) ? r.choices : []).slice(0, 100)
                .map(c => ({ name: name(c && c.name), option: name(c && c.option), owner: seat(c && c.owner), by: seat(c && c.by) }))
                .filter(c => c.name || c.option),
            won: seat(r.won)
        };
    }

    // The game as a line of turn nodes: from its first turn to the end of the line through `pickId` (any node;
    // its turn counts), below a fork the line played first (the older node). Without pickId, the tree's only line.
    // What-if's own branches aren't the game.
    //   turns: [{ id, turn, label, active, state, real }], one per turn in order; real is null without a record.
    //     `turn` counts each player's turn, as the engine does (and state.turn is set to it); `label` is the
    //     node's own number: a game played here counts rounds (both players' turn 1, then turn 2)
    //   label(turn): the game's own number for a turn, past its end too
    //   at: the index in turns of the picked turn (else the last); winner: the seat that won at the end of the
    //   line, or null (unfinished); branched: the game has more than one line; key: its turn nodes, to tell
    //   when the game changed
    function lineOf(nodes, decompress, pickId) {
        const byId = new Map(nodes.map(n => [n.id, n]));
        const ours = (n) => /\(What-if from turn/.test(n.name || '');
        const isTurn = (n) => !!n && !!(n.turnStart || n.real) && !n.isVictory && !ours(n);
        // The nearest turn node above n (a session file can come from anyone: no loops).
        const up = (n) => {
            for (let p = byId.get(n.parentId), k = 0; p && k < nodes.length; p = byId.get(p.parentId), k++) if (isTurn(p)) return p;
            return null;
        };
        const kids = new Map();
        for (const n of nodes) if (isTurn(n) || (n.isVictory && !ours(n))) {
            const p = up(n), key = p ? p.id : '';
            kids.set(key, [...(kids.get(key) || []), n]);
        }
        const turnKids = (id) => (kids.get(id) || []).filter(isTurn);
        const branched = [...kids.keys()].some(k => turnKids(k).length > 1);
        let at = pickId ? byId.get(pickId) : null;
        if (at && !isTurn(at)) at = up(at);
        const line = [];
        for (let p = at, k = 0; p && k < nodes.length; p = up(p), k++) line.unshift(p);
        if (!at && !branched && turnKids('')[0]) line.push(turnKids('')[0]);
        const tip = line[line.length - 1];
        for (let n = tip && turnKids(tip.id)[0]; n && line.length <= nodes.length; n = turnKids(n.id)[0]) line.push(n);
        const turns = [];
        let picked = null; // the picked turn: [its number, whose]
        for (const n of line) {
            let state;
            try { state = decompress(JSON.parse(n.state)); } catch (e) { continue; }
            if (!state || !state.players) continue;
            const prev = turns[turns.length - 1];
            if (prev && prev.label === state.turn && prev.active === state.activePlayer) turns.pop(); // the turn played from
            turns.push({ id: n.id, label: state.turn, active: state.activePlayer, state, real: realOf(n) });
            if (n === at) picked = [state.turn, state.activePlayer];
        }
        let rounds = false;
        turns.forEach((t, k) => {
            const p = turns[k - 1];
            if (p && p.label === t.label) rounds = true;
            t.turn = t.state.turn = !p ? t.label : p.turn + (t.active !== p.active ? 1 : 2);
        });
        const label = (turn) => {
            const t = turns.find(x => x.turn === turn), tail = turns[turns.length - 1];
            if (t || !tail) return t ? t.label : turn;
            let n = tail.label, active = tail.active;
            for (let k = tail.turn; k < turn; k++) { active = 1 - active; if (!rounds || active === 0) n++; }
            return n;
        };
        const last = line[line.length - 1];
        const win = last && (kids.get(last.id) || []).find(v => v.isVictory && (v.playerIdx === 0 || v.playerIdx === 1));
        const end = turns[turns.length - 1];
        const winner = win ? win.playerIdx : end && end.real && end.real.won != null ? end.real.won : null;
        const i = picked ? turns.findIndex(t => t.label === picked[0] && t.active === picked[1]) : -1;
        return { turns, label, at: i < 0 ? turns.length - 1 : i, winner, branched, key: nodes.filter(isTurn).map(n => n.id).join() };
    }

    // The board a level starts from, with its unknown cards filled in: a card a later board knows that
    // this one doesn't (one more copy of a name) was one of its unknown cards, in hand first, then in the deck.
    function filled(turns, at, known) {
        const st = JSON.parse(JSON.stringify(turns[at].state));
        const counts = (s, p) => {
            const m = {};
            const pl = s.players[p];
            const all = [...pl.hand, ...pl.deck, ...pl.discard, ...pl.inkwell, ...pl.field.flatMap(c => [c, ...(c.stackedCards || [])])];
            all.filter(c => known(c.cardId)).forEach(c => { m[c.cardId] = (m[c.cardId] || 0) + 1; });
            return m;
        };
        for (const p of [0, 1]) {
            const have = counts(st, p);
            const missing = [];
            for (const later of turns.slice(at + 1)) {
                for (const [id, n] of Object.entries(counts(later.state, p))) {
                    while ((have[id] || 0) < n) { missing.push(id); have[id] = (have[id] || 0) + 1; }
                }
            }
            const pl = st.players[p];
            for (const id of missing) {
                const slot = pl.hand.find(c => !known(c.cardId)) || pl.deck.find(c => !known(c.cardId));
                if (!slot) break;
                slot.cardId = /^\d+$/.test(id) ? Number(id) : id;
            }
        }
        return st;
    }

    // The run, from `from` turns back, for up to BACK turns back. game: { turns, winner (lineOf), start (the
    // index in turns of the first turn to try), keyOf, known, me (the seat to find a better game for) }.
    // It reports as it goes, so the page can show each line as it comes:
    //   on.level(level)   a turn back begins: { back, turn, nodeId, start, steps, done, step, state, lines }
    //   on.line(level, line)  a line has been played out: { index, winner, lore, turns, good }
    //   on.change()       anything else moved on (done, step, state, the checks)
    // A line is good when it wins a lost game, or ends an unfinished one with a better lore race than the
    // control (any, when nothing was played after that turn). A level's state: 'running', then 'won' (a good
    // line, and a control that doesn't win), 'none', 'drift' (the replay no longer follows the real game) or
    // 'stopped'. stop(): true to stop between playouts.
    async function run(game, from, on, stop) {
        const { turns, keyOf, known, me, winner, start } = game;
        const end = turns[turns.length - 1].turn;
        const real = Object.fromEntries(turns.filter(t => t.real).map(t => [t.turn, t.real]));
        const mine = turns.map((t, i) => i).filter(i => i <= start && turns[i].active === me).reverse();
        const horizon = end + (winner === null ? OPEN : PAST);
        const lastLore = turns[turns.length - 1].state.players.map(p => p.lore);
        const race = (x) => (x.winner === me ? 1000 : x.winner !== null ? -1000 : x.lore[me] - x.lore[1 - me]);
        const play = (board, opts) => DojoRules.whatIf(board, keyOf, { me, real, nodes: 300, laterNodes: 120, margin: 1, ...opts });
        const last = Math.min(from + BACK - 1, mine.length);
        for (let back = from; back <= last; back++) {
            const at = mine[back - 1], t = turns[at], after = turns[at + 1];
            const recorded = turns.slice(at).every(x => x.real); // the real game can be replayed from here
            const level = { back, turn: t.turn, nodeId: t.id, start: filled(turns, at, known), steps: (recorded ? 1 : 0) + (t.real || after ? 1 : 0) + LINES,
                done: 0, recorded, step: recorded ? 'Replaying the real game' : 'Your real move, then the search', state: 'running', lines: [] };
            on.level(level);
            const halt = () => {
                level.state = 'stopped';
                on.change();
                return { done: false, why: 'stopped', next: back };
            };
            if (recorded) {
                const exact = await play(level.start, { first: 'real', exact: true, horizon: end });
                level.done++;
                level.exact = { winner: exact.winner, lore: exact.lore };
                // Unfinished: nobody wins, and the last turn starts on the real lore.
                const before = exact.turns.find(x => x.turn === end - 1);
                level.reproduced = winner !== null ? exact.winner === winner
                    : exact.winner === null && (!before || before.state.players.every((p, k) => p.lore === lastLore[k]));
                if (!level.reproduced) {
                    level.state = 'drift';
                    on.change();
                    return { done: true, why: 'drift' };
                }
                if (stop()) return halt();
                level.step = 'Your real move, then the search';
                on.change();
            }
            // Your real move: as recorded, else the real board after it.
            const control = t.real ? await play(level.start, { first: 'real', horizon })
                : after ? await play(filled(turns, at + 1, known), { first: 'real', horizon }) : null;
            if (control) level.done++;
            level.control = control && { winner: control.winner, lore: control.lore, turns: control.turns };
            on.change();
            for (let i = 0; i < LINES; i++) {
                if (stop()) return halt();
                level.step = `Line ${i + 1} of ${LINES}`;
                on.change();
                const r = await play(level.start, { first: i, horizon });
                level.done++;
                if (r.lines !== null && r.lines <= i) {
                    level.steps = level.done; // no more lines this turn
                    break;
                }
                const line = { index: i, winner: r.winner, lore: r.lore, turns: r.turns };
                line.good = winner !== null ? line.winner === me : race(line) > (level.control ? race(level.control) : -Infinity);
                level.lines.push(line);
                on.line(level, line);
                on.change();
            }
            level.won = (!level.control || level.control.winner !== me) && level.lines.some(l => l.good);
            level.state = level.won ? 'won' : 'none';
            on.change();
            if (level.won) return { done: back >= mine.length, why: 'won', next: back + 1 };
        }
        return { done: last >= mine.length, why: 'none', next: last + 1 };
    }

    return { BACK, LINES, OPEN, movesFromReplay, movesFromLog, realOf, lineOf, filled, run };
})();
