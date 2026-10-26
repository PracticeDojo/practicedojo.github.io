// Builds _data.js for the turn replay prototypes from the Set 14 demo.
// The boards come from the demo's saved nodes; the scripts below say what
// happened in each turn, in card names, read from the session's action log
// and the cards' text. Every script is replayed and checked against the
// board saved at the next node, so a wrong script fails here.
//
//   node docs/design/turn-replay/_make-data.mjs
//
// Needs the network once for the card database (cached in $TMPDIR).
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(here, '../../..');
const Tape = createRequire(import.meta.url)('./_engine.js');

const demo = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(repo, 'app/defaults/demos/set14_example2.dojo.json.gz'))));
const cache = path.join(os.tmpdir(), 'similcana-allCards.json');
if (!fs.existsSync(cache)) {
    const r = await fetch('https://cdn.jsdelivr.net/gh/heavenideas/similcana@main/database/allCards.json');
    fs.writeFileSync(cache, Buffer.from(await r.arrayBuffer()));
}
const db = new Map(JSON.parse(fs.readFileSync(cache, 'utf8')).cards.map(c => [c.id, c]));
const nodes = new Map(Object.values(demo.data.bookmarks).map(b => [b.id, b]));
const stateOf = id => JSON.parse(nodes.get(id).state);

// --- What happened, turn by turn -------------------------------------------
const TURNS = [
    {
        id: 't4p1', title: 'Two songs, one Karnage', from: 'f8jbeokgf', to: 'gwop5bnzw',
        script: [
            { v: 'sing', singers: ['Tod - Clever Fox'], card: 'Strike a Good Match', then: [
                { v: 'draw', n: 2 },
                { v: 'discard', card: 'Chernabog' },
            ] },
            { v: 'ink', card: "Don Karnage - Khan's Courier" },
            { v: 'sing', singers: ['Angel - Siren Singer'], card: 'Akood et Emuti', why: 'Singer 3: Angel counts as cost 3', then: [
                { v: 'draw' },
            ] },
            { v: 'play', card: 'Don Karnage - Debonair Pirate', cost: 4, why: '6, less 2 from Akood et Emuti', then: [
                { v: 'ability', card: 'Don Karnage - Debonair Pirate', name: 'LASTING IMPRESSION', then: [
                    { v: 'dmg', all: true, n: 1 },
                ] },
            ] },
        ],
    },
    {
        id: 't4p2', title: 'The answer', from: 'gwop5bnzw', to: '94uqrq8yg',
        script: [
            { v: 'ink', card: 'Strength of a Raging Fire' },
            { v: 'play', card: 'Elinor' },
            { v: 'sing', singers: ['Vixey'], card: 'Strength of a Raging Fire', then: [
                { v: 'dmg', target: 'Don Karnage', n: 'chars', why: 'one for each character P2 has in play' },
            ] },
            { v: 'challenge', att: 'Darkwing Duck', def: 'Tod - Clever Fox' },
            { v: 'quest', card: 'Tod - All Alone' },
            { v: 'quest', card: 'White Rabbit' },
            { v: 'ability', phase: 'end', card: 'Elinor', name: 'COORDINATED EFFORTS', when: 'At the end of your turn',
                cond: { text: '3 or more exerted characters', exerted: 3 }, then: [
                    { v: 'dmg', target: 'Don Karnage', n: 1 },
                    { v: 'lore', n: 1 },
                    { v: 'draw' },
                ] },
        ],
    },
    {
        id: 't8p1', title: 'Circle of Life', from: '1oieymyd4', to: 'm70mfaez0',
        script: [
            { v: 'ink', card: 'Meilin Lee' },
            { v: 'play', card: 'Circle of Life', then: [
                { v: 'play', card: 'Prince Phillip', from: 'discard', why: 'Circle of Life: a character from your discard, free', then: [
                    { v: 'ability', card: 'Prince Phillip', name: 'SWIFT AND SURE', then: [
                        { v: 'banish', all: 'damaged', why: 'every opposing damaged character' },
                    ] },
                ] },
            ] },
            { v: 'quest', card: 'Max Goof - Chart Topper', then: [
                { v: 'ability', card: 'Max Goof - Chart Topper', name: 'NUMBER ONE HIT', then: [
                    { v: 'play', card: 'Akood et Emuti', from: 'discard', why: 'a song of cost 4 or less from your discard, free', then: [
                        { v: 'draw' },
                    ] },
                ] },
            ] },
        ],
        notes: ['NUMBER ONE HIT puts the song on the bottom of the deck afterwards; this session left Akood et Emuti in the discard (it was moved there on turn 9).'],
    },
    {
        id: 't10p1', title: 'The wipe', from: 'yo81l1ci5', to: 'pa9z5qukp',
        script: [
            { v: 'quest', card: 'Max Goof - Chart Topper', then: [
                { v: 'ability', card: 'Max Goof - Chart Topper', name: 'NUMBER ONE HIT', then: [
                    { v: 'play', card: 'Malicious, Mean, and Scary', from: 'discard', why: 'a song of cost 4 or less from your discard, free', then: [
                        { v: 'dmg', all: true, n: 1, why: 'a damage counter on each opposing character' },
                        { v: 'bottom', card: 'Malicious, Mean, and Scary' },
                    ] },
                ] },
            ] },
            { v: 'play', card: 'To Wither a Flower', then: [
                { v: 'dmg', all: 'damaged', n: 2, why: 'each opposing damaged character' },
            ] },
            { v: 'quest', card: 'Prince Phillip' },
            { v: 'quest', card: 'Milo Thatch' },
            { v: 'quest', card: 'Don Karnage' },
        ],
        notes: ['The session charged 3 ink for Malicious, Mean, and Scary, which NUMBER ONE HIT plays for free: it ended the turn with 1 ink ready, the replay with 4.'],
        allow: ['ink'],
    },
    {
        id: 't9p2a', title: 'Put pressure', from: 'y4cc5yeri', to: 'yo81l1ci5', fork: 'a',
        script: [
            { v: 'ink', card: 'Strength of a Raging Fire' },
            { v: 'play', card: 'Vixey' },
            { v: 'quest', card: 'The Queen' },
            { v: 'quest', card: 'Darkwing Duck' },
        ],
    },
    {
        id: 't9p2b', title: 'Fight back', from: 'xa7aoz492', to: 't4riiv23h', fork: 'b',
        script: [
            { v: 'challenge', att: 'The Queen', def: 'Max Goof - Chart Topper' },
            { v: 'ink', card: 'Strength of a Raging Fire' },
            { v: 'play', card: 'Angel - Experiment 624' },
            { v: 'ability', card: 'Angel - Experiment 624', name: 'GOOD AIM', why: 'once during your turn', then: [
                { v: 'discard', card: 'Elinor' },
                { v: 'dmg', target: 'Don Karnage', n: 2 },
            ] },
            { v: 'quest', card: 'Darkwing Duck' },
        ],
    },
];

// --- Boards ----------------------------------------------------------------
const used = new Set();
function compact(s) {
    const c = {};
    const p = s.players.map((pl, owner) => {
        const ids = z => (pl[z] || []).map(x => {
            used.add(x.cardId);
            c[x.instanceId] = { id: x.cardId, owner, dmg: x.damage || 0, ex: !!x.exerted, dry: !!x.drying };
            return x.instanceId;
        });
        return { lore: pl.lore, inkTotal: pl.inkTotal, inkReady: pl.inkReady,
            deck: ids('deck'), hand: ids('hand'), field: ids('field'), inkwell: ids('inkwell'), discard: ids('discard') };
    });
    return { turn: s.turn, active: s.activePlayer, p, c };
}

const out = [];
let failed = 0;
for (const t of TURNS) {
    const s0 = stateOf(t.from);
    const start = compact(s0);
    const drawn = (s0.turnActions.drawn || [])[0];
    const hand = start.p[start.active].hand;
    const drawnIid = drawn != null ? [...hand].reverse().find(iid => start.c[iid].id === drawn) : null;
    const turn = { ...t, turn: s0.turn, active: s0.activePlayer, note: (nodes.get(t.from).comment || '').split('**Turn recap**')[0].trim(),
        start, end: compact(stateOf(t.to)), drawnIid };
    out.push(turn);
}

const CARDS = {};
for (const id of used) {
    const c = db.get(id);
    CARDS[id] = {
        n: c.name, v: c.version || '', type: c.type, cost: c.cost, s: c.strength ?? null, w: c.willpower ?? null, l: c.lore ?? null,
        ink: String(c.color || '').split('-').map(x => x.toLowerCase()), inkable: !!c.inkwell,
        img: c.images && (c.images.thumbnail || c.images.full) || '', text: c.fullText || '',
    };
}

for (const turn of out) {
    const steps = Tape.compile(JSON.parse(JSON.stringify(turn)), CARDS);
    const diffs = Tape.verify(turn, steps, CARDS).filter(d => !(turn.allow || []).some(k => d.includes(' ' + k + ':')));
    console.log(`${turn.id.padEnd(6)} ${String(steps.length).padStart(2)} steps  ${diffs.length ? 'DIFFERS' : 'matches the saved board'}`);
    diffs.forEach(d => console.log('  ' + d));
    failed += diffs.length;
}

// --- The lore race of every line through the fork (for D) -------------------
function line(leaf) {
    const pts = [];
    for (let id = leaf; id; id = nodes.get(id).parentId) {
        const s = stateOf(id), b = nodes.get(id);
        pts.unshift({ id, turn: s.turn, active: s.activePlayer, lore: s.players.map(p => p.lore), name: b.name, over: /Game Over/.test(b.name) });
    }
    return pts;
}
const FORK = { at: '0na1u5s3f', a: { node: 'y4cc5yeri', leaf: 'x9qxue980', line: line('x9qxue980') }, b: { node: 'xa7aoz492', leaf: '7zubrdau1', line: line('7zubrdau1') } };

const file = `/* Generated by _make-data.mjs from app/defaults/demos/set14_example2.dojo.json.gz. Don't edit. */
window.CARDS = ${JSON.stringify(CARDS)};
window.TURNS = ${JSON.stringify(out)};
window.FORK = ${JSON.stringify(FORK)};
`;
fs.writeFileSync(path.join(here, '_data.js'), file);
console.log(`_data.js: ${out.length} turns, ${Object.keys(CARDS).length} cards, ${(file.length / 1024).toFixed(0)} KB`);
if (failed) process.exitCode = 1;
