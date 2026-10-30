// Rules engine bridge (Feature 68, experimental, branch feat/68-rules-engine).
//
// It knows the Dojo's state but nothing about the board's DOM. The engine runs in a Web Worker
// (app/vendor/lorcana-engine/engine.worker.js, built by tools/build-engine.mjs), started on first use.
//   analyze(state, keyOf)         → Promise of what the player whose turn it is may do:
//                                   { byIid: { [instanceId]: { moves, targets: { move: [instanceId] }, why } },
//                                     moves: [moves that need no card], unknown: [cards the engine lacks], ms }
//                                   keyOf(cardId) names a card for the engine, "<setCode>-<number>|<full name>",
//                                   or null (App.cardKey).
//   explore(state, keyOf, opts)    → Promise of proposed plays for the rest of the turn:
//                                   { lines: [{ score, delta, parts, acts, state }], base, weights, ms, nodes, outOfTime }
//                                   Each line's `state` is the Dojo state it ends on. opts go to the
//                                   worker's search (beam, perNode, depth, nodes, timeMs, lines, replyLines).
//   botStart(state, keyOf, seat)  the bot opponent (Tier 2): the engine starts a game from this board and plays
//                                   `seat`. botStep() plays its next move and what that sets off; botChoose(i)
//                                   answers a choice it asked you; botPass('bot' | 'you') runs the turn change.
//                                   Each → Promise of { acts, state, ask, stuck, done, owner, over, winner }:
//                                   state is the Dojo board, or null while something is resolving; ask lists your
//                                   choices; owner is whose turn it is now (0 or 1). botRebase(state): after the app's
//                                   own turn-change steps, later replies are read against this board.
//   score(state, keyOf, weights, terms) → Promise of the board as it stands, from the side of the player whose turn it is:
//                                   { score, parts, raw, weights, defaults, cards: { [instanceId]: [{ k, v, x }] }, terms }
//                                   defaults: the engine's own weights. terms: your own (DojoLab), each { value, hits: [instanceId] }.
//                                   cards: each card in play's share (part k, value v, the measure x weighted).
//   actText(act)                  one step of a line as a sentence.
//   groupActs(acts)               a line's steps for display: [{ act, subs }], each move with what it set off.
//   stepText(group)               a grouped step in a few words, for comparing lines.
//   lineDiff(acts, firstActs)     how a line differs from line 1, as [text, isConnector] pieces, or null.
//   VERBS[move]                   { label, key } for a move id (key: the function-key colour it wears).
//   whyText(reason)               the engine's reason a card can't be played, as a sentence.
//   boardFromState(state, keyOf)   a Dojo state (full or compressed) → the worker's board shape.
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

    function boardFromState(state, keyOf) {
        const sn = (card) => (card && keyOf(card.cardId)) || UNKNOWN;
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

    // The bot opponent. The engine's ids are of the board the game started from (bot.from), so every reply's
    // board and cards are read against it.
    let bot = null;
    async function botStart(state, keyOf, seat) {
        await engine();
        const r = await call('botStart', { board: boardFromState(state, keyOf), seat });
        bot = { from: JSON.parse(JSON.stringify(state)), ids: r.ids, place: placesOf(state) };
    }
    // After a turn change the app changes what the engine doesn't track (ink turned face down, modifiers
    // that ended), so the board as it is now becomes the one later replies are read against.
    function botRebase(state) {
        if (!bot) return;
        const place = placesOf(state);
        const at = {};
        Object.entries(place).forEach(([p, iid]) => { at[iid] = p; });
        const ids = {};
        Object.entries(bot.ids).forEach(([eid, p]) => { ids[eid] = at[bot.place[p]]; });
        bot = { from: JSON.parse(JSON.stringify(state)), ids, place };
    }
    function botRead(r) {
        if (!bot || r.error) return r;
        const iid = (c) => (c ? Object.assign(c, { iid: bot.place[bot.ids[c.id]] || null }) : c);
        [...(r.acts || []), ...(r.ask || [])].forEach(a => [a.card, a.target, ...(a.with || []), ...(a.targets || [])].forEach(iid));
        r.state = r.end ? stateForLine(bot.from, bot.ids, r.end) : null;
        return r;
    }
    const botStep = async () => botRead(await call('botStep', {}));
    const botChoose = async (index) => botRead(await call('botChoose', { index }));
    const botPass = async (who) => botRead(await call('botPass', { who }));

    async function score(state, keyOf, weights, terms) {
        await engine();
        const r = await call('score', { board: boardFromState(state, keyOf), weights, terms });
        const place = placesOf(state);
        const cards = {};
        for (const [p, shares] of Object.entries(r.cards)) if (place[p]) cards[place[p]] = shares;
        const found = r.terms.map(t => ({ value: t.value, hits: t.hits.map(p => place[p]).filter(Boolean) }));
        return { score: r.score, parts: r.parts, raw: r.raw, weights: r.weights, defaults: r.defaults, cards, terms: found };
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

    // A line's steps for display: each of my moves with the abilities and effects it set off (and
    // the opponent's choices in between). An unnamed effect from the same card as the ability before it
    // (or as the move) only adds that ability's targets. The acts are copied, never changed.
    const MOVES = new Set(['playCard', 'quest', 'challenge', 'putCardIntoInkwell', 'moveCharacterToLocation', 'activateAbility']);
    function groupActs(acts) {
        const out = [];
        const addTargets = (x, more) => {
            const all = x.targets.concat(more);
            x.targets = all.filter((c, i) => all.findIndex(d => d.name === c.name) === i);
        };
        for (const a0 of acts) {
            const a = Object.assign({}, a0, { targets: (a0.targets || []).slice() });
            if ((a.by === 'me' && MOVES.has(a.family)) || !out.length) { out.push({ act: a, subs: [] }); continue; }
            const g = out[out.length - 1];
            const prev = g.subs[g.subs.length - 1];
            const from = prev || g.act;
            if (!a.ability && !a.skipped && a.by === from.by && a.card && from.card && a.card.name === from.card.name) addTargets(from, a.targets);
            else g.subs.push(a);
        }
        return out;
    }

    // "Quest with Max Goof → Strike a Good Match, To Wither a Flower"
    function stepText(g) {
        const names = g.subs.concat(g.act).flatMap(x => (x.targets || []).map(c => c.name));
        return actText(Object.assign({}, g.act, { targets: [] })) + (names.length ? ' → ' + [...new Set(names)].join(', ') : '');
    }

    // How a line differs from line 1, in at most three steps: "Like line 1, but" … "instead of" … .
    // Pieces are [text, isConnector]; null when they differ more (show the line's own steps then).
    function lineDiff(acts, firstActs) {
        const a = groupActs(acts).map(stepText), b = groupActs(firstActs).map(stepText);
        if (!a.length) return null;
        const extra = a.filter(k => !b.includes(k)), missing = b.filter(k => !a.includes(k));
        if (!extra.length && !missing.length) return [['Line 1 in another order', true]];
        const head = (k) => k.split(' → ')[0];
        const targets = (k) => (k.split(' → ')[1] || '').split(', ').filter(Boolean);
        const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
        const bits = [];
        for (const k of extra) {
            const m = missing.find(x => head(x) === head(k));
            if (!m) { bits.push([[k, false]]); continue; }
            // The same step with other targets: only the targets that changed.
            missing.splice(missing.indexOf(m), 1);
            const add = targets(k).filter(t => !targets(m).includes(t)), drop = targets(m).filter(t => !targets(k).includes(t));
            bits.push(add.length ? [[`${head(k)} → ${add.join(', ')}`, false], ...(drop.length ? [[' instead of ', true], [drop.join(', '), false]] : [])]
                : [[head(k), false], [' without ', true], [drop.join(', '), false]]);
        }
        if (bits.length === 1 && bits[0].length === 1 && missing.length === 1) return [['Like line 1, but ', true], bits[0][0], [' instead of ', true], [lower(missing[0]), false]];
        missing.forEach(k => bits.push([['not ', true], [lower(k), false]]));
        if (bits.length > 3) return null;
        return [['Like line 1, but ', true]].concat(...bits.map((x, i) => (i ? [[' · ', true]].concat(x) : x)));
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

    async function analyze(state, keyOf) {
        await engine();
        const r = await call('analyze', { board: boardFromState(state, keyOf) });
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

    async function explore(state, keyOf, opts = {}) {
        await engine();
        const r = await call('explore', { board: boardFromState(state, keyOf), ...opts });
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
            weights: r.weights,
            lines: r.lines.map(l => ({ score: l.score, delta: l.score - r.base.score, parts: l.parts, acts: l.acts, state: stateForLine(state, r.ids, l.end) }))
        };
    }

    return { UNKNOWN, VERBS, whyText, actText, groupActs, stepText, lineDiff, boardFromState, analyze, explore, botStart, botStep, botChoose, botPass, botRebase, score, stateForLine, start, call };
})();
