// DojoTable — two-player tables, live and by turns (docs/ARCH-two-player.md).
//
// Knows the rules of a table, not the cards: which table is on the board, my
// seat, the revision my board is based on, who holds the pen, proposals,
// debounced writes, conflicts and the live channel. The App hands it hooks
// (attach) and calls boardChanged / localChange when the board or the
// multiverse changes; DojoCloud does the talking to Supabase.
//
//   - The table file is the truth; by turns it is all there is (§5).
//   - Live adds a channel: `board` streams the pen holder's board, `table`
//     says the row or file moved (§6).
//   - Every write carries the revision it started from (§9). A conflict pulls
//     the other seat's table and keeps this board as a "Left here" snapshot.
// Classic script, one global, no build step.

window.DojoTable = (() => {
    const WRITE_MS = 4000;      // a quiet board is written this long after its last change
    const BOARD_MS = 250;       // live board messages, at most this often
    const POLL_MS = 30000;      // by turns with the tab open: look for the other seat's move
    const PROPOSE_MS = 400;     // stepping through the Mini Multiverse moves one proposal
    const MAX_BOARD = 200000;   // bigger boards go as file + `table` (messages are capped at 256 KB)

    let link = null;    // { id, seat, revision, names: [n0, n1], dirty } (mirrors session.table)
    let hooks = null;
    let sid = null;     // the device session holding this table
    let row = null;     // the last row read: revision, turn_seat, proposal, names, seats
    let gen = 0;        // bumps on attach / detach, so late answers for another table are dropped
    let dirty = false, busy = false, pulling = false;
    let synced = false; // the first read of the table has answered (or failed: offline play)
    let writeTimer = null, boardTimer = null, pollTimer = null, proposeTimer = null;
    let failures = 0;
    let chan = null, chanState = 'off', here = [];
    let seqOut = 0, latest = null; // latest: the newest live board seen { from, seq, rev, state }
    let myProposal = null, cancelling = false;

    const otherSeat = () => (link ? 1 - link.seat : null);
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const say = (msg, opts) => { if (hooks && hooks.notify) hooks.notify(msg, opts || {}); };
    const changed = () => { if (hooks && hooks.changed) hooks.changed(); };

    function names() {
        const n = (row && [row.name0, row.name1]) || (link && link.names) || [null, null];
        return [n[0] || 'Player 1', n[1] || 'Player 2'];
    }

    // --- Attach / detach ---------------------------------------------------------
    // l: the session's table link; h: the App's hooks; sessionId: the device session.
    function attach(l, h, sessionId) {
        if (link && link.id === l.id && sid === sessionId) { hooks = h; return; }
        detach();
        gen++;
        link = { id: l.id, seat: l.seat ? 1 : 0, revision: l.revision || 0, names: l.names || [null, null] };
        hooks = h;
        sid = sessionId;
        dirty = !!l.dirty;
        synced = false;
        failures = 0;
        row = null; here = []; latest = null; myProposal = null; seqOut = 0;
        sync();
        openChannel();
        pollTimer = setInterval(() => {
            if (link && !document.hidden && !otherHere()) sync();
        }, POLL_MS);
        changed();
    }

    // Lets go of the table. Unsent changes are written once more in the background
    // (the snapshot is taken now, before the board is replaced).
    function detach() {
        if (!link) return;
        // An upload under way finishes on its own; a change after its snapshot is kept
        // as `dirty` on the device copy, for the next time the table opens.
        if (dirty && busy) hooks.saveLink(sid, { ...link, dirty: true });
        else if (dirty) flush({ final: true });
        gen++;
        clearTimeout(writeTimer); clearTimeout(boardTimer); clearTimeout(proposeTimer); clearInterval(pollTimer);
        writeTimer = boardTimer = proposeTimer = pollTimer = null;
        if (chan) { chan.close(); chan = null; }
        chanState = 'off';
        link = null; hooks = null; sid = null; row = null; here = []; latest = null; myProposal = null;
        busy = false; pulling = false; dirty = false;
    }

    const attached = () => !!link;

    // Behind: the row says the table moved on and this board hasn't caught up.
    const behind = () => !!(link && row && row.revision > link.revision);

    // The pen: my seat's turn on the latest table file (§4.2). Until the first read
    // answers, this board may be an old copy, so it waits.
    function holdsPen() {
        return !!(link && hooks && synced && hooks.activePlayer() === link.seat && !behind() && !pulling);
    }

    function otherHere() {
        return !!link && here.some(p => p.seat === otherSeat());
    }

    // --- Changes on this side ------------------------------------------------------
    function persistLink() {
        if (!link || !hooks) return;
        hooks.saveLink(sid, { ...link, dirty });
    }

    // Anything worth keeping changed here (the board or the multiverse).
    // now: the turn just changed hands, so write at once.
    function localChange(now) {
        if (!link) return;
        const was = dirty;
        dirty = true;
        if (!was) persistLink();
        scheduleWrite(now ? 0 : WRITE_MS);
        changed();
    }

    function boardChanged(turnMoved) {
        if (!link) return;
        localChange(turnMoved);
        // A turn changing hands goes as the file, so the other seat gets the pen with
        // the new node and the undo history (§6).
        if (!turnMoved) sendBoardSoon();
    }

    function scheduleWrite(ms) {
        clearTimeout(writeTimer);
        writeTimer = setTimeout(() => { writeTimer = null; flush(); }, ms);
    }

    // --- Writing (§9) ---------------------------------------------------------------
    async function flush(opts = {}) {
        clearTimeout(writeTimer); writeTimer = null;
        if (!link || !dirty) return;
        if (busy) { scheduleWrite(500); return; }
        if (behind() && !opts.final) { await sync(); return; }
        const L = link, H = hooks, S = sid, g = gen, ch = chan;
        const base = L.revision;
        // The snapshot is taken now: the board may change (or be replaced) while it uploads.
        const snap = H.snapshot();
        snap.file.tableRevision = base + 1;
        snap.file.board = { from: ch ? ch.tab : null, seq: seqOut };
        busy = true;
        dirty = false;
        let rev = null, err = null;
        try {
            const blob = await DojoLibrary.encodeBlob(snap.file);
            rev = await DojoCloud.saveTable(L.id, { revision: base, blob, summary: snap.summary, turnSeat: snap.turnSeat, title: snap.title });
        } catch (e) { err = e; }
        if (g !== gen) {
            // Detached meanwhile: only the device copy's link needs to know.
            if (rev) H.saveLink(S, { ...L, revision: rev, dirty: opts.final ? false : undefined });
            else if (!err || err.code !== 'gone') H.saveLink(S, { ...L, dirty: true });
            return;
        }
        busy = false;
        if (rev) {
            failures = 0;
            link.revision = rev;
            if (row) { row.revision = rev; row.turn_seat = snap.turnSeat; }
            persistLink();
            if (chan) {
                chan.sendTable({ rev });
                // Changes made while this was uploading go out on the new revision.
                if (otherHere()) sendBoardSoon();
            }
            if (dirty) scheduleWrite(WRITE_MS);
            changed();
            return;
        }
        dirty = true;
        if (err.code === 'conflict') {
            if (!row) row = { revision: err.current || base + 1 };
            else row.revision = Math.max(row.revision, err.current || base + 1);
            await sync();
            return;
        }
        if (err.code === 'gone') { gone(); return; }
        // The row moved on but its file didn't arrive: carry on from the claimed revision.
        if (err.claimedRevision) link.revision = err.claimedRevision;
        persistLink();
        failures++;
        scheduleWrite(Math.min(60000, 2000 * Math.pow(2, failures)));
        changed();
    }

    // --- Reading --------------------------------------------------------------------
    // Reads the row; downloads the table when it moved on; uploads when this side
    // has unsent changes and nothing came in.
    async function sync() {
        if (!link) return;
        const g = gen;
        let r;
        try { r = await DojoCloud.getTable(link.id); } catch (e) {
            // Offline: play on from this device's copy; it's sent when the table answers.
            if (g === gen) { synced = true; changed(); }
            return;
        }
        if (g !== gen) return;
        if (!r) { gone(); return; }
        const before = row;
        // A proposal picked here but not sent yet is still the one that counts.
        if (myProposal && !myProposal.sent) r.proposal = myProposal;
        row = r;
        link.names = [r.name0 || null, r.name1 || null];
        let moved = false;
        // An upload under way will meet the new revision as a conflict and pull then,
        // keeping its board; pulling now would lose it.
        if (r.revision > link.revision && !busy) moved = await pull(r);
        if (g !== gen) return;
        synced = true;
        noteProposal(before && before.proposal, row.proposal, moved);
        if (dirty && !busy && !behind()) scheduleWrite(moved ? 0 : WRITE_MS);
        changed();
    }

    async function fetchFile(id) {
        const text = await DojoLibrary.readText(await DojoCloud.downloadTable(id));
        const file = DojoLibrary.decodeText(text);
        const board = JSON.parse(text).board;
        file.board = board && typeof board === 'object' ? board : null;
        return file;
    }

    // Applies the table file. → true when the board was replaced.
    async function pull(r) {
        if (pulling) return false;
        pulling = true;
        const g = gen;
        changed();
        try {
            let file = await fetchFile(link.id);
            // The writer claims the row first, then uploads: give a lagging file a moment.
            if (file.tableRevision != null && file.tableRevision < r.revision) {
                await sleep(1500);
                if (g !== gen) return false;
                file = await fetchFile(link.id);
            }
            if (g !== gen) return false;
            const keepMine = dirty;
            hooks.applyFile(file.data, { keepMine });
            link.revision = Math.max(r.revision, file.tableRevision || 0);
            if (row) row.revision = Math.max(row.revision, link.revision);
            // A live board newer than the file's (sent while it uploaded) goes back on top.
            const fb = file.board;
            if (latest && fb && latest.from === fb.from && latest.seq > fb.seq) hooks.applyBoard(latest.state);
            dirty = keepMine; // the board kept as "Left here" is a change to write
            persistLink();
            return true;
        } catch (e) {
            console.warn('Table download failed:', e);
            if (g === gen && e && e.code === 'gone') gone();
            else if (g === gen) say("Couldn't load the other player's move. It will try again.");
            return false;
        } finally {
            if (g === gen) pulling = false;
        }
    }

    function gone() {
        if (!link || !hooks) return;
        const H = hooks, S = sid, id = link.id;
        detach();
        H.gone(S, id);
    }

    // --- Proposals (§7) -------------------------------------------------------------
    function noteProposal(before, now, moved) {
        if (!link) return;
        const mine = before && before.by === link.seat;
        if (mine && (!now || now.id !== before.id)) {
            if (cancelling) cancelling = false;
            else if (!now || now.by !== link.seat) {
                say(moved ? `${names()[otherSeat()]} agreed: you're at “${before.name}”.`
                    : `${names()[otherSeat()]} stayed where you are.`, { flash: moved });
            }
            if (myProposal && myProposal.id === before.id) myProposal = null;
        }
    }

    // A pick in the Multiverse (target: a node or snapshot id).
    function propose({ target, auto, name }) {
        if (!link) return;
        myProposal = { id: Math.random().toString(36).slice(2, 10), by: link.seat, target: String(target), auto: !!auto, name: String(name || 'that node').slice(0, 120), at: Date.now() };
        if (!row) row = { revision: link.revision };
        row.proposal = myProposal;
        changed();
        clearTimeout(proposeTimer);
        proposeTimer = setTimeout(() => sendProposal(myProposal), PROPOSE_MS);
    }

    async function sendProposal(p) {
        if (!link) return;
        const g = gen;
        try {
            const r = await DojoCloud.setProposal(link.id, p);
            if (g !== gen) return;
            if (p) p.sent = true;
            if (r && row && (!myProposal || myProposal === p || myProposal.sent)) row.proposal = r.proposal;
            if (chan) chan.sendTable({ rev: link.revision });
        } catch (e) {
            if (g !== gen) return;
            if (e.code === 'gone') { gone(); return; }
            say("Couldn't send that to the other player. Check your connection and try again.");
            if (row && row.proposal && p && row.proposal.id === p.id) row.proposal = null;
            myProposal = null;
        }
        changed();
    }

    async function cancel() {
        if (!link || !row || !row.proposal || row.proposal.by !== link.seat) return;
        clearTimeout(proposeTimer);
        cancelling = true;
        myProposal = null;
        row.proposal = null;
        changed();
        await sendProposal(null);
        cancelling = false;
    }

    // The other seat's proposal: go = true moves the table there (on this side first,
    // then the file), false stays.
    async function answer(go) {
        const p = link && row && row.proposal;
        if (!p || p.by === link.seat) return;
        const g = gen;
        if (go) {
            if (!hooks.restore(p.target, p.auto)) {
                say('That node is gone, so the table stays here.');
            } else {
                dirty = true;
                await flush();
                if (g !== gen) return;
            }
        }
        if (row) row.proposal = null;
        changed();
        try {
            await DojoCloud.setProposal(link.id, null);
            if (g === gen && chan) chan.sendTable({ rev: link.revision });
        } catch (e) { /* the proposal clears on the next answer or proposal */ }
    }

    // --- Live (§6) ------------------------------------------------------------------
    async function openChannel() {
        if (!DojoCloud.tableChannel || !link) return;
        const g = gen;
        chanState = 'connecting';
        let ch;
        try {
            ch = await DojoCloud.tableChannel(link.id, { seat: link.seat, name: names()[link.seat] }, {
                board: (p) => { if (g === gen) onBoard(p); },
                table: () => { if (g === gen) sync(); },
                presence: (list) => { if (g === gen) onPresence(list); },
                status: (s) => { if (g === gen) { chanState = s; if (s !== 'live') here = []; changed(); } }
            });
        } catch (e) {
            if (g === gen) { chanState = 'off'; changed(); }
            return;
        }
        if (g !== gen) { ch.close(); return; }
        chan = ch;
    }

    function onPresence(list) {
        const wasHere = otherHere();
        here = Array.isArray(list) ? list.filter(p => p && (p.seat === 0 || p.seat === 1)) : [];
        const nowHere = otherHere();
        if (nowHere && !wasHere) {
            // The other player just sat down: make sure they see this board now.
            if (dirty) flush();
            if (holdsPen()) sendBoardSoon(0);
            sync();
        }
        changed();
    }

    function sendBoardSoon(ms = BOARD_MS) {
        if (!chan || !link || boardTimer) return;
        boardTimer = setTimeout(() => {
            boardTimer = null;
            // Only the pen holder's board goes out: one sent just after the pen moved on
            // would land on the other side after it took the pen.
            if (!chan || !link || !hooks || !otherHere() || !holdsPen()) return;
            const state = hooks.boardState();
            if (JSON.stringify(state).length > MAX_BOARD) { scheduleWrite(0); return; }
            chan.sendBoard({ rev: link.revision, seq: ++seqOut, from: chan.tab, seat: link.seat, state });
        }, ms);
    }

    function onBoard(p) {
        if (!link || !p || typeof p !== 'object' || !p.state || typeof p.state !== 'object') return;
        if (typeof p.seq !== 'number' || typeof p.rev !== 'number') return;
        // A board counts only from the other seat, on its own turn.
        if (p.seat !== otherSeat() || p.state.activePlayer !== p.seat) return;
        if (latest && latest.from === p.from && p.seq <= latest.seq) return;
        latest = { from: p.from, seq: p.seq, rev: p.rev, state: p.state };
        // This side is the writer, or its upload is under way: its own board stands.
        if (dirty || busy || holdsPen()) return;
        if (p.rev > link.revision || pulling) { sync(); return; }
        if (p.rev < link.revision) return;
        hooks.applyBoard(p.state);
    }

    // --- What the App shows ---------------------------------------------------------
    function info() {
        if (!link) return null;
        const n = names();
        const seated = row ? [!!row.seat0, !!row.seat1] : [true, true];
        return {
            id: link.id,
            seat: link.seat,
            names: n,
            me: n[link.seat],
            other: n[otherSeat()],
            otherSeated: seated[otherSeat()],
            live: chanState === 'live',
            otherHere: otherHere(),
            holdsPen: holdsPen(),
            behind: behind() || pulling || !synced,
            pending: dirty || busy,
            offline: failures > 0,
            known: !!row,
            proposal: row ? row.proposal || null : null,
            url: DojoCloud.tableUrl(link.id)
        };
    }

    // The app was offline or hidden: catch up.
    function wake() {
        if (!link) return;
        sync();
        if (dirty) scheduleWrite(0);
    }
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });

    return {
        attach, detach, attached, holdsPen, info, sync, flush,
        localChange, boardChanged, propose, cancel, answer,
        sessionId: () => sid
    };
})();
