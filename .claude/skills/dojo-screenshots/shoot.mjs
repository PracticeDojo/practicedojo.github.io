#!/usr/bin/env node
// Screenshot the Practice Dojo (app or landing page) in headless Chromium.
//
// Serves the repo (or any git ref of it) on a local port, opens the page,
// optionally opens the Set 13 demo, and shoots every width × theme you ask
// for. A --steps module can drive the page and take named shots itself
// (open a panel, inject a mock-up, click through a flow).
//
//   node .claude/skills/dojo-screenshots/shoot.mjs --demo --widths 1440,390 --out /tmp/shots
//   node .claude/skills/dojo-screenshots/shoot.mjs --demo --ref origin/main --name before- --clip top:60
//   node .claude/skills/dojo-screenshots/shoot.mjs --page landing --widths 1440 --clip full
//
// Run with --help for every option. See SKILL.md for recipes.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');

// ---------- options ----------
const HELP = `
Options
  --page app|landing     Which page to open (default app). --path /x/ opens any path.
  --demo                 Open the Set 13 demo from the app's home screen first.
  --widths 1440,390      Viewport widths. Under 761 is treated as a phone (touch, 844 tall).
  --height 900           Desktop viewport height.
  --themes day,night     Themes to shoot: day, night, or auto (leave the app's choice).
  --clip <spec>          What to capture for the default shot:
                           (none)        the viewport
                           full          the whole scrollable page
                           top:60        a strip of the top 60px (the top bar)
                           x,y,w,h       a rectangle in CSS px
                           sel:<css>     one element, e.g. sel:#topbar
  --steps <file.mjs>     Module whose default export drives the page and takes shots:
                           export default async (page, { shot, width, phone, theme, wait }) => {
                             await page.click('#btn-multiverse');
                             await shot('multiverse', { clip: 'full' });
                           }
                         Runs once per width × theme, after the page (and demo) is ready.
  --inject <file.js>     Script added to the page before steps / shots (mock-ups, helpers).
  --ref <git ref>        Serve that commit instead of the working tree (before/after shots).
  --out <dir>            Output folder (default: $TMPDIR/dojo-shots). Created if missing.
  --name <prefix>        File name prefix, e.g. "before-".
  --scale 2              Device scale factor (2 = crisp retina PNGs).
  --wait 1500            Extra settle time in ms after load / demo.
  --toasts               Keep toasts ("Opened your copy of …"); hidden by default so
                         they don't cover the top bar.
Files are named <prefix><shot>-<width>-<theme>.png; the default shot is called "page".
`;

function parseArgs(argv) {
    const o = { page: 'app', widths: '1440', height: 900, themes: 'day', scale: 2, wait: 1500, name: '' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') { console.log(HELP); process.exit(0); }
        if (a === '--demo') { o.demo = true; continue; }
        if (a === '--toasts') { o.toasts = true; continue; }
        if (!a.startsWith('--')) throw new Error(`Unexpected argument: ${a}`);
        const key = a.slice(2);
        const val = argv[++i];
        if (val === undefined) throw new Error(`${a} needs a value`);
        o[key] = val;
    }
    o.widths = String(o.widths).split(',').map(Number).filter(Boolean);
    o.themes = String(o.themes).split(',').map(s => s.trim()).filter(Boolean);
    o.height = Number(o.height);
    o.scale = Number(o.scale);
    o.wait = Number(o.wait);
    o.out = path.resolve(o.out || path.join(os.tmpdir(), 'dojo-shots'));
    return o;
}

// ---------- playwright (whichever copy this machine has) ----------
async function loadPlaywright() {
    const tries = [];
    if (process.env.PLAYWRIGHT_MODULE) tries.push(process.env.PLAYWRIGHT_MODULE);
    tries.push(path.join(REPO, 'node_modules', 'playwright'));
    try { tries.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')); } catch (e) { }
    tries.push('/opt/node-tools/node_modules/playwright');
    for (const p of tries) {
        try {
            const req = createRequire(path.join(p, 'package.json'));
            return req(p);
        } catch (e) { }
    }
    throw new Error('Playwright not found. Install it (npm i -g playwright && npx playwright install chromium) '
        + 'or point PLAYWRIGHT_MODULE at its folder.');
}

// ---------- the files to serve ----------
function sourceDir(ref) {
    if (!ref) return REPO;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dojo-ref-'));
    execSync(`git -C "${REPO}" archive "${ref}" | tar -x -C "${dir}"`, { stdio: 'inherit', shell: '/bin/bash' });
    return dir;
}

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8', '.gz': 'application/gzip',
};

function serve(root) {
    const server = http.createServer((req, res) => {
        let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
        let file = path.join(root, p);
        if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
        try {
            if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
            const body = fs.readFileSync(file);
            res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
            res.end(body);
        } catch (e) {
            res.writeHead(404); res.end('Not found');
        }
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ---------- shooting ----------
function clipFor(spec, width) {
    if (!spec) return {};
    if (spec === 'full') return { fullPage: true };
    if (spec.startsWith('top:')) return { clip: { x: 0, y: 0, width, height: Number(spec.slice(4)) } };
    if (spec.startsWith('sel:')) return { selector: spec.slice(4) };
    const n = spec.split(',').map(Number);
    if (n.length === 4 && n.every(v => !Number.isNaN(v))) return { clip: { x: n[0], y: n[1], width: n[2], height: n[3] } };
    throw new Error(`Bad --clip: ${spec}`);
}

async function openDemo(page) {
    await page.waitForSelector('[data-act="open-demo"]', { timeout: 90000 });
    await page.click('[data-act="open-demo"]');
    await page.waitForFunction(() => {
        const t = document.getElementById('topbar');
        return t && getComputedStyle(t).display !== 'none';
    }, null, { timeout: 60000 });
}

async function main() {
    const o = parseArgs(process.argv.slice(2));
    fs.mkdirSync(o.out, { recursive: true });
    const { chromium } = await loadPlaywright();
    const root = sourceDir(o.ref);
    const server = await serve(root);
    const port = server.address().port;
    const base = `http://127.0.0.1:${port}`;
    const url = base + (o.path || (o.page === 'landing' ? '/' : '/app/'));

    // Behind an HTTPS proxy (cloud sessions) Chromium must use it for the card
    // database and CDNs, but must reach our own server directly.
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
    const args = proxy ? [`--proxy-server=${proxy}`, `--proxy-bypass-list=127.0.0.1:${port};localhost:${port}`] : [];
    const browser = await chromium.launch({ args });

    const steps = o.steps ? (await import(pathToFileURL(path.resolve(o.steps)).href)).default : null;
    const inject = o.inject ? fs.readFileSync(path.resolve(o.inject), 'utf8') : null;
    const written = [];

    try {
        for (const width of o.widths) {
            const phone = width < 761;
            const ctx = await browser.newContext({
                viewport: { width, height: phone ? 844 : o.height },
                deviceScaleFactor: o.scale, isMobile: phone, hasTouch: phone,
            });
            const page = await ctx.newPage();
            page.on('pageerror', e => console.log(`[${width}] page error: ${e.message}`));
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            if (o.demo) await openDemo(page);
            await page.waitForTimeout(o.wait);
            if (!o.toasts) await page.addStyleTag({ content: '.toast{display:none!important}' });
            if (inject) await page.addScriptTag({ content: inject });

            for (const theme of o.themes) {
                if (theme !== 'auto') {
                    await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
                    await page.waitForTimeout(200);
                }
                const shot = async (name, opts = {}) => {
                    const spec = typeof opts === 'string' ? opts : opts.clip;
                    const c = clipFor(spec === undefined ? o.clip : spec, width);
                    const file = path.join(o.out, `${o.name}${name}-${width}-${theme}.png`);
                    if (c.selector) await page.locator(c.selector).first().screenshot({ path: file });
                    else await page.screenshot({ path: file, ...c });
                    written.push(file);
                    return file;
                };
                const ctxInfo = { shot, width, phone, theme, wait: ms => page.waitForTimeout(ms), url, base };
                if (steps) await steps(page, ctxInfo);
                else await shot('page');
            }
            await ctx.close();
        }
    } finally {
        await browser.close();
        server.close();
        if (o.ref) fs.rmSync(root, { recursive: true, force: true });
    }
    for (const f of written) console.log(f);
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
