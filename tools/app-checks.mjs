// `node tools/app-checks.mjs`: checks the app's riskiest logic in the real page, headless.
// Exits 1 if any check fails. Needs Playwright, like the dojo-screenshots tool it runs through.
//
//   - Duels.ink imports: every sample log and replay still builds the same board
//     (turns, timeline nodes, cards per zone, lore, unknown cards).
//   - Challenges: the damage done is the damage the forecast showed.
//   - Untrusted files: session sanitising, the session codec, replay patches.
//   - Device library: the two-tab guard and sign-out removal.
//   - Two-player tables: two browsers at one table, live and by turns (tools/table-checks.mjs).
//
// An import fingerprint changed on purpose (a parser fix)? Run with --update to print the
// new ones, check them, and paste them into IMPORTS below.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runHeadless as runTableChecks } from './table-checks.mjs';

const IMPORTS = {
    // "unknown" counts cards the log hides (the opponent's hand and deck) as well as unresolved names.
    'app/defaults/examples/duels-ink-log.txt': 'turns 34 · nodes 34 · P1 deck 31 hand 1 field 2 ink 11 discard 15 lore 21 · P2 deck 32 hand 1 field 3 ink 11 discard 13 lore 12 · unknown 63',
    'docs/samples/log_example_v01.md': 'turns 34 · nodes 34 · P1 deck 31 hand 1 field 2 ink 11 discard 15 lore 21 · P2 deck 32 hand 1 field 3 ink 11 discard 13 lore 12 · unknown 63',
    'docs/samples/new_log_20261004.txt': 'turns 26 · nodes 26 · P1 deck 33 hand 1 field 4 ink 10 discard 11 lore 20 · P2 deck 36 hand 0 field 5 ink 8 discard 10 lore 14 · unknown 72',
    'docs/samples/019ea30a-6bbf-7518-8736-fd4db478b072_p1.json': 'turns 19 · nodes 19 · P1 deck 39 hand 2 field 6 ink 5 discard 5 lore 20 · P2 deck 42 hand 1 field 2 ink 4 discard 9 lore 18 · unknown 43',
    'docs/samples/01a08b6d-cb54-743f-9bfd-debe26bb528a_p1.replay.gz': 'turns 26 · nodes 26 · P1 deck 33 hand 1 field 4 ink 10 discard 11 lore 20 · P2 deck 36 hand 0 field 5 ink 8 discard 10 lore 14 · unknown 38'
};

// --- In the page (steps module for .claude/skills/dojo-screenshots/shoot.mjs) ---------------
export default async (page) => {
    const results = await page.evaluate(async (IMPORTS) => {
        const out = [];
        const check = (name, got, want) => out.push({ name, ok: got === want, got: String(got), want: String(want) });

        // Imports: the same pipeline as Import log, without putting the game on the board.
        for (const path of Object.keys(IMPORTS)) {
            let got;
            try {
                const text = await App.decodeMaybeGzip(await (await fetch('/' + path)).arrayBuffer());
                const fmt = App.detectLogFormat(text);
                let session, turns;
                if (fmt.type === 'replay') { session = App.buildSessionFromReplay(fmt.data); turns = session._turnCount; }
                else { const parsed = App.parseDojoLog(text); session = App.buildSessionFromLog(parsed); turns = parsed.turns.length; }
                const st = App.decompressState(session.currentState);
                const zones = ['deck', 'hand', 'field', 'inkwell', 'discard'];
                let unknown = 0;
                const side = (p) => zones.map(z => { (p[z] || []).forEach(c => { if (!App.cardDB[c.cardId]) unknown++; }); return `${z === 'inkwell' ? 'ink' : z} ${(p[z] || []).length}`; }).join(' ') + ` lore ${p.lore}`;
                const sides = st.players.map((p, i) => `P${i + 1} ${side(p)}`).join(' · ');
                got = `turns ${turns} · nodes ${session.bookmarks.length} · ${sides} · unknown ${unknown}`;
            } catch (e) { got = 'threw: ' + e.message; }
            check('import ' + path.split('/').pop(), got, IMPORTS[path]);
        }

        // Challenge: what the forecast says is what happens.
        const me = App.state.players[App.state.activePlayer], them = App.state.players[1 - App.state.activePlayer];
        const isChar = (c) => (App.cardDB[c.cardId] || {}).type === 'Character';
        const a = me.field.find(isChar), d = them.field.find(isChar);
        if (!a || !d) check('challenge: the demo has a character on each side', false, true);
        else {
            const o = App.challengeOutcome(a.instanceId, d.instanceId);
            const before = [a.damage || 0, d.damage || 0];
            App.performChallenge(a.instanceId, d.instanceId);
            const fa = App.findCard(a.instanceId).card, fd = App.findCard(d.instanceId).card;
            check('challenge: damage taken = forecast', (fa.damage - before[0]) + '/' + (fd.damage - before[1]), o.toAtt + '/' + o.toDef);
            App.undo();
        }

        // A stranger's session file: ids that could break out of markup are re-issued, CSS url() dropped.
        const evil = App.sanitizeSessionData({
            currentState: { activeBookmarkId: 'x" onmouseover="alert(1)', players: [{ name: 7 }] },
            bookmarks: [{ id: 'x" onmouseover="alert(1)', parentId: '<b>', name: 1, color: 'url(https://evil.example/x.png)', gradient: 'red;}body{display:none' }],
            history: ['ok', { not: 'a string' }]
        });
        const b = evil.bookmarks[0];
        check('sanitise: unsafe node id re-issued', /^[A-Za-z0-9_-]+$/.test(b.id) && b.id === evil.currentState.activeBookmarkId, true);
        check('sanitise: CSS url() and breakouts dropped', `${b.color}|${b.gradient}`, 'null|null');
        check('sanitise: names become strings', typeof evil.currentState.players[0].name + typeof b.name, 'stringstring');
        check('sanitise: history keeps strings only', evil.history.length, 1);

        // The session codec rejects what isn't a session, and files from a newer app.
        const rejects = (text) => { try { DojoLibrary.decodeText(text); return false; } catch (e) { return true; } };
        check('codec: rejects junk, non-sessions and newer versions',
            [rejects('nope'), rejects('{"a":1}'), rejects(JSON.stringify({ format: 'practice-dojo-session', version: 3, data: { currentState: {}, bookmarks: [] } }))].join(), 'true,true,true');

        // Replay patches can't reach Object.prototype.
        App.applyJsonPatch({}, [{ op: 'add', path: '/__proto__/dojoPolluted', value: 1 }, { op: 'add', path: '/constructor/prototype/dojoPolluted', value: 1 }]);
        check('replay patch: no prototype pollution', ({}).dojoPolluted, undefined);

        // Device library.
        const L = DojoLibrary, data = App.buildSessionData(), id = L.newId();
        const first = await L.saveSession({ id, title: 'check' }, { data });
        await new Promise(r => setTimeout(r, 5));
        await L.saveSession({ id, title: 'check' }, { data }); // another tab writes
        let stale;
        try { await L.saveSession({ id, title: 'check', updatedAt: first.updatedAt }, { data }); stale = 'not refused'; } catch (e) { stale = e.code; }
        check('library: a stale tab is refused', stale, 'stale');
        await L.deleteSession(id);
        const deck = (n, account, accountDirty) => L.saveDeck({ id: 'check-' + n, name: 'check-' + n, decklist: '1 x', account, accountDirty });
        await deck('clean', { revision: 1, uid: 'me' }, false);
        await deck('dirty', { revision: 1, uid: 'me' }, true);
        await deck('other', { revision: 1, uid: 'other' }, false);
        const removed = await L.deleteAccountCopies('me');
        const left = (await L.listDecks()).map(x => x.name).filter(n => n.startsWith('check-')).sort().join();
        check('library: sign-out keeps unsynced and other accounts\' copies', `${left} kept ${removed.kept}`, 'check-dirty,check-other kept 1');
        await Promise.all(['dirty', 'other'].map(n => L.deleteDeck('check-' + n)));
        return out;
    }, IMPORTS);
    writeFileSync(process.env.APP_CHECKS_OUT, JSON.stringify(results));
};

// --- From the command line ------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
    const dir = mkdtempSync(join(tmpdir(), 'app-checks-'));
    const out = join(dir, 'results.json');
    const r = spawnSync(process.execPath, [
        join(ROOT, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--demo', '--widths', '1440', '--themes', 'day', '--steps', fileURLToPath(import.meta.url), '--out', dir
    ], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, APP_CHECKS_OUT: out } });
    let rows;
    try { rows = JSON.parse(readFileSync(out, 'utf8')); } catch (e) {
        console.error(r.stdout || '', r.stderr || '', '\napp-checks: the headless run gave no results (see above).');
        process.exit(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
    if (process.argv.includes('--update')) {
        rows.filter(x => x.name.startsWith('import ')).forEach(x => console.log(`${x.name.slice(7)}: '${x.got}'`));
        process.exit(0);
    }
    const tables = runTableChecks(ROOT);
    rows = rows.concat(tables || [{ name: 'tables: the headless run gave results', ok: false, got: 'none', want: 'results' }]);
    for (const x of rows) console.log(`${x.ok ? 'pass' : 'FAIL'}  ${x.name}${x.ok ? '' : `\n      got:  ${x.got}\n      want: ${x.want}`}`);
    const fails = rows.filter(x => !x.ok).length;
    console.log(`\n${rows.length - fails} pass, ${fails} fail.`);
    process.exit(fails ? 1 : 0);
}
