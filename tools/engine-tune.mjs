#!/usr/bin/env node
// Tunes the proposed-plays weights (Feature 68, WEIGHTS in tools/engine-adapter/worker.ts) by play:
// on its own turns the explorer plays the best line the search finds with the candidate weights;
// the other player, and every other choice, is the engine's default bot. Run build-engine first.
//
//   node tools/engine-tune.mjs [--games 64] [--rounds 3] [--step 1.5] [--holdout 128] [--out file.json]
//                              [--search '{"timeMs":600}'] [--baseline]   (--baseline: only score the start)
//   node tools/engine-tune.mjs --compare '{"ink":0.5}' [--holdout 256] [--tag check]
//                              the start against those weights on the same fresh games, game by game;
//                              a list ('[{"ink":0.5},{"hand":0.2}]') compares each against the start
//
// Coordinate search: each round tries every weight ×step and ÷step, keeping a change that wins more
// often than the best so far on the same games (same decks, seeds and seats: less noise). Then the
// best weights and the starting ones play `--holdout` fresh games each, which says whether the gain
// is real. `lore` sets the scale and stays 1. Prints a Markdown report.
import { availableParallelism } from 'node:os';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = join(ROOT, 'app/vendor/lorcana-engine');

if (!isMainThread) {
    // The engine logs its own rejected candidates; the report is the main thread's.
    console.log = console.warn = console.error = () => { };
    createRequire(import.meta.url)(join(VENDOR, 'engine.worker.js'));
    globalThis.DojoEngine.init(JSON.parse(readFileSync(join(VENDOR, 'cards.json'), 'utf8')));
    parentPort.on('message', ({ id, args }) => {
        let r;
        try { r = globalThis.DojoEngine.selfPlay(args); } catch (e) { r = { error: String(e && e.message || e) }; }
        parentPort.postMessage({ id, r });
    });
} else {
    const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
    const GAMES = Number(arg('--games', 64));
    const ROUNDS = Number(arg('--rounds', 3));
    const STEP = Number(arg('--step', 1.5));
    const HOLDOUT = Number(arg('--holdout', 128));
    const OUT = arg('--out', null);
    // Search settings while tuning: cheaper than the app's, so a game takes seconds. A node cap, not the
    // clock, ends a search (about what 600 ms covers), so the same weights replay the same game.
    const SEARCH = { nodes: 60, timeMs: 10000, beam: 4, perNode: 6, ...JSON.parse(arg('--search', '{}')) };
    // The adapter's WEIGHTS, as last tuned (2026-10-27), and the scoring plan's terms (study §8.1).
    const START = { lore: 1, potential: 0.6, body: 0.08, exposed: 0.4, hand: 0.11, ink: 0.525, win: 1000,
        threat: 0.6, race: 0, reply: 0 };
    const TUNED = ['potential', 'body', 'exposed', 'hand', 'ink'];

    const manifest = JSON.parse(readFileSync(join(ROOT, 'app/defaults/decks/manifest.json'), 'utf8'));
    const decks = manifest.groups.find(g => g.title === 'Set 14').decks
        .map(d => ({ id: d.id, text: readFileSync(join(ROOT, 'app/defaults/decks', d.file), 'utf8') }));
    const pairs = [];
    for (let i = 0; i < decks.length; i++) for (let j = i + 1; j < decks.length; j++) pairs.push([decks[i], decks[j]]);
    // n games over every pairing, each pairing from both seats, seeds from `tag`.
    const games = (n, tag) => Array.from({ length: n }, (_, k) => {
        const [a, b] = pairs[Math.floor(k / 2) % pairs.length];
        return { deck1: a.text, deck2: b.text, explorer: k % 2, seed: `${tag}-${Math.floor(k / (2 * pairs.length))}-${Math.floor(k / 2) % pairs.length}` };
    });

    const threads = Math.max(1, availableParallelism() - 0);
    const pool = Array.from({ length: threads }, () => new Worker(fileURLToPath(import.meta.url)));
    let nextId = 0;
    const waiting = new Map();
    pool.forEach(w => w.on('message', ({ id, r }) => { waiting.get(id)(r); waiting.delete(id); }));
    const queue = [];
    const idle = [...pool];
    const pump = () => {
        while (idle.length && queue.length) {
            const w = idle.pop();
            const { job, resolve: done } = queue.shift();
            const id = nextId++;
            waiting.set(id, (r) => { idle.push(w); done(r); pump(); });
            w.postMessage({ id, args: job });
        }
    };
    const play = (job) => new Promise(done => { queue.push({ job, resolve: done }); pump(); });

    const t0 = Date.now();
    async function evaluate(weights, list) {
        const rs = await Promise.all(list.map(g => play({ ...g, ...SEARCH, weights })));
        const ok = rs.filter(r => !r.error);
        const wins = ok.filter(r => r.explorerWon).length;
        const margin = ok.reduce((n, r) => n + Math.max(-20, Math.min(20, r.lore[0] - r.lore[1])), 0) / Math.max(1, ok.length);
        const conceded = rs.map(r => /conceded/.test(r.reason || ''));
        const concedes = conceded.filter(Boolean).length;
        const concedeWins = rs.filter((r, i) => conceded[i] && r.explorerWon).length;
        return { wins, n: ok.length, rate: wins / Math.max(1, ok.length), margin, concedes, concedeWins, errors: rs.length - ok.length, fitness: wins / Math.max(1, ok.length) + 0.005 * margin, won: rs.map(r => !r.error && r.explorerWon), conceded };
    }
    const show = (w) => Object.keys(w).filter(k => k !== 'lore' && k !== 'win').map(k => `${k} ${+w[k].toFixed(3)}`).join(' · ');
    const res = (e) => `${e.wins}/${e.n} wins (${(100 * e.rate).toFixed(0)}%), margin ${e.margin >= 0 ? '+' : ''}${e.margin.toFixed(1)} lore${e.concedes ? `, ${e.concedes} concedes (${e.concedeWins} of them wins)` : ''}${e.errors ? `, ${e.errors} errors` : ''}`;
    const log = [];
    const say = (s) => { log.push(s); console.log(s); };

    say(`## Weight tuning (${new Date().toISOString().slice(0, 10)}, ${threads} threads)`);
    say('');
    say(`Explorer (search ${JSON.stringify(SEARCH)}) against the engine's default bot. Set 14 default decks, every pairing from both seats. ${GAMES} games per try, ${ROUNDS} rounds, step ×${STEP}.`);
    say('');
    // Game by game on the same deals: of the games one set wins and the other loses, how lopsided
    // is the split? (Sign test on the discordant games.)
    // The same, leaving out games either side lost to a forced concede (upstream bot gaps, handover §7).
    const paired = (a, b) => {
        const split = (skip) => {
            let onlyA = 0, onlyB = 0;
            a.won.forEach((w, i) => { if (skip(i)) return; if (w && !b.won[i]) onlyA++; if (!w && b.won[i]) onlyB++; });
            const n = onlyA + onlyB;
            return [onlyA, onlyB, n ? (onlyB - onlyA) / Math.sqrt(n) : 0];
        };
        const [onlyA, onlyB, z] = split(() => false);
        const [cA, cB, cz] = split(i => a.conceded[i] || b.conceded[i]);
        return `Games only the start won: ${onlyA}; only the new weights won: ${onlyB}. z = ${z.toFixed(2)} (${Math.abs(z) >= 1.96 ? 'real, 95%' : 'within noise'}). Without concedes: ${cA} v ${cB}, z = ${cz.toFixed(2)}.`;
    };
    const compareArg = arg('--compare', null);
    if (compareArg) {
        // One change, or a list of them, each against the start (which plays once: games replay exactly).
        const fresh = games(HOLDOUT, arg('--tag', 'check'));
        const a = await evaluate(START, fresh);
        say(`### Against ${show(START)}, ${HOLDOUT} fresh games each`);
        say(`- Start: ${res(a)}`);
        for (const change of [JSON.parse(compareArg)].flat()) {
            const b = await evaluate({ ...START, ...change }, fresh);
            say(`- ${JSON.stringify(change)}: ${res(b)}. ${paired(a, b)}`);
        }
        say(`- ${((Date.now() - t0) / 60000).toFixed(1)} min in all.`);
        await Promise.all(pool.map(w => w.terminate()));
        process.exit(0);
    }
    const train = games(GAMES, 'tune');
    let best = { ...START };
    let bestEval = await evaluate(best, train);
    say(`- Start: ${show(best)} → ${res(bestEval)}`);
    if (process.argv.includes('--baseline')) {
        await Promise.all(pool.map(w => w.terminate()));
        process.exit(0);
    }
    const history = [{ weights: best, eval: bestEval }];
    for (let round = 1; round <= ROUNDS; round++) {
        let moved = false;
        for (const k of TUNED) {
            for (const f of [STEP, 1 / STEP]) {
                const w = { ...best, [k]: best[k] * f };
                const e = await evaluate(w, train);
                history.push({ weights: w, eval: e });
                const better = e.fitness > bestEval.fitness;
                say(`- Round ${round}, ${k} ×${f.toFixed(2)}: ${res(e)}${better ? ' **kept**' : ''}`);
                if (better) { best = w; bestEval = e; moved = true; break; }
            }
        }
        if (!moved) { say(`- Round ${round}: no change helps; stopping.`); break; }
    }
    say('');
    say(`Best on the tuning games: ${show(best)} → ${res(bestEval)}`);
    say('');
    say(`### Check on ${HOLDOUT} fresh games each`);
    const fresh = games(HOLDOUT, 'holdout');
    const [a, b] = [await evaluate(START, fresh), await evaluate(best, fresh)];
    say(`- Starting weights: ${res(a)}`);
    say(`- Tuned weights: ${res(b)}`);
    const se = Math.sqrt((a.rate * (1 - a.rate) + b.rate * (1 - b.rate)) / HOLDOUT);
    say(`- Difference ${(100 * (b.rate - a.rate)).toFixed(1)} points (± ${(100 * se).toFixed(1)}, one standard error). ${b.rate - a.rate > 2 * se ? 'Real.' : 'Within noise.'}`);
    say(`- ${paired(a, b)}`);
    say(`- ${((Date.now() - t0) / 60000).toFixed(1)} min in all.`);
    if (OUT) writeFileSync(OUT, JSON.stringify({ start: START, best, history, holdout: { start: a, best: b }, report: log }, null, 1));
    await Promise.all(pool.map(w => w.terminate()));
}
