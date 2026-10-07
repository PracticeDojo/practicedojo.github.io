// Brings the landing page (index.html) up to date with the app, in one go.
// Run it after any visible change to the app, then commit what it changed.
//
//   node tools/refresh-landing.mjs            version + demo data + screenshots
//   node tools/refresh-landing.mjs --no-shots version + demo data only
//   node tools/refresh-landing.mjs --check    exit 1 if the version or the data is stale
//
// 1. Version: copies APP_VERSION from app/index.html into every element of
//    index.html marked data-app-version.
// 2. Demo data: rebuilds js/landing-multiverse-data.js (tools/landing-data.mjs).
// 3. Screenshots: retakes img/dojo_board_*.webp and img/dojo_phone_*.webp with
//    the dojo-screenshots skill (tools/landing-shots.mjs). Needs Playwright and
//    the network (the app's card database comes from a CDN).
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const shots = !check && !args.includes('--no-shots');
// Node's fetch only uses HTTPS_PROXY when asked to (cloud sessions sit behind one).
const env = { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' };
let stale = false;

// ---- 1. Version ----
const app = readFileSync(join(ROOT, 'app/index.html'), 'utf8');
const m = /const APP_VERSION = "(v\d+\.\d+\.\d+)"/.exec(app);
if (!m) throw new Error('APP_VERSION not found in app/index.html');
const version = m[1];
const landingFile = join(ROOT, 'index.html');
const landing = readFileSync(landingFile, 'utf8');
const synced = landing.replace(/(<[^>]*\bdata-app-version\b[^>]*>)v\d+\.\d+\.\d+/g, `$1${version}`);
if (synced === landing) console.log(`index.html: already ${version}`);
else if (check) { console.error(`index.html: version is not ${version}`); stale = true; }
else { writeFileSync(landingFile, synced); console.log(`index.html: version set to ${version}`); }

// ---- 2. Demo data ----
const data = spawnSync(process.execPath, [join(ROOT, 'tools/landing-data.mjs'), ...(check ? ['--check'] : [])], { stdio: 'inherit', env });
if (data.status !== 0) { if (check) stale = true; else process.exit(data.status || 1); }

// ---- 3. Screenshots ----
if (shots) {
    const out = mkdtempSync(join(tmpdir(), 'landing-shots-'));
    const r = spawnSync(process.execPath, [
        join(ROOT, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--demo', '--widths', '1440,390', '--themes', 'day,night', '--wait', '2500',
        '--steps', join(ROOT, 'tools/landing-shots.mjs'), '--out', out
    ], { stdio: 'inherit', env, cwd: ROOT });
    rmSync(out, { recursive: true, force: true });
    if (r.status !== 0) process.exit(r.status || 1);
    console.log('Screenshots retaken. If the board layout moved, check the pins on them in index.html.');
}

if (stale) { console.error('The landing page is out of date: run node tools/refresh-landing.mjs'); process.exit(1); }
