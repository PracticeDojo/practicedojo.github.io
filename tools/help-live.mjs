// `node tools/help.mjs --live`: is every target in app/help/targets.json a visible element
// in the running app, on its devices? docs/ARCH-help-and-tour.md §10.
//
// Opens the app headless at 1440 and 390 with the Set 13 demo through the dojo-screenshots
// tool (.claude/skills/dojo-screenshots/shoot.mjs, with tools/help-live-steps.mjs as its
// steps module), opens each target's screen and asks DojoSpotlight.resolve() for it.
// Screens it can open: board, multiverse, tweaks, library, home. Targets on the others
// (mulligan, drawer, challenge, shared) are reported as skipped. A target with no selector
// for a device is n/a there. Prints a table; exits 1 if any target fails.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function runLive(ROOT) {
    const dir = mkdtempSync(join(tmpdir(), 'help-live-'));
    const out = join(dir, 'results.json');
    const r = spawnSync(process.execPath, [
        join(ROOT, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--demo', '--widths', '1440,390', '--themes', 'day', '--wait', '1000',
        '--steps', join(ROOT, 'tools/help-live-steps.mjs'), '--out', dir
    ], {
        cwd: ROOT, encoding: 'utf8',
        env: { ...process.env, HELP_LIVE_OUT: out, HELP_LIVE_TARGETS: join(ROOT, 'app/help/targets.json') }
    });
    let rows;
    try { rows = JSON.parse(readFileSync(out, 'utf8')); }
    catch (e) {
        console.error(r.stdout || '', r.stderr || '');
        console.error('--live: the headless run gave no results (see above).');
        rmSync(dir, { recursive: true, force: true });
        return 2;
    }
    rmSync(dir, { recursive: true, force: true });

    const widths = [...new Set(rows.map(x => x.width))];
    const names = [...new Set(rows.map(x => x.name))];
    const cell = (name, w) => {
        const x = rows.find(y => y.name === name && y.width === w);
        return x ? x : { status: '-' };
    };
    const pad = (s, n) => String(s).padEnd(n);
    const wName = Math.max(6, ...names.map(n => n.length));
    console.log(`${pad('target', wName)}  ${pad('screen', 10)}  ${widths.map(w => pad(w, 6)).join('  ')}  note`);
    for (const n of names) {
        const cells = widths.map(w => cell(n, w));
        const notes = [...new Set(cells.filter(c => c.status !== 'pass' && c.note).map(c => c.note))].join('; ');
        const screen = (rows.find(y => y.name === n) || {}).screen || '';
        console.log(`${pad(n, wName)}  ${pad(screen, 10)}  ${cells.map(c => pad(c.status, 6)).join('  ')}  ${notes}`);
    }
    const tally = (s) => rows.filter(x => x.status === s).length;
    const fails = rows.filter(x => x.status === 'fail');
    console.log(`\n${tally('pass')} pass, ${tally('skip')} skipped, ${tally('n/a')} n/a, ${fails.length} fail ` +
        `(${names.length} targets × ${widths.length} widths).`);
    if (fails.length) {
        console.error(`\nFailed:\n${fails.map(f => `  ${f.name} @${f.width} (${f.device}) ${f.sel}: ${f.note}`).join('\n')}`);
        return 1;
    }
    return 0;
}
