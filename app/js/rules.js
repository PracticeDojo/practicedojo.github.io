// Rules engine bridge (Feature 68, experimental, branch feat/68-rules-engine).
//
// It knows the Dojo's state but nothing about the board's DOM. The engine runs in a Web Worker
// (app/vendor/lorcana-engine/engine.worker.js, built by tools/build-engine.mjs), started on first use.
//   analyze(state, snOf)          → Promise of what the player whose turn it is may do:
//                                   { byIid: { [instanceId]: { moves, targets: { move: [instanceId] }, why } },
//                                     moves: [moves that need no card], unknown: [cards the engine lacks], ms }
//                                   snOf(cardId) gives a card's "<setCode>-<number>", or null.
//   explore(state, snOf, opts)    → Promise of proposed plays for the rest of the turn:
//                                   { lines: [{ score, delta, parts, acts, state }], ms, nodes, outOfTime }
//                                   Each line's `state` is the Dojo state it ends on. opts go to the
//                                   worker's search (beam, perNode, depth, timeMs, lines).
//   actText(act)                  one step of a line as a sentence.
//   VERBS[move]                   { label, key } for a move id (key: the function-key colour it wears).
//   whyText(reason)               the engine's reason a card can't be played, as a sentence.
//   boardFromState(state, snOf)   a Dojo state (full or compressed) → the worker's board shape.
//   start(workerUrl), call(op, args)  the worker client underneath.
window.DojoRules = (function () {
    'use strict';

    const VENDOR = 'vendor/lorcana-engine/';
    const UNKNOWN = 'unknown';
    const ZONES = ['deck', 'hand', 'field', 'inkwell', 'discard'];

    const VERBS = {
        playCard: { label: 'Play', key: 'bone' },
        singCard: { label: 'Sing', key: 'bone' },
        shiftCard: { label: 'Shift', key: 'bone' },
        putCardIntoInkwell: { label: 'Ink', key: 'olive' },
        quest: { label: 'Quest', key: 'olive' },
        challenge: { label: 'Challenge', key: 'coral' },
        moveCharacterToLocation: { label: 'Move to location', key: 'bone' },
        activateAbility: { label: 'Use ability', key: 'bone' }
    };

    function whyText(r) {
        const p = (r && r.params) || {};
        switch (r && r.code) {
            case 'INSUFFICIENT_INK':
            case 'SHIFT_INSUFFICIENT_INK': return `Needs ${p.needed} ink, ${p.available} ready`;
            case 'SHIFT_NO_TARGET': return `No ${p.targetName} to shift onto`;
            case 'SHIFT_NO_DISCARD_AVAILABLE': return `Shifting needs ${p.count} ${p.discardCardType} to discard`;
            case 'SONG_NO_SINGER': return `No ready character can sing a ${p.songCost}-cost song`;
            case 'PLAYER_PLAY_RESTRICTED': return 'A card in play stops this';
            case 'SELF_PLAY_CONDITION_NOT_MET': return "Its play condition isn't met";
            case 'BAG_PENDING': return 'An effect is waiting to resolve';
            case 'NOT_IN_HAND': return 'Not in hand';
            default: return `Not allowed (${p.validateMoveErrorCode || (r && r.code) || 'unknown'})`;
        }
    }

    function boardFromState(state, snOf) {
        const sn = (card) => (card && snOf(card.cardId)) || UNKNOWN;
        return {
            turn: state.turn,
            active: state.activePlayer === 1 ? 1 : 0,
            inkedThisTurn: ((state.turnActions && state.turnActions.inked) || []).length,
            players: state.players.map(p => {
                const field = p.field || [];
                const inkwell = p.inkwell || [];
                // The Dojo counts ready ink; the engine exerts ink cards. The last ones in are the spent ones.
                const spent = Math.max(0, Math.min(inkwell.length, inkwell.length - (p.inkReady ?? inkwell.length)));
                return {
                    deck: (p.deck || []).map(sn),
                    hand: (p.hand || []).map(sn),
                    discard: (p.discard || []).map(sn),
                    field: field.map(c => {
                        const at = c.locationId ? field.findIndex(l => l.instanceId === c.locationId) : -1;
                        return {
                            sn: sn(c),
                            exerted: !!c.exerted,
                            damage: c.damage || 0,
                            drying: !!c.drying,
                            location: at >= 0 ? at : null,
                            under: (c.stackedCards || []).map(sn),
                            mods: (c.mods || []).map(m => ({ stat: m.stat, value: m.value, until: m.until }))
                        };
                    }),
                    inkwell: inkwell.map((c, i) => ({ sn: sn(c), exerted: i >= inkwell.length - spent })),
                    lore: p.lore || 0,
                    inkDrops: p.inkDrops || 0
                };
            })
        };
    }

    // "<player>:<zone>:<index>" (the worker's names for places) → the card's instanceId.
    function placesOf(state) {
        const ids = {};
        state.players.forEach((p, pi) => ZONES.forEach(z => (p[z] || []).forEach((c, i) => {
            ids[`${pi}:${z}:${i}`] = c.instanceId;
            (c.stackedCards || []).forEach((u, j) => { ids[`${pi}:${z}:${i}:under:${j}`] = u.instanceId; });
        })));
        return ids;
    }

    // One step of a proposed line. `by: 'opp'` steps are the bot answering for the opponent.
    function actText(a) {
        const n = (c) => (c && c.name) || 'a card';
        const on = a.targets && a.targets.length ? ` on ${a.targets.map(n).join(', ')}` : '';
        let s;
        switch (a.family) {
            case 'putCardIntoInkwell': s = `Ink ${n(a.card)}`; break;
            case 'quest': s = `Quest with ${n(a.card)}`; break;
            case 'challenge': s = `Challenge ${n(a.target)} with ${n(a.card)}`; break;
            case 'moveCharacterToLocation': s = `Move ${n(a.card)} to ${n(a.target)}`; break;
            case 'activateAbility': s = `Use ${n(a.card)}'s ability${on}`; break;
            case 'playCard':
                s = a.via === 'shift' ? `Shift ${n(a.card)} onto ${n(a.with[0])}`
                    : a.via === 'sing' || a.via === 'singTogether' ? `Sing ${n(a.card)} with ${a.with.map(n).join(' and ')}`
                        : `Play ${n(a.card)}`;
                s += on;
                break;
            default:
                s = a.skipped ? `Skip ${a.ability || n(a.card) + "'s effect"}`
                    : `${a.ability ? a.ability.charAt(0) + a.ability.slice(1).toLowerCase() : n(a.card) + "'s effect"}${on}`;
        }
        return a.by === 'opp' ? `Opponent: ${s}` : s;
    }

    // Where a line ends, as a Dojo state: the same card objects (modifiers and all), moved and set
    // as the engine left them. ids maps engine ids to Dojo places. Throws rather than lose a card.
    function stateForLine(state, ids, end) {
        const next = JSON.parse(JSON.stringify(state));
        const place = placesOf(next);
        const cards = {};
        const wasIn = {};
        let before = 0;
        next.players.forEach(p => ZONES.forEach(z => (p[z] || []).forEach(c => {
            cards[c.instanceId] = c;
            wasIn[c.instanceId] = z;
            (c.stackedCards || []).forEach(u => { cards[u.instanceId] = u; before++; });
            before++;
        })));
        const card = (eid) => cards[place[ids[eid]]];
        const fresh = (c) => Object.assign(c, { exerted: false, damage: 0, drying: false, locationId: null, faceUp: false, stackedCards: [] });
        let after = 0;
        const take = (list, set) => list.map(eid => {
            const c = card(eid);
            if (!c) throw new Error(`line card ${eid} has no place on the board`);
            after++;
            return set ? set(c, eid) : fresh(c);
        });
        end.zones.forEach((z, pi) => {
            const p = next.players[pi];
            p.deck = take([...z.deck].reverse());
            p.hand = take(z.hand);
            p.discard = take(z.discard);
            p.inkwell = take(z.inkwell, (c, eid) => {
                const faceUp = wasIn[c.instanceId] === 'inkwell' ? c.faceUp : true; // face up the turn it's inked
                return Object.assign(fresh(c), { exerted: end.meta[eid].exerted, faceUp });
            });
            p.field = take(z.play, (c, eid) => {
                const m = end.meta[eid];
                const mods = c.mods;
                fresh(c);
                Object.assign(c, { exerted: m.exerted, damage: m.damage, drying: m.drying });
                c.stackedCards = take(m.under);
                if (mods) c.mods = mods;
                return c;
            });
            z.play.forEach(eid => {
                const at = end.meta[eid].at;
                if (at && card(at)) card(eid).locationId = card(at).instanceId;
            });
            p.lore = end.lore[pi];
            p.inkDrops = end.inkDrops[pi];
            p.inkTotal = p.inkwell.length;
            p.inkReady = p.inkwell.filter(c => !c.exerted).length;
        });
        if (after !== before) throw new Error(`line moved ${after} of ${before} cards`);
        return next;
    }

    let worker = null;
    let ready = null;
    let seq = 0;
    const pending = new Map();

    function start(workerUrl) {
        if (worker) return;
        worker = new Worker(workerUrl);
        worker.onmessage = (e) => {
            const { id, ok, result, error } = e.data;
            const p = pending.get(id);
            if (!p) return;
            pending.delete(id);
            ok ? p.resolve(result) : p.reject(new Error(error));
        };
        worker.onerror = (e) => {
            for (const p of pending.values()) p.reject(new Error(e.message || 'engine worker failed'));
            pending.clear();
        };
    }

    function call(op, args) {
        return new Promise((resolve, reject) => {
            const id = ++seq;
            pending.set(id, { resolve, reject });
            worker.postMessage({ id, op, args });
        });
    }

    // The worker and its card data load once, on the first analysis.
    function engine() {
        if (!ready) {
            start(VENDOR + 'engine.worker.js');
            ready = call('init', new URL(VENDOR + 'cards.json', location.href).href)
                .catch(e => { ready = null; throw e; });
        }
        return ready;
    }

    async function analyze(state, snOf) {
        await engine();
        const r = await call('analyze', { board: boardFromState(state, snOf) });
        const ids = placesOf(state);
        const byIid = {};
        for (const [place, v] of Object.entries(r.cards)) {
            const iid = ids[place];
            if (!iid) continue;
            const targets = {};
            for (const [move, places] of Object.entries(v.targets || {})) targets[move] = places.map(t => ids[t]).filter(Boolean);
            byIid[iid] = { moves: v.moves, targets, why: v.why || null };
        }
        return { byIid, moves: r.moves, unknown: r.unknown, ms: r.ms };
    }

    async function explore(state, snOf, opts = {}) {
        await engine();
        const r = await call('explore', { board: boardFromState(state, snOf), ...opts });
        // Each step's cards also get their Dojo instanceId (iid), as they were before the line.
        const place = placesOf(state);
        const iid = (c) => (c ? Object.assign(c, { iid: place[r.ids[c.id]] || null }) : c);
        r.lines.forEach(l => l.acts.forEach(a => [a.card, a.target, ...(a.with || []), ...(a.targets || [])].forEach(iid)));
        return {
            ms: r.ms,
            nodes: r.nodes,
            positions: r.positions,
            outOfTime: r.outOfTime,
            base: r.base,
            lines: r.lines.map(l => ({ score: l.score, delta: l.score - r.base.score, parts: l.parts, acts: l.acts, state: stateForLine(state, r.ids, l.end) }))
        };
    }

    return { UNKNOWN, VERBS, whyText, actText, boardFromState, analyze, explore, stateForLine, start, call };
})();
