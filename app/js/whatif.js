// Feature 68 (experimental): What-if. A lost game played out again from one of your turns, to find a line
// that would have won. It goes back one of your turns at a time, up to five. At each:
//   1. the real game, replayed from there with both players' real moves, must still end as it did; where it
//      doesn't, the replay can't follow the game that far back and the run stops;
//   2. the control: your real move, then the search plays your later turns. If that wins, the win is in a
//      later turn, not this one;
//   3. the search's best lines other than your real move, each played out: your later turns are the
//      search's, theirs are what they really did unless the search finds clearly better for them.
// The first turn back with a winning line (and a control that loses) ends the run; Keep going looks further.
// The real moves come from a Duels.ink replay's log, kept on each turn's Multiverse node at import (`real`).
// The engine work is the worker's whatIf op (DojoRules.whatIf); study §12 has the measurements.
window.DojoWhatIf = (() => {
    const BACK = 5;      // turns of yours to go back, at most
    const LINES = 4;     // lines tried at each
    const PAST = 4;      // turns played past the real game's end before calling it

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
                .filter(c => c.name || c.option)
        };
    }

    // The game's turns, from the nodes that carry real moves: one per turn, in order.
    function turnsOf(nodes, decompress) {
        const byTurn = {};
        for (const n of nodes) {
            const real = realOf(n);
            if (!real) continue;
            let state;
            try { state = decompress(JSON.parse(n.state)); } catch (e) { continue; }
            if (!state || !state.players || byTurn[state.turn]) continue;
            byTurn[state.turn] = { id: n.id, turn: state.turn, active: state.activePlayer, state, real };
        }
        return Object.values(byTurn).sort((a, b) => a.turn - b.turn);
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

    // The run. game: { turns (turnsOf), keyOf, known, me (the seat to find a win for) }.
    // on: { progress(text), level(result) }; stop(): true to stop between playouts.
    // A level's result: { back, turn, nodeId, start, reproduced, control, lines: [{ index, winner, lore, turns }] }.
    async function run(game, from, on, stop) {
        const { turns, keyOf, known, me } = game;
        const end = turns[turns.length - 1].turn;
        const real = Object.fromEntries(turns.map(t => [t.turn, t.real]));
        const mine = turns.map((t, i) => i).filter(i => turns[i].active === me && turns[i].turn < end).reverse();
        const play = (start, opts) => DojoRules.whatIf(start, keyOf, { me, real, nodes: 300, laterNodes: 120, margin: 1, ...opts });
        const realWinner = turns[turns.length - 1].active; // the game ends on the winner's turn
        for (let back = from; back <= Math.min(BACK, mine.length); back++) {
            const at = mine[back - 1];
            const t = turns[at];
            const start = filled(turns, at, known);
            const level = { back, turn: t.turn, nodeId: t.id, start, lines: [] };
            on.progress(`${back} turn${back > 1 ? 's' : ''} back (turn ${t.turn}): replaying the real game`);
            const exact = await play(start, { first: 'real', exact: true, horizon: end });
            level.reproduced = exact.winner === realWinner;
            if (!level.reproduced) { on.level(level); return { done: true, why: 'drift' }; }
            if (stop()) return { done: false };
            on.progress(`${back} turn${back > 1 ? 's' : ''} back (turn ${t.turn}): your real move, then the search`);
            const control = await play(start, { first: 'real', horizon: end + PAST });
            level.control = { winner: control.winner, lore: control.lore, turns: control.turns };
            for (let i = 0; i < LINES; i++) {
                if (stop()) return { done: false };
                on.progress(`${back} turn${back > 1 ? 's' : ''} back (turn ${t.turn}): line ${i + 1}`);
                const r = await play(start, { first: i, horizon: end + PAST });
                if (r.lines !== null && r.lines <= i) break;
                level.lines.push({ index: i, winner: r.winner, lore: r.lore, turns: r.turns });
            }
            level.won = level.control.winner !== me && level.lines.some(l => l.winner === me);
            on.level(level);
            if (level.won) return { done: back >= Math.min(BACK, mine.length), why: 'won' };
            if (stop()) return { done: false };
        }
        return { done: true, why: 'none' };
    }

    return { BACK, LINES, movesFromReplay, realOf, turnsOf, filled, run };
})();
