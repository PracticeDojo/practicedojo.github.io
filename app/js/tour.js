// Guided tours (Feature 58, M5): opt-in, on a practice board that is never saved.
// docs/ARCH-help-and-tour.md §8.
//
// Contract:
//   DojoTour.list() -> Promise<[{ id, title, minutes, done }]>
//   DojoTour.start(id), DojoTour.stop(), DojoTour.isRunning()
//   DojoTour.onRender()   // called at the end of App.render()
//   DojoTour.onKey(e)     // called first in the app's keydown; true = handled
//
// As built (M5):
//   - Tours are manual.tours (tools/help.mjs reads app/help/tours/*.json). A tour's start:
//       { scenario: 'basics.dojo.json.gz' }   a session file in help/tours/, as a practice board
//       { demo: '<id>' }                      a scratch copy of a demo (the first if no id matches)
//       { screen: 'home' }                    the home screen; Study this game opens a practice board
//   - Steps (§8.3): read-only (Next / Back) or `until` a predicate below (Skip this step).
//     `text`, `target` and `also` plain or { desktop, phone }; `device` skips a step on the other device; `hint`
//     (plain or per device) joins the text after 20 s; `learn` adds Learn more (help opens on
//     that article, the tour waits and comes back when help closes); `also: [targets]` moves
//     the spotlight to the first of those that is on screen (the card drawer a tap opens).
//   - The practice board is App's scratch view (kind 'tour'): App.holdPlaceForScratch() before,
//     App.openScratch(), App.closeScratch() after, which puts the player back where they were.
//     Leaving to the home screen ends the tour; saving a copy ends it and keeps the board.
//   - Progress: localStorage['lorcana_dojo_help'] = { offer, done: { id: ts }, toldAboutHelp }.
//     Nothing about a running tour is stored: a reload ends it.
//   - Home: DojoTour.onHome() (from App.showSetup) shows the welcome (#tour-welcome) to new
//     players, or once tells existing players where help is. takeOffer() / dismissOffer();
//     dismissing points the spotlight at Help. The first Start match asks once whether to take
//     the tour first (shouldAskFirstMatch / askFirstMatch, from App.startGame).
//   - Until Help has been opened once, body.help-breathe makes the Help keys breathe in the
//     signal colour (paused during a tour). DojoTour.helpSeen() ends it (help.js calls it on open).
window.DojoTour = (function () {
    'use strict';

    const STORE_KEY = 'lorcana_dojo_help';
    const HINT_MS = 20000;
    const TICK_MS = 400;
    const PHONE_MQ = '(max-width: 760px)';
    // A share link opens straight onto what it points to and then drops ?s= from the
    // address bar, so read it now (D5: no offer for people who arrive by a link).
    const ARRIVED_BY_LINK = (() => { try { return new URLSearchParams(location.search).has('s'); } catch (e) { return false; } })();

    let tours = null;
    let run = null;            // the running tour

    const app = () => (typeof App !== 'undefined' ? App : null);   // the app's global (a const)
    const S = () => window.DojoSpotlight;
    const H = () => window.DojoHelp;
    const isPhone = () => !!(window.matchMedia && window.matchMedia(PHONE_MQ).matches);
    const device = () => (H() && H().device ? H().device() : (isPhone() ? 'phone' : 'desktop'));
    const visible = (id) => { const el = document.getElementById(id); return !!(el && !el.classList.contains('hidden') && !el.hidden); };

    // ---------- Saved progress ----------
    function readStore() {
        try {
            const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            return v && typeof v === 'object' ? v : {};
        } catch (e) { return {}; }
    }
    function writeStore(patch) {
        try {
            const v = Object.assign(readStore(), patch);
            localStorage.setItem(STORE_KEY, JSON.stringify(v));
        } catch (e) { /* private mode: progress isn't kept */ }
    }
    function markDone(id) {
        const v = readStore();
        const done = v.done && typeof v.done === 'object' ? v.done : {};
        done[id] = Date.now();
        writeStore({ done });
    }

    // ---------- Tours ----------
    function load() {
        if (tours) return Promise.resolve(tours);
        if (!H() || !H().load) return Promise.resolve([]);
        return H().load().then((m) => (tours = (m && m.tours) || []));
    }

    async function list() {
        const ts = await load();
        const done = readStore().done || {};
        return ts.map((t) => ({ id: t.id, title: t.title, minutes: t.minutes, done: !!done[t.id] }));
    }

    // ---------- Predicates (§8.3): read App.state and the DOM. ctx is the step's memory,
    // filled by init() when the step starts. ----------
    const turnActs = () => { const a = app(); return (a && a.state && a.state.turnActions) || {}; };

    // Settles an opening hand that is still being chosen, the way its own keys would: back from
    // Craft hand, put a looked-at card down, keep the hand (or start the turn after a mulligan).
    // Skipping a mulligan step must never leave the dialog up behind the tour.
    function settleMulligan(a) {
        for (let n = 0; n < 3 && a && a.state && a.state.mulliganPending; n++) {
            if (visible('craft-hand-modal') && a.backToMulligan) a.backToMulligan();
            if (a.closeMulliganLook) a.closeMulliganLook();
            if (a.hideMulliganPeek) a.hideMulliganPeek();
            const p = a.state.players[a.state.activePlayer];
            if (!p.hasMulliganed) a.mulliganSelection = [];
            a.confirmMulligan();
        }
    }
    const activeP = (a) => a.state.players[a.state.activePlayer];

    // A predicate may have skip(ctx, app): what Skip this step does before moving on, so
    // the board is where the following steps expect it.
    const until = {
        mulliganSettled: {
            test: () => { const a = app(); return !!(a && a.state && !a.state.mulliganPending); },
            skip: (c, a) => settleMulligan(a)
        },
        // A card looked at closely and put back: the magnifier (mouse) or press and hold (touch).
        mulliganLooked: {
            test: (c, a) => {
                if (!a.state.mulliganPending) return true;
                const open = !!a._mullLookSlot || (a.isMulliganPeekOpen && a.isMulliganPeekOpen());
                if (open) c.seen = true;
                return !!c.seen && !open;
            },
            skip: (c, a) => { if (a.closeMulliganLook) a.closeMulliganLook(); if (a.hideMulliganPeek) a.hideMulliganPeek(); }
        },
        // At least one card marked to go to the bottom (or the hand already settled).
        mulliganMarked: {
            test: (c, a) => !a.state.mulliganPending || activeP(a).hasMulliganed || (a.mulliganSelection || []).length > 0
        },
        // The choice is made: a mulligan (the new hand is on show) or a keep.
        mulliganChosen: {
            test: (c, a) => !a.state.mulliganPending || !!activeP(a).hasMulliganed,
            skip: (c, a) => settleMulligan(a)
        },
        inkedThisTurn: { test: () => (turnActs().inked || []).length > 0 },
        cardPlayed: { test: () => ((turnActs().played || []).length + (turnActs().shifted || []).length) > 0 },
        quested: { test: () => (turnActs().quested || []).length > 0 },
        // The other player's opening hand is settled and one of their cards inked.
        settledAndInked: {
            test: (c, a) => !a.state.mulliganPending && (turnActs().inked || []).length > 0,
            // Settle their hand and ink an inkable card for them, so the Undo step after has an ink to take back.
            skip: (c, a) => {
                settleMulligan(a);
                if ((turnActs().inked || []).length) return;
                const card = activeP(a).hand.find((x) => { const d = a.cardDB[x.cardId]; return d && d.inkwell; });
                if (card && a.playToInkwell) a.playToInkwell(card.instanceId);
            }
        },
        turnEnded: {
            init: (c, a) => { c.turn = a.state.turn; c.ap = a.state.activePlayer; },
            test: (c, a) => a.state.turn !== c.turn || a.state.activePlayer !== c.ap
        },
        // Every action pushes a snapshot; only Undo takes one off.
        undone: {
            init: (c, a) => { c.max = a.history.length; },
            test: (c, a) => { c.max = Math.max(c.max, a.history.length); return a.history.length < c.max; }
        },
        drawerOpen: { test: (c, a) => !!a._sheetIid },
        // The card drawer was opened and has been closed again.
        drawerRead: {
            test: (c, a) => { if (a._sheetIid) c.seen = true; return !!c.seen && !a._sheetIid; }
        },
        multiverseOpen: { test: () => visible('tree-modal') },
        multiverseClosed: { test: () => !visible('tree-modal') },
        nodeSelected: {
            init: (c, a) => { c.nav = a.treeNavActiveId; },
            test: (c, a) => !!a.treeNavActiveId && a.treeNavActiveId !== c.nav
        },
        // Play from here puts a new state on the board.
        playedFromNode: {
            init: (c, a) => { c.state = a.state; },
            test: (c, a) => a.state !== c.state && !visible('tree-modal')
        },
        turnSaved: {
            init: (c, a) => { c.n = a.bookmarks.length; },
            test: (c, a) => a.bookmarks.length > c.n
        },
        plotView: {
            init: (c, a) => { c.view = a.treeView; },
            test: (c, a) => a.treeView !== c.view
        },
        importRead: {
            test: () => {
                const r = document.getElementById('readout');
                return !!(r && !r.hidden && /Duels\.ink/.test(r.textContent || ''));
            }
        },
        scratchOpen: { test: (c, a) => !!(a._sharedView && a._sharedView.kind === 'tour' && !visible('setup-modal')) }
    };

    // ---------- Running ----------
    const pick = (v) => (v && typeof v === 'object' ? (v[device()] || v.desktop || v.phone || '') : (v || ''));
    const stepOn = (s) => !s.device || s.device === device();

    function steps() { return run.tour.steps.filter(stepOn); }

    function effectiveTarget(step) {
        const sp = S();
        const also = step.also && !Array.isArray(step.also) ? (step.also[device()] || []) : (step.also || []);
        for (const name of also) if (sp && sp.resolve(name)) return name;
        return pick(step.target) || null;
    }

    function blurSpot() {
        const a = document.activeElement;
        if (a && a.closest && a.closest('.spot')) a.blur();
        if (a && a.tagName === 'BUTTON' && !a.closest('.spot')) a.blur(); // Space ends the turn, not presses a button
    }

    function show(i) {
        const list = steps();
        const step = list[i];
        const a = app();
        if (!run || !step || !a) return;
        if (run.i !== i) {
            run.i = i;
            run.ctx = {};
            run.since = Date.now();
            run.hinted = false;
            const p = step.until && until[step.until];
            if (p && p.init) try { p.init(run.ctx, a); } catch (e) { console.warn('DojoTour', e); }
        }
        const pred = step.until && until[step.until];
        if (step.until && !pred) console.warn(`DojoTour: no predicate "${step.until}"`);
        let text = pick(step.text);
        const hint = pick(step.hint);
        if (run.hinted && hint) text = `${text} ${hint}`;

        const buttons = [];
        const backTo = previousReadOnly(i);
        if (backTo >= 0) buttons.push({ label: 'Back', onClick: () => { go(backTo); } });
        if (step.learn) buttons.push({ label: 'Learn more', onClick: () => learn(step.learn) });
        if (pred) buttons.push({ label: 'Skip this step', onClick: () => {
            // busy: the renders a skip causes mustn't also move the tour on.
            run.busy = true;
            if (pred.skip) try { pred.skip(run.ctx, a); } catch (e) { console.warn('DojoTour skip', e); }
            run.busy = false;
            go(i + 1);
        } });
        else buttons.push({ label: i === list.length - 1 ? 'Finish' : 'Next', primary: true, onClick: () => { go(i + 1); } });

        run.shownTarget = effectiveTarget(step);
        const mine = ++run.seq;
        S().show(run.shownTarget, {
            title: step.title || (i === 0 ? run.tour.title : ''),
            step: `${i + 1} / ${list.length}`,
            text,
            buttons,
            passThrough: !!pred,
            focus: pred ? false : step.focus !== false,
            dismiss: 'End tour',
            onClose: (reason) => onClose(reason, mine)
        }).then(() => { if (pred) blurSpot(); });
    }

    function previousReadOnly(i) {
        const list = steps();
        for (let j = i - 1; j >= 0; j--) if (!list[j].until) return j;
        return -1;
    }

    function onClose(reason, seq) {
        if (!run || seq !== run.seq) return;
        if (reason === 'replaced' || reason === 'hide' || run.paused || run.ending) return;
        if (reason === 'escape') { stop(); return; }
        if (reason === 'click') { show(run.i); return; }  // a click outside a read-only step: stay
        if (reason === 'button' && run.closing) { stop(); return; }
    }

    function go(i) {
        if (!run) return;
        const list = steps();
        if (i >= list.length) { finish(); return; }
        // A step whose action is already done moves on by itself (going forward).
        const step = list[i];
        const pred = step.until && until[step.until];
        if (pred && i > run.i && !pred.init) {
            try { if (pred.test(run.ctx || {}, app())) { run.i = i; go(i + 1); return; } } catch (e) { }
        }
        show(i);
    }

    function learn(id) {
        if (!run || !H()) return;
        run.paused = Date.now();
        run.helpSeen = false;
        H().open(id);
    }

    function check() {
        if (!run || run.paused || run.closing || run.busy) return;
        const a = app();
        if (!a || !a.state) return;
        // Left the practice board: saved a copy, opened another session, or went home.
        if (run.scratch) {
            const sv = a._sharedView;
            if (!sv || sv.kind !== 'tour') { stop({ restore: false }); return; }
            if (visible('setup-modal')) { stop({ home: true }); return; }
        } else if (a._sharedView && a._sharedView.kind === 'tour') {
            run.scratch = true;
        }
        const step = steps()[run.i];
        if (!step) return;
        const pred = step.until && until[step.until];
        if (pred) {
            let ok = false;
            try { ok = !!pred.test(run.ctx, a); } catch (e) { ok = false; }
            // Move on after a beat, unless something (Skip, Back) already moved the tour.
            if (ok) { const at = run.i; run.busy = true; setTimeout(() => { if (!run) return; run.busy = false; if (run.i === at) go(at + 1); }, 250); return; }
            if (!run.hinted && step.hint && Date.now() - run.since > HINT_MS) { run.hinted = true; show(run.i); return; }
        }
        if (step.also && effectiveTarget(step) !== run.shownTarget) show(run.i);
    }

    function tick() {
        if (!run) return;
        if (run.paused) {
            const open = !!(H() && H().isOpen());
            if (open) run.helpSeen = true;
            else if (run.helpSeen || Date.now() - run.paused > 3000) { run.paused = false; show(run.i); }
            return;
        }
        check();
    }

    function finish() {
        const t = run.tour;
        markDone(t.id);
        const ts = tours || [];
        const idx = ts.findIndex((x) => x.id === t.id);
        const done = readStore().done || {};
        const next = ts.slice(idx + 1).concat(ts.slice(0, idx)).find((x) => !done[x.id]) || null;
        run.closing = true;
        run.i = steps().length;
        const mine = ++run.seq;
        const buttons = [{ label: 'Open help', onClick: () => { stop(); if (H()) H().open(); } }];
        if (next) buttons.push({ label: next.title, onClick: () => { const id = next.id; stop().then(() => start(id)); } });
        buttons.push({ label: 'Done', primary: true, onClick: () => { stop(); } });
        S().show(null, {
            title: 'Tour done',
            text: `That was **${t.title}**. Nothing you did here was saved. Help (**?**) has the rest, and the tours are at the top of it.`,
            buttons,
            dismiss: 'Close',
            onClose: (reason) => { if (run && mine === run.seq && reason !== 'replaced' && reason !== 'button') stop(); }
        });
    }

    async function openStart(t) {
        const a = app();
        const st = t.start || {};
        if (st.scenario) {
            const r = await fetch(`help/tours/${st.scenario}`, { cache: 'no-cache' });
            if (!r.ok) throw new Error(`help/tours/${st.scenario}: HTTP ${r.status}`);
            const file = await DojoLibrary.decode(await r.arrayBuffer());
            a.openScratch(file.data, { kind: 'tour', title: t.title });
        } else if (st.demo) {
            const demos = await DojoLibrary.loadDemoManifest();
            const demo = demos.find((d) => d.id === st.demo) || demos[0];
            if (!demo) throw new Error('No demo to practise on');
            const file = await DojoLibrary.fetchDemo(demo);
            a.openScratch(file.data, { kind: 'tour', title: t.title });
        } else {
            // The home screen. Study this game opens a practice board, not a library session.
            a._scratchImports = true;
            if (a.clearIntake) a.clearIntake();
            a.showSetup();
            const ro = document.getElementById('readout');
            if (ro) ro.hidden = true;
        }
    }

    async function start(id) {
        const a = app();
        if (!a || !S()) return false;
        if (run) await stop();
        const ts = await load();
        const t = ts.find((x) => x.id === id);
        if (!t) { console.warn(`DojoTour: no tour "${id}"`); return false; }
        if (H() && H().isOpen()) H().close();
        const st = readStore();
        writeStore({ offer: st.offer || 'taken', toldAboutHelp: true });
        hideOffer();
        run = { tour: t, i: -1, seq: 0, ctx: {}, scratch: false, paused: false, busy: true };
        try {
            await a.holdPlaceForScratch();
            await openStart(t);
        } catch (e) {
            console.error('DojoTour: could not open the practice board', e);
            run = null;
            a.closeScratch();
            if (a.showToast) a.showToast("The tour couldn't open its practice board. Check your connection.");
            return false;
        }
        if (!run) return false;
        run.scratch = !!(a._sharedView && a._sharedView.kind === 'tour');
        run.busy = false;
        document.body.classList.add('is-touring');
        run.timer = setInterval(tick, TICK_MS);
        go(0);
        return true;
    }

    // Ends the tour. opts.restore false: keep the board (the player saved a copy);
    // opts.home: show the home screen after (the player left to it).
    function stop(opts = {}) {
        if (!run) return Promise.resolve();
        const r = run;
        r.ending = true;
        clearInterval(r.timer);
        run = null;
        document.body.classList.remove('is-touring');
        if (S() && S().isOpen()) S().hide();
        const a = app();
        if (a) {
            a._scratchImports = false;
            if (opts.restore === false) a._scratchReturn = null;
            else a.closeScratch({ home: !!opts.home });
        }
        return Promise.resolve();
    }

    function onRender() {
        if (run && !run.busy) check();
    }

    function onKey(e) {
        // The welcome is modal: Esc means Explore on my own; other keys stay out of the app.
        if (offerOpen()) {
            if (e.key === 'Escape') { e.preventDefault(); dismissOffer(); }
            return e.key !== 'Tab' && e.key !== 'Enter' && e.key !== ' ';
        }
        if (!run || run.paused) return false;
        if (e.key === 'Escape' && !(S() && S().isOpen())) { e.preventDefault(); stop(); return true; }
        return false;
    }

    // ---------- The offer (§8.2) ----------
    function hideOffer() {
        const el = document.getElementById('tour-welcome');
        if (!el || el.hidden) return;
        el.hidden = true;
        document.body.classList.remove('tour-welcome-open');
    }
    const offerOpen = () => { const el = document.getElementById('tour-welcome'); return !!(el && !el.hidden); };

    function showOffer() {
        const el = document.getElementById('tour-welcome');
        if (!el) return;
        el.hidden = false;
        document.body.classList.add('tour-welcome-open');
        const b = document.getElementById('btn-tour-start');
        if (b) setTimeout(() => b.focus({ preventScroll: true }), 30);
    }

    // ---------- The Help keys breathe until Help is first used ----------
    function syncBreath() {
        document.body.classList.toggle('help-breathe', !readStore().helpSeen);
    }
    function helpSeen() {
        if (!readStore().helpSeen) writeStore({ helpSeen: true });
        syncBreath();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncBreath);
    else syncBreath();

    async function onHome() {
        const el = document.getElementById('tour-welcome');
        if (!el || run) { hideOffer(); return; }
        const st = readStore();
        if (st.offer || ARRIVED_BY_LINK) {
            hideOffer();
            if (st.toldAboutHelp) return;
        }
        let n = 0;
        try { n = (await DojoLibrary.listSessions()).length; } catch (e) { n = 0; }
        if (run) return;
        const show = !st.offer && !ARRIVED_BY_LINK && n === 0;
        if (show) { showOffer(); writeStore({ toldAboutHelp: true }); return; }
        hideOffer();
        // Existing players: say once where help and the tours live.
        if (n > 0 && !st.toldAboutHelp && !readStore().toldAboutHelp) {
            writeStore({ toldAboutHelp: true });
            const a = app();
            if (a && a.showToast) a.showToast(`New: Help and guided tours · ${isPhone() ? 'in the ⋯ menu' : 'press ?'}`);
        }
    }

    function takeOffer() {
        writeStore({ offer: 'taken' });
        hideOffer();
        start('basics');
    }

    // ---------- The first match (owner suggestion) ----------
    // The first time a player presses Start match without having finished "Your first turn",
    // ask once whether to take the tour first. App.startGame() starts the match either way;
    // the tour then runs on its practice board and brings the player back to that match.
    function shouldAskFirstMatch() {
        const st = readStore();
        return !run && !st.firstMatchAsked && !(st.done && st.done.basics) && !ARRIVED_BY_LINK;
    }

    async function askFirstMatch() {
        writeStore({ firstMatchAsked: true });
        const a = app();
        if (!a || !a.dialog) return false;
        const ok = await a.dialog({
            title: 'First match?', icon: 'fa-graduation-cap', help: 'tours',
            message: 'The 3-minute tour walks you through a first turn on a practice board, then brings you back to this match. Nothing in the tour is saved.',
            confirmText: 'Take the tour first', cancelText: 'Just play'
        });
        return !!ok;
    }

    // Explore on my own: then show where Help lives, so it can be found later.
    function dismissOffer() {
        writeStore({ offer: 'dismissed' });
        hideOffer();
        const sp = S();
        if (!sp || run) return;
        const target = visible('setup-modal') ? 'home-help' : 'help-button';
        sp.show(target, {
            title: 'Help is here',
            text: 'The manual and the guided tours, whenever you want them. It breathes until you first open it.',
            buttons: [{ label: 'Got it', primary: true }]
        });
    }

    return {
        list,
        start,
        stop,
        isRunning: () => !!run,
        onRender,
        onKey,
        onHome,
        helpSeen,
        shouldAskFirstMatch,
        askFirstMatch,
        takeOffer,
        dismissOffer
    };
})();
