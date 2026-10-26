// Engine lab (Feature 68, Phase 0): the browser half of tools/engine-spike.mjs.
// Results go in #out and in window.spike (the headless run reads them from there).
(function () {
    'use strict';

    const VENDOR = '../vendor/lorcana-engine/';
    const CARD_DB = 'https://raw.githubusercontent.com/heavenideas/similcana/main/database/allCards.json';
    const onPage = new URLSearchParams(location.search).has('main');
    const out = document.getElementById('out');
    const lines = [];
    const say = (s) => { lines.push(s); out.textContent = lines.join('\n'); };
    const ms = (n) => `${n >= 100 ? n.toFixed(0) : n.toFixed(1)} ms`;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`could not load ${src}`));
            document.head.appendChild(s);
        });
    }

    // The same ops, in a worker (default) or on this page (?main=1).
    async function startEngine() {
        const t = performance.now();
        if (onPage) {
            await loadScript(VENDOR + 'engine.worker.js');
            const cards = await (await fetch(VENDOR + 'cards.json')).json();
            const init = window.DojoEngine.init(cards);
            return { call: async (op, args) => window.DojoEngine[op](args), init, startMs: performance.now() - t };
        }
        DojoRules.start(VENDOR + 'engine.worker.js');
        const init = await DojoRules.call('init', new URL(VENDOR + 'cards.json', location.href).href);
        return { call: DojoRules.call, init, startMs: performance.now() - t };
    }

    async function gunzipJson(url) {
        const res = await fetch(url);
        const stream = res.body.pipeThrough(new DecompressionStream('gzip'));
        return JSON.parse(await new Response(stream).text());
    }

    async function run(opts = {}) {
        const result = { where: onPage ? 'page' : 'worker', userAgent: navigator.userAgent, cores: navigator.hardwareConcurrency };
        lines.length = 0;
        say(`Engine in a ${result.where}, ${result.cores} cores.`);

        const engine = await startEngine();
        result.start = { ...engine.init, ms: engine.startMs };
        say(`Start (script + cards fetch, parse, index): ${ms(engine.startMs)}. ${engine.init.cards} cards.`);

        const manifest = await (await fetch('../defaults/decks/manifest.json')).json();
        const decks = await Promise.all(manifest.groups.find(g => g.title === 'Set 14').decks
            .map(async d => ({ id: d.id, text: await (await fetch('../defaults/decks/' + d.file)).text() })));

        result.games = [];
        for (let i = 0; i + 1 < decks.length && i < (opts.games ?? 4) * 2; i += 2) {
            const r = await engine.call('botGame', { deck1: decks[i].text, deck2: decks[i + 1].text, seed: 'spike-0' });
            result.games.push({ match: `${decks[i].id} v ${decks[i + 1].id}`, winner: r.winner, lore: r.lore, turns: r.turns, actions: r.action.n, actionMs: r.action.mean, actionP95: r.action.p95, turnMs: r.turn.mean, turnMax: r.turn.max, gameMs: r.totalMs });
            say(`Bot game ${decks[i].id} v ${decks[i + 1].id}: ${r.winner} ${r.lore.join('–')} in ${r.turns} turns; ${ms(r.action.mean)} per action, ${ms(r.turn.mean)} per turn (max ${ms(r.turn.max)}), ${ms(r.totalMs)} in all.`);
        }

        if (opts.roundTrip !== false) {
            const db = await (await fetch(CARD_DB)).json();
            const sn = new Map(db.cards.map(c => [c.id, c.setCode != null && c.number != null ? `${c.setCode}-${c.number}` : null]));
            const demo = await gunzipJson('../defaults/demos/set14_example2.dojo.json.gz');
            const boards = [demo.data.currentState, ...demo.data.bookmarks.map(b => JSON.parse(b.state))];
            const rt = { boards: boards.length, lossless: 0, hydrate: [], moves: [] };
            for (const s of boards) {
                const r = await engine.call('roundTrip', { board: DojoRules.boardFromState(s, id => sn.get(id) || null) });
                if (r.lossless) rt.lossless++;
                rt.hydrate.push(r.hydrateMs);
                rt.moves.push(r.movesMs);
            }
            const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
            result.roundTrip = { boards: rt.boards, lossless: rt.lossless, hydrateMs: mean(rt.hydrate), movesMs: mean(rt.moves), hydrateMax: Math.max(...rt.hydrate), movesMax: Math.max(...rt.moves) };
            say(`Demo round trip: ${rt.lossless}/${rt.boards} lossless; hydrate ${ms(result.roundTrip.hydrateMs)} (max ${ms(result.roundTrip.hydrateMax)}), legal moves ${ms(result.roundTrip.movesMs)} (max ${ms(result.roundTrip.movesMax)}).`);
        }

        result.search = [];
        for (const [i, turn] of [[0, 4], [2, 6], [4, 8]]) {
            if (!decks[i + 1]) break;
            const r = await engine.call('searchCost', { deck1: decks[i].text, deck2: decks[i + 1].text, seed: 'spike-search', turn, samples: 40 });
            result.search.push({ match: `${decks[i].id} v ${decks[i + 1].id}`, turn: r.turn, candidates: r.bare.candidates, nodeMs: r.bare.node.mean, nodeP95: r.bare.node.p95, applyMs: r.bare.apply.mean, enumerateMs: r.bare.enumerate.mean });
            say(`Search node, ${decks[i].id} turn ${r.turn}: ${r.bare.candidates} candidates, ${ms(r.bare.node.mean)} per node (p95 ${ms(r.bare.node.p95)}), about ${Math.round(1000 / r.bare.node.mean)} nodes/s.`);
        }

        window.spike = result;
        say('Done.');
        return result;
    }

    window.runSpike = run;
    document.getElementById('run').addEventListener('click', () => run().catch(e => say(`Failed: ${e.message}`)));
})();
