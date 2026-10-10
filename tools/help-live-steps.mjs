// Steps module for `node tools/help.mjs --live` (run through the dojo-screenshots tool).
// For each width it opens the screens the targets need and asks DojoSpotlight.resolve()
// whether each target is a visible element there. Results go to the JSON file named by
// HELP_LIVE_OUT (one file, appended per width). See tools/help-live.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Screens this check can open, in the order it visits them (home last: it leaves the board).
const SCREENS = {
    board: { open: async () => { }, close: async () => { } },
    multiverse: {
        open: (page) => page.evaluate(async () => { App.openTreeModal(); }),
        close: (page) => page.evaluate(async () => { App.closeTreeModal(); }),
        settle: 900
    },
    tweaks: {
        open: (page) => page.evaluate(async () => { document.getElementById('tweaks-panel').classList.add('is-open'); }),
        close: (page) => page.evaluate(async () => { document.getElementById('tweaks-panel').classList.remove('is-open'); })
    },
    library: {
        // Some targets live on one tab: each tab is tried until the target shows.
        tabs: ['sessions', 'decks', 'shared'],
        open: (page, tab) => page.evaluate(async (t) => { App.openLibrary(t); }, tab || 'sessions'),
        close: (page) => page.evaluate(async () => { App.closeLibrary(); }),
        settle: 500
    },
    home: {
        open: (page) => page.evaluate(async () => { App.confirmShowSetup(); }),
        close: async () => { },
        settle: 600
    }
};
const SKIP = {
    mulligan: 'needs a board waiting on its mulligan (a new match)',
    drawer: 'needs a card drawer or ink sheet opened on a card',
    challenge: 'needs challenge mode with a ready character',
    shared: 'needs a session opened from a share link'
};

// Targets that exist but show only in some states of their screen. When they're found
// but hidden, they're reported as skipped with the reason, not failed.
const STATEFUL = {
    'opponent-hand': 'empty when that player holds no cards (the demo\'s P1)',
    'tree-legend': 'shown in plot view only (desktop opens on cards)',
    readout: 'shows once something is pasted or chosen'
};

export default async (page, { wait, phone, width }) => {
    const out = process.env.HELP_LIVE_OUT;
    const targets = JSON.parse(readFileSync(process.env.HELP_LIVE_TARGETS, 'utf8')).targets;
    const device = phone ? 'phone' : 'desktop';
    const rows = [];
    await page.evaluate(async (t) => { DojoSpotlight.setTargets(t); }, targets);

    // The spotlight's own test: right selector for this device, visible element.
    const check = (name) => page.evaluate(async (n) => ({ ok: !!DojoSpotlight.resolve(n) }), name);
    const count = (sel) => page.evaluate(async (s) => { try { return document.querySelectorAll(s).length; } catch (e) { return -1; } }, sel);

    const byScreen = {};
    for (const [name, t] of Object.entries(targets)) {
        const sel = t[device] || t.any;
        if (!sel) { rows.push({ name, width, device, screen: t.screen, status: 'n/a', note: `no ${device} selector` }); continue; }
        if (SKIP[t.screen]) { rows.push({ name, width, device, screen: t.screen, sel, status: 'skip', note: SKIP[t.screen] }); continue; }
        (byScreen[t.screen] = byScreen[t.screen] || []).push([name, sel]);
    }

    for (const [screen, s] of Object.entries(SCREENS)) {
        const list = byScreen[screen];
        if (!list) continue;
        const tabs = s.tabs || [null];
        const pending = new Map(list);
        for (const tab of tabs) {
            await s.open(page, tab);
            await wait(s.settle || 300);
            for (const [name, sel] of [...pending]) {
                if ((await check(name)).ok) {
                    rows.push({ name, width, device, screen, sel, status: 'pass', note: tab ? `${tab} tab` : '' });
                    pending.delete(name);
                }
            }
        }
        for (const [name, sel] of pending) {
            const n = await count(sel);
            if (n > 0 && STATEFUL[name]) {
                rows.push({ name, width, device, screen, sel, status: 'skip', note: `found, hidden: ${STATEFUL[name]}` });
                continue;
            }
            rows.push({ name, width, device, screen, sel, status: 'fail', note: n < 0 ? 'bad selector' : n ? `${n} match, none visible` : 'no match' });
        }
        await s.close(page);
        await wait(200);
    }

    const prev = out && existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : [];
    writeFileSync(out, JSON.stringify(prev.concat(rows), null, 1));
};
