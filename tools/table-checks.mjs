// Two-player tables (Features 64–65), headless: two browsers at one table.
// Run by tools/app-checks.mjs (and by `node tools/table-checks.mjs` on its own).
//
// Supabase is replaced by a stand-in that lives here, in Node: the table rows, their
// files and the live channel, with the same rules as supabase/migrations/*_tables.sql
// (seats, the revision check, claim-then-upload). Each page's DojoCloud table functions
// call it through an exposed function, and channel messages are pushed back in.
// The SQL itself is tested by supabase/tests/run.sh.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// --- The stand-in backend -------------------------------------------------------------
export function makeServer() {
    const tables = new Map();          // id → { row, file }
    const tabs = new Map();            // tab → { id, uid, seat, name, push }
    const offline = new Set();         // uids whose network is off
    let n = 0;
    const err = (code, extra) => ({ error: code, ...extra });
    const seated = (t, uid) => t && (t.row.seat0 === uid || t.row.seat1 === uid);
    const rowOut = (t) => ({ ...t.row });
    const presence = (id) => [...tabs.entries()].filter(([, x]) => x.id === id).map(([tab, x]) => ({ seat: x.seat, name: x.name, tab }));
    const pushPresence = (id) => {
        const list = presence(id);
        for (const [, x] of tabs) if (x.id === id && !offline.has(x.uid)) x.push('presence', list);
    };

    const ops = {
        invite(uid, { id }) {
            const t = tables.get(id);
            if (!t) return null;
            const r = t.row;
            return {
                title: r.title, summary: r.summary, names: [r.name0, r.name1],
                free_seats: [r.seat0 ? null : 0, r.seat1 ? null : 1].filter(x => x !== null),
                mine: r.seat0 === uid ? 0 : r.seat1 === uid ? 1 : null
            };
        },
        create(uid, { title, seat, name, file, summary, turnSeat }) {
            const id = ('Tbl' + (++n).toString().padStart(7, '0')).slice(0, 10);
            const row = {
                id, seat0: seat ? null : uid, seat1: seat ? uid : null, name0: seat ? null : name, name1: seat ? name : null,
                title, revision: 1, turn_seat: turnSeat ? 1 : 0, summary, proposal: null, file_bytes: file.length, updated_at: new Date().toISOString()
            };
            tables.set(id, { row, file });
            return { id, revision: 1, uid };
        },
        join(uid, { id, seat, name }) {
            const t = tables.get(id);
            if (!t) return err('gone');
            if (seated(t, uid)) return { ...rowOut(t), uid };
            if (t.row[`seat${seat}`]) return err('seat_taken');
            t.row[`seat${seat}`] = uid;
            t.row[`name${seat}`] = name;
            return { ...rowOut(t), uid };
        },
        getMany(uid, { ids }) {
            return ids.map(id => tables.get(id)).filter(t => seated(t, uid)).map(rowOut);
        },
        get(uid, { id }) {
            const t = tables.get(id);
            return seated(t, uid) ? rowOut(t) : null;
        },
        download(uid, { id }) {
            const t = tables.get(id);
            return seated(t, uid) ? t.file : err('gone');
        },
        // The row is claimed first and the file lands a moment later, as in cloud.js.
        async save(uid, { id, revision, file, summary, turnSeat, title }) {
            const t = tables.get(id);
            if (!seated(t, uid)) return err('gone');
            if (t.row.revision !== revision) return err('conflict', { current: t.row.revision });
            Object.assign(t.row, { revision: revision + 1, turn_seat: turnSeat ? 1 : 0, summary, file_bytes: file.length, updated_at: new Date().toISOString() });
            if (title) t.row.title = title;
            await sleep(30);
            t.file = file;
            return revision + 1;
        },
        setProposal(uid, { id, proposal }) {
            const t = tables.get(id);
            if (!seated(t, uid)) return err('gone');
            t.row.proposal = proposal || null;
            return rowOut(t);
        },
        leave(uid, { id }) {
            const t = tables.get(id);
            if (!seated(t, uid)) return true;
            if (t.row.seat0 === uid) { t.row.seat0 = null; t.row.name0 = null; }
            if (t.row.seat1 === uid) { t.row.seat1 = null; t.row.name1 = null; }
            t.row.proposal = null;
            if (!t.row.seat0 && !t.row.seat1) { tables.delete(id); return true; }
            return false;
        },
        freeSeat(uid, { id, seat }) {
            const t = tables.get(id);
            if (!t || t.row[`seat${1 - seat}`] !== uid) return err('gone');
            t.row[`seat${seat}`] = null; t.row[`name${seat}`] = null; t.row.proposal = null;
            return rowOut(t);
        },
        chanOpen(uid, { id, tab, seat, name }, push) {
            if (!seated(tables.get(id), uid)) return err('gone');
            tabs.set(tab, { id, uid, seat, name, push });
            pushPresence(id);
            return true;
        },
        chanSend(uid, { id, tab, event, payload }) {
            for (const [other, x] of tabs) {
                if (other !== tab && x.id === id && !offline.has(x.uid)) x.push(event, payload);
            }
            return true;
        },
        chanClose(uid, { id, tab }) {
            tabs.delete(tab);
            pushPresence(id);
            return true;
        }
    };

    // A page's calls: the exposed function's handler, with its push for channel messages.
    function bind(uid, page) {
        let chain = Promise.resolve();
        const push = (tab) => (event, payload) => {
            chain = chain.then(() => page.evaluate(([tab, event, payload]) => window.__tablePush && window.__tablePush(tab, event, payload), [tab, event, payload]).catch(() => { }));
        };
        page.on('close', () => {
            const gone = [...tabs.entries()].filter(([, x]) => x.page === page);
            gone.forEach(([tab, x]) => { tabs.delete(tab); pushPresence(x.id); });
        });
        return async (op, args) => {
            await sleep(5 + Math.random() * 15);
            if (offline.has(uid)) return { error: 'offline' };
            const res = await ops[op](uid, args || {}, push(args && args.tab));
            if (op === 'chanOpen' && tabs.has(args.tab)) tabs.get(args.tab).page = page;
            return res && res.error ? res : { ok: res === undefined ? null : res };
        };
    }

    return { bind, offline, tables };
}

// --- In the page: DojoCloud's table functions, on the stand-in ---------------------------
export function shim() {
    const install = () => {
        if (window.__tableShim || typeof DojoCloud === 'undefined') return;
        window.__tableShim = true;
        window.__tableChans = {};
        const call = async (op, args) => {
            const r = await window.__tableRpc(op, args);
            if (r && r.error) { const e = new Error(r.error); e.code = r.error; if (r.current != null) e.current = r.current; throw e; }
            return r.ok;
        };
        const toB64 = async (blob) => {
            const bytes = new Uint8Array(await blob.arrayBuffer());
            let s = '';
            for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            return btoa(s);
        };
        const fromB64 = (b64) => Uint8Array.from(atob(b64), ch => ch.charCodeAt(0)).buffer;
        DojoCloud.hasIdentity = () => true;
        DojoCloud.tableInvite = (id) => call('invite', { id });
        DojoCloud.createTable = async (o) => {
            const r = await call('create', { title: o.title, seat: o.seat, name: o.name, summary: o.summary, turnSeat: o.turnSeat, file: await toB64(o.blob) });
            return { ...r, url: DojoCloud.tableUrl(r.id) };
        };
        DojoCloud.joinTable = (id, seat, name) => call('join', { id, seat, name });
        DojoCloud.getTables = (ids) => call('getMany', { ids });
        DojoCloud.getTable = (id) => call('get', { id });
        DojoCloud.downloadTable = async (id) => fromB64(await call('download', { id }));
        DojoCloud.saveTable = async (id, o) => call('save', { id, revision: o.revision, summary: o.summary, turnSeat: o.turnSeat, title: o.title, file: await toB64(o.blob) });
        DojoCloud.setProposal = (id, proposal) => call('setProposal', { id, proposal });
        DojoCloud.leaveTable = (id) => call('leave', { id });
        DojoCloud.freeSeat = (id, seat) => call('freeSeat', { id, seat });
        DojoCloud.tableChannel = async (id, me, on) => {
            const tab = Math.random().toString(36).slice(2, 12);
            window.__tableChans[tab] = on;
            await call('chanOpen', { id, tab, seat: me.seat, name: me.name });
            if (on.status) on.status('live');
            const send = (event) => (payload) => { call('chanSend', { id, tab, event, payload }).catch(() => { }); };
            return {
                tab, sendBoard: send('board'), sendTable: send('table'),
                close: () => { delete window.__tableChans[tab]; call('chanClose', { id, tab }).catch(() => { }); }
            };
        };
        window.__tablePush = (tab, event, payload) => {
            const on = window.__tableChans[tab];
            if (on && on[event]) on[event](payload);
        };
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
    else install();
}

// --- The run ------------------------------------------------------------------------------
export async function runTableChecks(page, { base }) {
    const out = [];
    const check = (name, got, want) => out.push({ name: 'tables: ' + name, ok: got === want, got: String(got), want: String(want) });
    const server = makeServer();
    const browser = page.context().browser();
    const T = 20000;

    // Ann: the page the demo is already open in.
    await page.exposeFunction('__tableRpc', server.bind('ann', page));
    await page.evaluate(shim);

    // Bea: her own browser profile (device library, identity).
    const vp = page.viewportSize();
    const ctxB = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    await ctxB.addInitScript(() => {
        try { localStorage.setItem('lorcana_dojo_help', JSON.stringify({ offer: 'dismissed', toldAboutHelp: true, helpSeen: true })); } catch (e) { }
    });
    const open = async (ctx, uid, url) => {
        const p = await ctx.newPage();
        p.on('pageerror', e => console.log(`[${uid}] page error: ${e.message}`));
        await p.exposeFunction('__tableRpc', server.bind(uid, p));
        await p.addInitScript(shim);
        await p.goto(url, { waitUntil: 'domcontentloaded' });
        return p;
    };
    const dlgFill = (p, v) => p.fill('.dlg-backdrop .dlg input', v);
    const dlgClick = (p, text) => p.click(`.dlg-backdrop .dlg-foot button:has-text("${text}")`);
    const until = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: T }).then(() => true, () => false);
    const sig = (p) => p.evaluate(() => App.boardSig(App.state));
    // Same board on both sides, or where they differ (a top-level key, then a player's zone).
    const same = async (p, q) => {
        const [a, b] = [JSON.parse(await sig(p)), JSON.parse(await sig(q))];
        const diffs = [];
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
            if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
            if (k === 'players') a.players.forEach((pl, i) => Object.keys(pl).forEach(z => {
                if (JSON.stringify(pl[z]) !== JSON.stringify(b.players[i][z])) diffs.push(`P${i + 1}.${z}`);
            }));
            else diffs.push(`${k}: ${JSON.stringify(a[k]).slice(0, 80)} vs ${JSON.stringify(b[k]).slice(0, 80)}`);
        }
        return diffs.length ? diffs.join('; ') : 'same';
    };
    const val = (p, fn, arg) => p.evaluate(fn, arg);
    const holder = async (A, B) => (await val(A, () => DojoTable.holdsPen())) ? [A, B] : [B, A];

    try {
        // 1. Play with a friend: Ann sits on the side whose turn it is.
        const ap = await val(page, () => App.state.activePlayer);
        await page.click('#btn-session-table');
        await dlgFill(page, 'Ann');
        await dlgClick(page, 'Next');
        await page.click(`.dlg-backdrop .dlg-foot button >> nth=${ap}`);
        await page.waitForSelector('.dlg-backdrop input[readonly]', { timeout: T });
        const url = await page.inputValue('.dlg-backdrop input');
        await dlgClick(page, 'Done');
        check('create: a ?t= link', /\/app\/\?t=[A-Za-z0-9]{10}$/.test(url), true);
        check('create: Ann holds the pen', await until(page, () => App.atTable() && DojoTable.holdsPen()), true);
        check('create: the address bar keeps the table', await val(page, () => new URLSearchParams(location.search).has('t')), true);
        const A = page;

        // 2. Bea opens the link and joins the other seat.
        const B = await open(ctxB, 'bea', url);
        await B.waitForSelector('.dlg-backdrop .dlg input', { timeout: 90000 });
        await dlgFill(B, 'Bea');
        await dlgClick(B, 'Join table');
        check('join: Bea is at the table', await until(B, () => App.atTable()), true);
        check('join: Bea has the other seat', await val(B, () => App.session.table.seat), 1 - ap);
        check('join: Bea watches', await val(B, () => App.isWatching()), true);
        check('join: same board on both sides', await same(B, A), 'same');
        check('join: same multiverse', await val(B, () => App.bookmarks.length), await val(A, () => App.bookmarks.length));
        check('live: Ann sees Bea at the table', await until(A, () => DojoTable.info().otherHere), true);
        check('hands: Ann\'s hand is face down for Bea', await val(B, () => {
            const cards = [...document.querySelectorAll('#bottom-hand .card')];
            return cards.length > 0 && cards.every(c => c.classList.contains('card-back'));
        }), true);
        check('hands: Bea\'s own hand is face up', await val(B, () => ![...document.querySelectorAll('#top-hand .card')].some(c => c.classList.contains('card-back'))), true);
        check('chip: Ann reads "Live with Bea · Your turn"', await until(A, () => document.getElementById('table-chip-text').textContent === 'Live with Bea · Your turn'), true);

        // 3. Live: Ann draws; Bea sees it within a second or so.
        const handBefore = await val(A, (s) => App.state.players[s].hand.length, ap);
        await val(A, (s) => App.drawCard(s), ap);
        check('live: Ann\'s move reaches Bea', await until(B, ([s, n]) => App.state.players[s].hand.length === n, [ap, handBefore + 1]), true);
        check('live: boards match after the move', await same(B, A), 'same');

        // 4. The pen: Bea can't act on Ann's turn.
        const before = await sig(B);
        await B.click('#btn-end-turn', { force: true });
        await B.keyboard.press('Space');
        await sleep(600);
        check('pen: Bea\'s End turn does nothing on Ann\'s turn', await sig(B) === before, true);
        check('pen: Ann\'s board is untouched', await sig(A) === before, true);

        // 5. End turn hands the pen over, with the new node and the undo history.
        const nodes = await val(A, () => App.bookmarks.length);
        await A.click('#btn-end-turn');
        check('end turn: Bea holds the pen', await until(B, () => DojoTable.holdsPen()), true);
        check('end turn: Ann watches', await val(A, () => App.isWatching()), true);
        check('end turn: the turn\'s node reaches Bea', await val(B, () => App.bookmarks.length), nodes + 1);
        check('end turn: Bea has the undo history', await val(B, () => App.history.length > 0), true);
        check('end turn: boards match', await same(B, A), 'same');
        check('hands: Bea\'s hand at the bottom is hers, face up', await val(B, () => ![...document.querySelectorAll('#bottom-hand .card')].some(c => c.classList.contains('card-back'))), true);

        // 6. Undo by the new holder gives the turn back.
        for (let i = 0; i < 4 && !(await val(A, () => DojoTable.holdsPen())); i++) {
            await B.click('#btn-undo');
            await sleep(400);
        }
        check('undo: Bea\'s Undo gives Ann the turn back', await until(A, () => DojoTable.holdsPen()), true);
        check('undo: boards match', await same(B, A), 'same');
        await A.click('#btn-end-turn');
        check('end turn again: Bea holds the pen', await until(B, () => DojoTable.holdsPen()), true);

        // 7. Moving the table: Bea asks to go back two nodes; Ann says Go there.
        const target = await val(B, () => App.bookmarks[App.bookmarks.length - 3].id);
        await val(B, (id) => App.restoreTimeline(id, false), target);
        check('propose: Bea\'s board stays put', await val(B, (id) => App.state.activeBookmarkId !== id, target), true);
        check('propose: Ann is asked', await until(A, () => !document.getElementById('table-banner').classList.contains('hidden') && !!document.querySelector('#table-banner [data-act="go"]')), true);
        await A.click('#table-banner [data-act="go"]');
        check('propose: both boards go there', await until(B, (id) => App.state.activeBookmarkId === id, target), true);
        check('propose: Ann is there too', await val(A, () => App.state.activeBookmarkId), target);
        check('propose: boards match', await same(B, A), 'same');
        check('propose: the proposal is cleared', await until(B, () => !DojoTable.info().proposal), true);

        // 8. A proposal refused: the watcher asks, the holder stays.
        let [P, W] = await holder(A, B);
        const other = await val(W, () => App.bookmarks[1].id);
        const atBefore = await val(P, () => App.state.activeBookmarkId);
        await val(W, (id) => App.restoreTimeline(id, false), other);
        check('refuse: the holder is asked', await until(P, () => !!document.querySelector('#table-banner [data-act="stay"]')), true);
        await P.click('#table-banner [data-act="stay"]');
        check('refuse: the watcher\'s proposal clears', await until(W, () => !DojoTable.info().proposal), true);
        check('refuse: the table stays', await val(P, () => App.state.activeBookmarkId), atBefore);

        // 9. A conflict keeps both boards: the holder asks to move, goes offline and
        // plays on; the other accepts. Back online, the move wins and the holder's
        // board is kept as "Left here".
        [P, W] = await holder(A, B);
        const pUid = P === A ? 'ann' : 'bea';
        const z = await val(P, () => App.bookmarks[2].id);
        await val(P, (id) => App.restoreTimeline(id, false), z);
        check('conflict: the other seat is asked', await until(W, () => !!document.querySelector('#table-banner [data-act="go"]')), true);
        server.offline.add(pUid);
        const seat = await val(P, () => App.state.activePlayer);
        await val(P, (s) => App.drawCard(s), seat);
        const kept = await val(P, () => JSON.stringify(App.compressState(App.state, true)));
        await sleep(200);
        await W.click('#table-banner [data-act="go"]');
        check('conflict: the other seat moved', await until(W, (id) => App.state.activeBookmarkId === id, z), true);
        server.offline.delete(pUid);
        await val(P, () => DojoTable.flush());
        check('conflict: the holder lands on the move', await until(P, (id) => App.state.activeBookmarkId === id, z), true);
        check('conflict: the holder\'s board is kept as "Left here"', await val(P, (st) => App.autoSaves.some(a => a.state === st), kept), true);
        check('conflict: the other seat gets that snapshot too', await until(W, (st) => App.autoSaves.some(a => a.state === st), kept), true);
        check('conflict: boards match', await same(W, P), 'same');

        // 10. By turns: Bea closes her tab; Ann plays and ends her turn; Bea comes back
        // to "Your turn" in the library and picks up where Ann left the table.
        [P, W] = await holder(A, B);
        if (P === B) { await B.click('#btn-end-turn'); await until(A, () => DojoTable.holdsPen()); }
        await B.close();
        check('by turns: Ann sees Bea leave', await until(A, () => !DojoTable.info().otherHere), true);
        check('chip: "Bea is away"', await until(A, () => /^Bea is away/.test(document.getElementById('table-chip-text').textContent)), true);
        const annSeat = await val(A, () => App.session.table.seat);
        await val(A, (s) => App.drawCard(s), annSeat);
        await A.click('#btn-end-turn');
        check('by turns: the table waits for Bea', await until(A, () => App.isWatching() && !DojoTable.info().pending), true);
        check('by turns: the banner says so', await val(A, () => /plays next/.test(document.getElementById('table-banner-text').textContent)), true);
        const B2 = await open(ctxB, 'bea', base + '/app/');
        check('by turns: Bea\'s library says "Your turn"', await until(B2, () => /Your turn/.test((document.querySelector('#home-recent .rec') || {}).textContent || '')), true);
        await B2.click('#home-recent .rec');
        check('by turns: Bea is back at the table', await until(B2, () => App.atTable() && DojoTable.holdsPen()), true);
        check('by turns: Bea sees Ann\'s turn', await same(B2, A), 'same');
        check('live again: Ann sees Bea return', await until(A, () => DojoTable.info().otherHere), true);
        const bh = await val(B2, (s) => App.state.players[s].hand.length, 1 - annSeat);
        await val(B2, (s) => App.drawCard(s), 1 - annSeat);
        check('live again: Bea\'s move reaches Ann', await until(A, ([s, n]) => App.state.players[s].hand.length === n, [1 - annSeat, bh + 1]), true);

        // 11. Leaving: Bea's copy stays hers; Ann's seat is alone at the table.
        await val(B2, () => { App.leaveTable(); });
        await dlgClick(B2, 'Leave');
        check('leave: Bea is no longer at the table', await until(B2, () => !App.atTable() && !App.session.table), true);
        check('leave: Bea keeps her copy', await val(B2, () => !!App.session && App.state.players.length === 2), true);
        await val(A, () => DojoTable.sync());
        check('leave: Ann waits for a player', await until(A, () => /^Waiting for a player/.test(document.getElementById('table-chip-text').textContent)), true);
        await ctxB.close();
    } catch (e) {
        out.push({ name: 'tables: run', ok: false, got: 'threw: ' + (e && e.message ? e.message.split('\n')[0] : e), want: 'no error' });
        await ctxB.close().catch(() => { });
    }
    return out;
}

// --- As a steps module, and from the command line -----------------------------------------
export default async (page, info) => {
    writeFileSync(process.env.TABLE_CHECKS_OUT, JSON.stringify(await runTableChecks(page, info)));
};

export function runHeadless(root) {
    const dir = mkdtempSync(join(tmpdir(), 'table-checks-'));
    const out = join(dir, 'results.json');
    const r = spawnSync(process.execPath, [
        join(root, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--demo', '--widths', '1440', '--themes', 'day', '--steps', fileURLToPath(import.meta.url), '--out', dir
    ], { cwd: root, encoding: 'utf8', env: { ...process.env, TABLE_CHECKS_OUT: out } });
    (r.stdout || '').split('\n').filter(l => /page error/.test(l)).forEach(l => console.log(l.slice(0, 500)));
    try { return JSON.parse(readFileSync(out, 'utf8')); } catch (e) {
        console.error(r.stdout || '', r.stderr || '', '\ntable-checks: the headless run gave no results (see above).');
        return null;
    } finally { rmSync(dir, { recursive: true, force: true }); }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const rows = runHeadless(join(dirname(fileURLToPath(import.meta.url)), '..'));
    if (!rows) process.exit(2);
    for (const x of rows) console.log(`${x.ok ? 'pass' : 'FAIL'}  ${x.name}${x.ok ? '' : `\n      got:  ${x.got}\n      want: ${x.want}`}`);
    const fails = rows.filter(x => !x.ok).length;
    console.log(`\n${rows.length - fails} pass, ${fails} fail.`);
    process.exit(fails ? 1 : 0);
}
