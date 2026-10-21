// Checks a hand-written match log against the Practice Dojo's own importer, headless.
//
//   node check.mjs <log.txt>                 Import it the way "Import log" does and report
//   node check.mjs --find "stitch" "queen h" Look up card names (several at once)
//
// The report: turns and timeline nodes, the board at the end, every card name that isn't an
// exact card ("Name - Version") with the card the app would guess, and every line the importer
// dropped. Exits 1 on any of them, a turn with no "… turn begins", or an import that throws.
// Runs through .claude/skills/dojo-screenshots/shoot.mjs, so it needs Playwright.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Lines the importer skips on purpose: steps, timers, narration of abilities.
const NARRATION = /^(Game started!?|Ready step.*|Set step|Draw step|.*timer started.*|.* gained \d+ seconds.*|.* ended (their|your|.*'s) turn|.*'s [A-Z0-9][A-Z0-9 ,.'!?&-]+ .*)$/;

// --- In the page (steps module for shoot.mjs) ------------------------------------------------
export default async (page) => {
    const job = JSON.parse(process.env.STREAM_LOG_JOB);
    await page.waitForFunction(() => typeof App !== 'undefined' && App.allCards && App.allCards.length > 0, null, { timeout: 120000 });
    const report = await page.evaluate(({ job, narration }) => {
        const desc = (c) => `${c.fullName} · ${c.cost} ink · ${c.color} · ${c.type}${c.inkwell ? ' · inkable' : ''}`;
        if (job.find) {
            return job.find.map(q => {
                const words = q.toLowerCase().split(/\s+/).filter(Boolean);
                const hits = App.allCards.filter(c => words.every(w => (c.fullName || c.name).toLowerCase().includes(w)));
                const seen = new Set();
                const rows = hits.filter(c => !seen.has(c.fullName) && seen.add(c.fullName)).slice(0, 12).map(desc);
                return `"${q}": ${rows.length ? '\n  ' + rows.join('\n  ') : 'no card'}`;
            }).join('\n');
        }

        const out = [], problems = [];
        const parsed = App.parseDojoLog(job.text);
        out.push(`format ${parsed.format}${parsed.format === 'v2' ? '' : '  (expected v2: start with "Your starting hand:")'}`);

        // Names: exact or guessed. A guess is the app's fuzzy match, often the wrong version.
        const names = new Set();
        parsed.players.forEach(p => [...p.openingHand, ...p.mulliganedCards, ...p.drawnAfterMulligan].forEach(n => n && names.add(n)));
        parsed.turns.forEach(t => t.events.forEach(e => [e.name, e.target, e.attacker, ...(e.singers || [])].forEach(n => n && names.add(n))));
        // Exact means a card's full name: a bare "Stitch" would import as whichever Stitch comes first.
        const full = new Set(App.allCards.map(c => (c.fullName || c.name).toLowerCase()));
        for (const n of names) {
            if (full.has(n.toLowerCase())) continue;
            const g = App.resolveCardName(n);
            const base = n.split(' - ')[0].toLowerCase();
            const alts = [...new Set(App.allCards.filter(c => c.name.toLowerCase() === base).map(c => c.fullName))].slice(0, 8);
            problems.push(`${g ? `guessed: "${n}" → ${g.fullName}` : `unknown card: "${n}"`}${alts.length ? `  (versions: ${alts.join(' | ')})` : ''}`);
        }

        // Turns: who's active, what the importer read.
        parsed.turns.forEach(t => {
            if (t.activePlayerIndex < 0) problems.push(`turn ${t.turnNumber}: no "Your turn begins" / "Opponent's turn begins"`);
            const n = {};
            t.events.forEach(e => { n[e.t] = (n[e.t] || 0) + 1; });
            out.push(`turn ${t.turnNumber} ${['You', 'Opp'][t.activePlayerIndex] || '??'}: ${Object.entries(n).map(([k, v]) => `${k} ${v}`).join(', ') || 'nothing'}`);
        });

        // Dropped lines: a line the importer turns into no event, parsed on its own inside a turn.
        const head = 'Your starting hand: x\n--- Turn 1 ---\nYour turn begins\n';
        let turn = 0;
        for (const raw of job.text.split('\n')) {
            const line = raw.trim();
            const tm = /^---\s*Turn (\d+)\s*---$/.exec(line);
            if (tm) { turn = tm[1]; continue; }
            if (!line || new RegExp(narration).test(line) || /^(Your|Opponent's) turn begins$|starting hand:|mulliganed|took back/.test(line)) continue;
            if (!App.parseDojoLog(head + line).turns[0].events.length) problems.push(`dropped (turn ${turn}): ${line}`);
        }

        try {
            const session = App.buildSessionFromLog(parsed);
            const st = App.decompressState(session.currentState);
            out.push(`nodes ${session.bookmarks.length}`);
            st.players.forEach((p, i) => out.push(`end ${['You', 'Opp'][i]}: lore ${p.lore} · hand ${p.hand.length} · field ${p.field.length} · ink ${p.inkwell.length} · discard ${p.discard.length} · deck ${p.deck.length}`));
        } catch (e) { problems.push('import threw: ' + e.message); }
        return out.join('\n') + (problems.length ? '\n\n' + problems.join('\n') : '\n\nclean') + `\n__FAIL__${problems.length}`;
    }, { job, narration: NARRATION.source });
    writeFileSync(process.env.STREAM_LOG_OUT, report);
};

// --- From the command line -------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const args = process.argv.slice(2);
    if (!args.length) { console.log('node check.mjs <log.txt>  |  node check.mjs --find "<name>" …'); process.exit(1); }
    const job = args[0] === '--find' ? { find: args.slice(1) } : { text: readFileSync(resolve(args[0]), 'utf8') };
    const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
    const dir = mkdtempSync(join(tmpdir(), 'stream-log-'));
    const out = join(dir, 'report.txt');
    const r = spawnSync(process.execPath, [
        join(ROOT, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--widths', '1440', '--themes', 'auto', '--wait', '0', '--steps', fileURLToPath(import.meta.url), '--out', dir
    ], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, STREAM_LOG_OUT: out, STREAM_LOG_JOB: JSON.stringify(job) } });
    let report;
    try { report = readFileSync(out, 'utf8'); } catch (e) {
        console.error(r.stdout || '', r.stderr || '', '\ncheck: the headless run gave no report (see above).');
        process.exit(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
    const [text, fails] = report.split('__FAIL__');
    console.log(text);
    process.exit(Number(fails) ? 1 : 0);
}
