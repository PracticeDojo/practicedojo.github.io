#!/usr/bin/env node
// Lay labelled screenshots out on one PNG: before/after pairs, a stack of
// variants, a grid of widths. Renders an HTML page in headless Chromium, so
// it needs nothing beyond Playwright.
//
//   node compose.mjs --out compare.png --cols 2 "Before=/tmp/shots/before-page-1440-day.png" "After=/tmp/shots/page-1440-day.png"
//   node compose.mjs --out bars.png --title "Top bar" "Now=a.png" "A · Grouped=b.png" "B · Turn=c.png"
//
// Items are "Label=path" (or just a path). --cols 1 (default) stacks them;
// --cols 2 puts pairs side by side. --crop x,y,w,h crops every image (in the
// image's CSS px, i.e. half its pixel size at --scale 2) before laying it out.

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');

async function loadPlaywright() {
    const tries = [];
    if (process.env.PLAYWRIGHT_MODULE) tries.push(process.env.PLAYWRIGHT_MODULE);
    tries.push(path.join(REPO, 'node_modules', 'playwright'));
    try { tries.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')); } catch (e) { }
    tries.push('/opt/node-tools/node_modules/playwright');
    for (const p of tries) {
        try { return createRequire(path.join(p, 'package.json'))(p); } catch (e) { }
    }
    throw new Error('Playwright not found (see shoot.mjs --help).');
}

// PNG width/height live at bytes 16–24 of the IHDR chunk.
function pngSize(buf) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function main() {
    const argv = process.argv.slice(2);
    const o = { cols: 1, scale: 2, gap: 24, items: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--help' || a === '-h') {
            console.log('compose.mjs --out file.png [--cols N] [--title T] [--crop x,y,w,h] [--scale 2] "Label=path" ...');
            process.exit(0);
        }
        if (a.startsWith('--')) { o[a.slice(2)] = argv[++i]; continue; }
        const eq = a.indexOf('=');
        const looksLikeLabel = eq > 0 && !fs.existsSync(a);
        o.items.push(looksLikeLabel ? { label: a.slice(0, eq), file: a.slice(eq + 1) } : { label: '', file: a });
    }
    if (!o.out) throw new Error('--out is required');
    if (!o.items.length) throw new Error('Give at least one image');
    const cols = Number(o.cols), scale = Number(o.scale), gap = Number(o.gap);
    const crop = o.crop ? o.crop.split(',').map(Number) : null;

    const cells = o.items.map(({ label, file }) => {
        const buf = fs.readFileSync(path.resolve(file));
        const { w, h } = pngSize(buf);
        const cw = w / scale, ch = h / scale;          // the shot's CSS size
        const [x, y, vw, vh] = crop || [0, 0, cw, ch];
        return { label, src: `data:image/png;base64,${buf.toString('base64')}`, cw, ch, x, y, vw, vh };
    });
    const colW = Math.max(...cells.map(c => c.vw));
    const pageW = cols * colW + (cols + 1) * gap;

    const html = `<!doctype html><meta charset="utf-8"><style>
        body{margin:0;background:#fff;font:600 15px/1.3 -apple-system,system-ui,'Segoe UI',sans-serif;color:#111}
        .wrap{padding:${gap}px;display:grid;grid-template-columns:repeat(${cols},${colW}px);gap:${gap}px}
        h1{grid-column:1/-1;margin:0;font-size:20px}
        .cell{display:flex;flex-direction:column;gap:8px}
        .frame{overflow:hidden;position:relative;border:1px solid #ddd;border-radius:6px}
        .frame img{position:absolute;display:block}
    </style><div class="wrap">${o.title ? `<h1>${esc(o.title)}</h1>` : ''}${cells.map(c => `
        <div class="cell">${c.label ? `<div>${esc(c.label)}</div>` : ''}
        <div class="frame" style="width:${c.vw}px;height:${c.vh}px">
        <img src="${c.src}" style="width:${c.cw}px;height:${c.ch}px;left:${-c.x}px;top:${-c.y}px"></div></div>`).join('')}
    </div>`;

    const { chromium } = await loadPlaywright();
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: Math.ceil(pageW), height: 1 }, deviceScaleFactor: scale });
    await page.setContent(html);
    await page.waitForFunction(() => [...document.images].every(i => i.complete));
    await page.screenshot({ path: path.resolve(o.out), fullPage: true });
    await browser.close();
    console.log(path.resolve(o.out));
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
