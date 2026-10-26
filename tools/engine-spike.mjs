#!/usr/bin/env node
// Phase 0 numbers for Feature 68 (docs/RSC-lorcana-engine.md §9), measured in Node on the built
// engine (run tools/build-engine.mjs first). Prints a Markdown report.
//
//   node tools/engine-spike.mjs [--games 3] [--json]
//
// 1. Bot-vs-bot games between the Set 14 default decks.
// 2. Every board of the Set 14 demo through hydrate → legal moves → project, compared field by field.
// 3. The cost of one search node (restore, apply a candidate, list the next ones, serialise).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR = join(ROOT, 'app/vendor/lorcana-engine');
const CACHE = process.env.DOJO_ENGINE_CACHE || join(tmpdir(), 'dojo-engine-build');
const CARD_DB_URL = 'https://raw.githubusercontent.com/heavenideas/similcana/main/database/allCards.json';
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const GAMES = Number(arg('--games', 3));

globalThis.window = globalThis; // app/js/*.js modules attach to window
const require = createRequire(import.meta.url);
require(join(VENDOR, 'engine.worker.js'));
require(join(ROOT, 'app/js/rules.js'));
const E = globalThis.DojoEngine;
const R = globalThis.DojoRules;

const t0 = performance.now();
const init = E.init(JSON.parse(readFileSync(join(VENDOR, 'cards.json'), 'utf8')));
const initMs = performance.now() - t0;

// The Dojo's card DB (LorcanaJSON), for numeric card id → "<setCode>-<number>".
const dbFile = join(CACHE, 'allCards.json');
if (!existsSync(dbFile)) {
    mkdirSync(CACHE, { recursive: true });
    execFileSync('curl', ['-sSfL', '-o', dbFile, CARD_DB_URL]);
}
const db = JSON.parse(readFileSync(dbFile, 'utf8'));
const snById = new Map(db.cards.map(c => [c.id, c.setCode != null && c.number != null ? `${c.setCode}-${c.number}` : null]));
const snOf = (id) => snById.get(id) || null;

const fmt = (n) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2));
const st = (s) => `mean ${fmt(s.mean)} · p50 ${fmt(s.p50)} · p95 ${fmt(s.p95)} · max ${fmt(s.max)} ms (n=${s.n})`;
const out = [];
const log = (line = '') => out.push(line);

log(`## Engine spike (Node ${process.version}, ${new Date().toISOString().slice(0, 10)})`);
log();
log(`Engine ${readFileSync(join(VENDOR, 'VERSION'), 'utf8').trim().slice(0, 9)}. Catalogue: ${init.cards} cards, ${init.printings} printings; parse + index ${fmt(initMs)} ms.`);

// 1. Bot games.
const manifest = JSON.parse(readFileSync(join(ROOT, 'app/defaults/decks/manifest.json'), 'utf8'));
const decks = manifest.groups.find(g => g.title === 'Set 14').decks
    .map(d => ({ id: d.id, text: readFileSync(join(ROOT, 'app/defaults/decks', d.file), 'utf8') }));
log();
log('### Bot vs bot');
log();
log('| Match | Seed | Winner | Lore | Turns | Actions | Per action | Per turn | Game | Fails / fallbacks |');
log('|---|---|---|---|---|---|---|---|---|---|');
const allActions = [];
const allTurns = [];
for (let g = 0; g < GAMES; g++) {
    for (let i = 0; i < decks.length; i += 2) {
        const a = decks[i], b = decks[(i + 1) % decks.length];
        const seed = `spike-${g}`;
        const r = E.botGame({ deck1: a.text, deck2: b.text, seed });
        if (r.error) { log(`| ${a.id} v ${b.id} | ${seed} | ${r.error}: ${r.missing.join(', ')} | | | | | | | |`); continue; }
        allActions.push(r.action.mean);
        allTurns.push(r.turn.mean);
        log(`| ${a.id} v ${b.id} | ${seed} | ${r.winner ?? '—'} | ${r.lore.join('–')} | ${r.turns} | ${r.action.n} | ${fmt(r.action.mean)} ms (p95 ${fmt(r.action.p95)}) | ${fmt(r.turn.mean)} ms (max ${fmt(r.turn.max)}) | ${fmt(r.totalMs)} ms | ${r.failures} / ${JSON.stringify(r.fallbacks)} ${r.reason ?? ""} |`);
    }
}
const avg = (xs) => xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
log();
log(`Mean of game means: ${fmt(avg(allActions))} ms per action, ${fmt(avg(allTurns))} ms per turn.`);

// 2. Demo round trips.
const demo = JSON.parse(gunzipSync(readFileSync(join(ROOT, 'app/defaults/demos/set14_example2.dojo.json.gz'))).toString());
const boards = [demo.data.currentState, ...demo.data.bookmarks.map(b => JSON.parse(b.state))];
let lossless = 0;
const diffCounts = {};
const unknown = new Set();
const hyd = [], mov = [], proj = [];
let firstDiff = null;
for (const s of boards) {
    const r = E.roundTrip({ board: R.boardFromState(s, snOf) });
    hyd.push(r.hydrateMs); mov.push(r.movesMs); proj.push(r.projectMs);
    r.unknown.forEach(u => unknown.add(u));
    if (r.lossless) lossless++;
    else {
        r.diffs.forEach(d => { const k = d.split(':')[0].replace(/^p\d\./, 'pN.'); diffCounts[k] = (diffCounts[k] || 0) + 1; });
        firstDiff ??= r.diffs.slice(0, 3);
    }
}
const sumStats = (xs) => { const s = [...xs].sort((a, b) => a - b); return { n: xs.length, mean: avg(xs), p50: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1] }; };
log();
log('### Demo round trip (hydrate → legal moves → project)');
log();
log(`- Boards: ${boards.length}, lossless: **${lossless}**.`);
log(`- Hydrate: ${st(sumStats(hyd))}`);
log(`- getAvailableMoves: ${st(sumStats(mov))}`);
log(`- Project: ${st(sumStats(proj))}`);
log(`- Card ids the engine doesn't know: ${unknown.size ? [...unknown].join(', ') : 'none'}`);
if (firstDiff) log(`- Differences by field: ${JSON.stringify(diffCounts)}. First: ${firstDiff.join(' · ')}`);

// 3. Search node cost.
log();
log('### One search node');
log();
for (const [i, turn] of [[0, 4], [2, 6], [4, 8]]) {
    const r = E.searchCost({ deck1: decks[i].text, deck2: decks[i + 1].text, seed: 'spike-search', turn, samples: 40 });
    log(`- ${decks[i].id} v ${decks[i + 1].id}, turn ${r.turn}: state ${fmt(r.stateKb)} KB (with undo stack ${fmt(r.fullSnapshotKb)} KB); bare server built in ${fmt(r.bareMs)} ms.`);
    for (const k of ['harness', 'bare']) {
        const m = r[k];
        log(`  - ${k}: ${m.candidates} candidates (enumerate ${fmt(m.enumerateMs)} ms). Per node: restore ${fmt(m.restore.mean)}, apply ${fmt(m.apply.mean)} (p95 ${fmt(m.apply.p95)}), enumerate ${fmt(m.enumerate.mean)}, serialise ${fmt(m.serialise.mean)} → **${fmt(m.node.mean)} ms** (p95 ${fmt(m.node.p95)}), about ${Math.round(1000 / m.node.mean)} nodes/s`);
    }
}

console.log(process.argv.includes('--json') ? JSON.stringify(out) : out.join('\n'));
