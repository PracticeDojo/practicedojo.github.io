/* Turn replay prototypes: the tape engine.
   A turn's script (what happened, in order, in card names) is compiled
   against the board saved at the turn's node. Every action becomes a step
   that holds the board right after it, so a view can show any moment of the
   turn and "play from here" has a board to open. Top-level script entries
   are the player's decisions; their `then` entries are consequences.
   Runs in the browser (global `Tape`) and in Node (module.exports). */
(function (root) {
    const clone = o => JSON.parse(JSON.stringify(o));
    const ZONES = ['field', 'hand', 'discard', 'inkwell', 'deck'];

    function compile(turn, CARDS) {
        const st = clone(turn.start);
        const me = st.active, op = 1 - me;
        const steps = [];
        const card = iid => CARDS[st.c[iid].id];
        const full = c => c.v ? c.n + ' - ' + c.v : c.n;

        // Where is this card, and in whose zones?
        function where(iid) {
            for (const p of [0, 1]) for (const z of ZONES) {
                const i = st.p[p][z].indexOf(iid);
                if (i >= 0) return { p, z, i };
            }
            return null;
        }
        function move(iid, p, z, top) {
            const w = where(iid);
            if (w) st.p[w.p][w.z].splice(w.i, 1);
            if (top) st.p[p][z].unshift(iid); else st.p[p][z].push(iid);
            const c = st.c[iid];
            if (z !== 'field') { c.dmg = 0; c.ex = false; c.dry = false; }
        }
        // A name from the script: "Tod - Clever Fox", "Elinor", "Vixey".
        // `pref` breaks ties between copies (damaged, exerted, dry, ready).
        function find(q, p, zones, pref) {
            if (q && q.iid) return q.iid;
            const name = typeof q === 'string' ? q : q.name;
            const want = Object.assign({}, pref, typeof q === 'object' ? q : {});
            const hits = [];
            for (const z of zones) for (const iid of st.p[p][z]) {
                const c = card(iid);
                if (full(c).startsWith(name) || c.n === name) hits.push(iid);
            }
            if (!hits.length) throw new Cant(`${name} isn't ${zones[0] === 'field' ? 'in play' : 'in the ' + zones[0]}`);
            const score = iid => {
                const c = st.c[iid];
                let s = 0;
                if (want.damaged !== undefined && !!c.dmg === want.damaged) s += 2;
                if (want.dry !== undefined && !!c.dry === want.dry) s += 2;
                if (want.ready && !c.ex && !c.dry) s += 1;
                if (want.ex && c.ex) s += 1;
                return s;
            };
            return hits.sort((a, b) => score(b) - score(a))[0];
        }
        const side = a => (a.side === 'me' ? me : a.side === 'opp' ? op : null);

        function push(step) {
            step.i = steps.length;
            step.state = clone(st);
            steps.push(step);
            return step;
        }
        // Damage, then a banish step under it for every card it kills.
        function hurt(step, list, depth) {
            for (const iid of list) {
                const c = st.c[iid], dmg = c.dmg, w = card(iid).w;
                if (where(iid).z === 'field' && dmg >= w) {
                    move(iid, c.owner, 'discard');
                    push({ v: 'banish', targets: [iid], cause: step.i, depth: depth + 1, phase: step.phase, why: `${dmg}/${w} damage` });
                }
            }
        }

        // A rule says no: the step is kept, hollow, with the reason.
        class Cant extends Error {}
        const ready = (iid, verb) => {
            if (st.c[iid].ex) throw new Cant(`${card(iid).n} is already exerted`);
            if (st.c[iid].dry) throw new Cant(`${card(iid).n} was played this turn and can't ${verb} yet`);
        };
        const singer = iid => { const m = /Singer (\d+)/.exec(card(iid).text || ''); return m ? +m[1] : card(iid).cost; };
        const chars = p => st.p[p].field.filter(iid => card(iid).type === 'Character');

        function exec(a, cause, depth, phase) {
            phase = a.phase || phase;
            const base = { v: a.v, cause, depth, phase, why: a.why || '', decision: depth === 0 && !a.when, raw: a };
            let s;
            try { s = run(a, base, depth); }
            catch (e) {
                if (!(e instanceof Cant)) throw e;
                push({ ...base, skipped: e.message });
                return;
            }
            if (s.fizzled) return;
            (a.then || []).forEach(b => exec(b, s.i, depth + 1, phase));
        }

        function run(a, base, depth) {
            let s;
            switch (a.v) {
                case 'draw': {
                    const p = side(a) ?? me;
                    const got = st.p[p].deck.slice(0, a.n || 1);
                    got.forEach(iid => move(iid, p, 'hand'));
                    s = push({ ...base, who: p, targets: got });
                    break;
                }
                case 'ink': {
                    const iid = find(a.card, me, ['hand']);
                    if (!card(iid).inkable) throw new Cant(`${card(iid).n} can't go in the inkwell`);
                    if (steps.some(x => x.v === 'ink' && !x.skipped && x.depth === 0)) throw new Cant('You have already inked this turn');
                    move(iid, me, 'inkwell');
                    st.p[me].inkTotal++; st.p[me].inkReady++;
                    s = push({ ...base, card: iid, ink: +1 });
                    break;
                }
                case 'play': {
                    const from = a.from || 'hand';
                    const iid = find(a.card, me, [from]);
                    const cost = a.cost ?? (from === 'hand' ? card(iid).cost : 0);
                    if (st.p[me].inkReady < cost) throw new Cant(`${card(iid).n} costs ${cost}; only ${st.p[me].inkReady} ink ready`);
                    st.p[me].inkReady -= cost;
                    if (card(iid).type === 'Character' || card(iid).type === 'Item' || card(iid).type === 'Location') {
                        move(iid, me, 'field');
                        st.c[iid].dry = card(iid).type === 'Character';
                    } else move(iid, me, 'discard');
                    s = push({ ...base, card: iid, from, ink: -cost, cost });
                    break;
                }
                case 'sing': {
                    const song = find(a.card, me, [a.from || 'hand']);
                    const singers = a.singers.map(n => find(n, me, ['field'], { ready: true }));
                    singers.forEach(iid => {
                        ready(iid, 'sing');
                        if (singer(iid) < card(song).cost) throw new Cant(`${card(iid).n} counts as cost ${singer(iid)}; ${card(song).n} needs ${card(song).cost}`);
                    });
                    singers.forEach(iid => { st.c[iid].ex = true; });
                    move(song, me, 'discard');
                    s = push({ ...base, card: song, actors: singers, cost: 0, ink: 0 });
                    break;
                }
                case 'quest': {
                    const iid = find(a.card, me, ['field'], { ready: true });
                    ready(iid, 'quest');
                    const lore = a.lore ?? card(iid).l;
                    st.c[iid].ex = true;
                    st.p[me].lore += lore;
                    s = push({ ...base, actors: [iid], lore });
                    break;
                }
                case 'challenge': {
                    const att = find(a.att, me, ['field'], { ready: true });
                    const def = find(a.def, op, ['field'], Object.assign({ ex: true }, a.defPref));
                    ready(att, 'challenge');
                    if (!st.c[def].ex) throw new Cant(`${card(def).n} is ready: only exerted characters can be challenged`);
                    const dealt = card(att).s + (a.bonus || 0), took = card(def).s;
                    st.c[def].dmg += dealt; st.c[att].dmg += took; st.c[att].ex = true;
                    s = push({ ...base, actors: [att], targets: [def], dealt, took });
                    hurt(s, [def, att], depth);
                    break;
                }
                case 'dmg': {
                    const p = side(a) ?? op;
                    const list = a.all
                        ? chars(p).filter(iid => a.all === 'damaged' ? st.c[iid].dmg > 0 : true)
                        : [].concat(a.target).map(t => find(t, p, ['field'], a.pref || {}));
                    // "equal to the number of characters you have in play"
                    const counts = a.n === 'chars' ? chars(me) : [];
                    const n = a.n === 'chars' ? counts.length : a.n;
                    list.forEach(iid => { st.c[iid].dmg += n; });
                    s = push({ ...base, targets: list, n, counts });
                    hurt(s, list, depth);
                    break;
                }
                case 'banish': {
                    const p = side(a) ?? op;
                    const list = a.all === 'damaged' ? chars(p).filter(iid => st.c[iid].dmg > 0)
                        : [].concat(a.target).map(t => find(t, p, ['field'], a.pref || {}));
                    s = push({ ...base, targets: list.slice() });
                    list.forEach(iid => move(iid, st.c[iid].owner, 'discard'));
                    s.state = clone(st);
                    break;
                }
                case 'discard': {
                    const iid = find(a.card, me, ['hand']);
                    move(iid, me, 'discard');
                    s = push({ ...base, targets: [iid] });
                    break;
                }
                case 'bottom': {
                    const iid = find(a.card, me, ['discard', 'hand', 'field']);
                    move(iid, me, 'deck');
                    s = push({ ...base, targets: [iid] });
                    break;
                }
                case 'lore': {
                    st.p[me].lore += a.n;
                    s = push({ ...base, lore: a.n });
                    break;
                }
                case 'ability': {
                    // A triggered or activated ability. Its effects are its `then`.
                    const iid = find(a.card, a.side === 'opp' ? op : me, ['field']);
                    let cond = null, fizzled = false;
                    if (a.cond) {
                        const ex = chars(me).filter(x => st.c[x].ex);
                        cond = { text: a.cond.text, cards: ex, need: a.cond.exerted, met: ex.length >= a.cond.exerted };
                        fizzled = !cond.met;
                    }
                    s = push({ ...base, card: iid, name: a.name, when: a.when || '', cond, fizzled });
                    break;
                }
                default: throw new Error('unknown verb ' + a.v);
            }
            return s;
        }

        // The board before the draw step, so the draw can be watched.
        if (turn.drawnIid) {
            const p = st.p[me];
            p.hand.splice(p.hand.indexOf(turn.drawnIid), 1);
            p.deck.unshift(turn.drawnIid);
        }
        push({ v: 'start', cause: null, depth: 0, phase: 'start', decision: false, why: '' });
        if (turn.drawnIid) exec({ v: 'draw', why: 'Draw step' }, null, 0, 'start');
        steps[steps.length - 1].decision = false;
        turn.script.forEach(a => exec(a, null, 0, 'main'));
        push({ v: 'end', cause: null, depth: 0, phase: 'end', decision: false, why: '' });

        links(steps, CARDS);
        return steps;
    }

    // Why a step happened, beyond its parent: damage that added up to a
    // banish, the exerted characters a trigger counted, the characters a
    // song counted. Each link points from the step that set the board up.
    function links(steps, CARDS) {
        const entered = {}, exerted = {}, damaged = {};
        // Damage carried in from earlier turns counts as the start step's.
        const s0 = steps[0].state;
        [0, 1].forEach(p => s0.p[p].field.forEach(iid => { if (s0.c[iid].dmg) damaged[iid] = [0]; }));
        for (const s of steps) {
            s.links = [];
            if (s.v === 'play' && s.state.c[s.card] && s.state.p[s.state.c[s.card].owner].field.includes(s.card)) entered[s.card] = s.i;
            (s.actors || []).forEach(iid => { if (['sing', 'quest', 'challenge'].includes(s.v)) exerted[iid] = s.i; });
            if (s.v === 'banish') s.targets.forEach(iid => (damaged[iid] || []).forEach(j => { if (j !== s.cause) s.links.push({ from: j, kind: 'adds', card: iid, pre: j === 0 ? s0.c[iid].dmg : 0 }); }));
            if (s.v === 'dmg') (s.counts || []).forEach(iid => { if (entered[iid] != null) s.links.push({ from: entered[iid], kind: 'counts', card: iid }); });
            if (s.cond) s.cond.cards.forEach(iid => { if (exerted[iid] != null) s.links.push({ from: exerted[iid], kind: 'enables', card: iid }); });
            if (s.v === 'dmg') s.targets.forEach(iid => (damaged[iid] = damaged[iid] || []).push(s.i));
            if (s.v === 'challenge') [...s.targets, ...s.actors].forEach(iid => (damaged[iid] = damaged[iid] || []).push(s.i));
        }
    }

    // What the turn used, and what it left: for the lanes and the summaries.
    function account(turn, steps, CARDS) {
        const first = steps[0].state, last = steps[steps.length - 1].state;
        const me = first.active, op = 1 - me;
        const used = {};
        steps.forEach(s => (s.actors || []).forEach(iid => { used[iid] = s.v; }));
        const mine = last.p[me].field.filter(iid => CARDS[last.c[iid].id].type === 'Character');
        const idle = mine.filter(iid => !last.c[iid].ex && !last.c[iid].dry);
        const forgone = Object.entries(used).filter(([, v]) => v !== 'quest')
            .map(([iid, v]) => ({ iid, v, lore: CARDS[first.c[iid].id].l }));
        const gone = side => first.p[side].field.filter(iid => !last.p[side].field.includes(iid));
        return {
            me, op,
            lore: [first.p[me].lore, last.p[me].lore],
            oppLore: [first.p[op].lore, last.p[op].lore],
            inkLeft: last.p[me].inkReady, inkTotal: last.p[me].inkTotal,
            idle, forgone,
            theirLost: gone(op), myLost: gone(me),
            drawn: steps.filter(s => s.v === 'draw').reduce((n, s) => n + s.targets.length, 0),
            hand: last.p[me].hand.length,
            decisions: steps.filter(s => s.decision).length,
        };
    }

    // Compare a compiled turn with the board saved at the next node. That
    // board is after the next player's ready and draw steps, so their
    // readiness, one drawn card and one deck card are allowed to differ.
    function verify(turn, steps, CARDS) {
        const got = steps[steps.length - 1].state, want = turn.end;
        const me = got.active, op = 1 - me;
        const bag = (s, p, z, withFlags) => s.p[p][z].map(iid => {
            const c = s.c[iid];
            return CARDS[c.id].n + (CARDS[c.id].v ? ' - ' + CARDS[c.id].v : '') + (z === 'field' ? `|d${c.dmg}` + (withFlags ? `|${c.ex ? 'ex' : ''}${c.dry ? 'dry' : ''}` : '') : '');
        }).sort().join(', ');
        const out = [];
        for (const p of [me, op]) for (const z of ['field', 'discard', 'inkwell']) {
            const a = bag(got, p, z, p === me), b = bag(want, p, z, p === me);
            if (a !== b) out.push(`P${p + 1} ${z}:\n   replay: ${a}\n   saved:  ${b}`);
        }
        const ha = bag(got, me, 'hand'), hb = bag(want, me, 'hand');
        if (ha !== hb) out.push(`P${me + 1} hand: replay ${ha} | saved ${hb}`);
        for (const p of [me, op]) if (got.p[p].lore !== want.p[p].lore) out.push(`P${p + 1} lore: replay ${got.p[p].lore} | saved ${want.p[p].lore}`);
        if (got.p[me].inkTotal !== want.p[me].inkTotal || got.p[me].inkReady !== want.p[me].inkReady)
            out.push(`P${me + 1} ink: replay ${got.p[me].inkReady}/${got.p[me].inkTotal} | saved ${want.p[me].inkReady}/${want.p[me].inkTotal}`);
        return out;
    }

    const api = { compile, account, verify };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.Tape = api;
})(this);
