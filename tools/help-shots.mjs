// Retakes the manual's screenshots (ARCH §5.6): a --steps module for the dojo-screenshots
// skill. Run it through `node tools/help.mjs shots`, or by hand:
//
//   node .claude/skills/dojo-screenshots/shoot.mjs --demo --widths 1440 \
//     --themes day,night --steps tools/help-shots.mjs --out <scratch dir>
//
// It writes WebP files straight into app/help/img/ (the PNGs stay in --out). Articles show
// them as ![…](img/<name>-{theme}.webp): the viewer picks day or night.
//   mini-multiverse-<theme>.webp   the mini multiverse in the side rail (desktop)
//   left-here-<theme>.webp         a "Left here" snapshot on its dashed line, with the node it hangs off
// The browser encodes the WebP itself, so nothing else needs installing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'app', 'help', 'img');

async function toWebp(page, png, name) {
    const b64 = fs.readFileSync(png).toString('base64');
    const out = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, b64);
    fs.mkdirSync(IMG, { recursive: true });
    fs.writeFileSync(path.join(IMG, name), Buffer.from(out, 'base64'));
    console.log(`app/help/img/${name}`);
}

// Both themes are taken in one pass (the first run), from the same clean board: the steps
// module runs once per theme on the same page, and the snapshot changes the board.
async function setTheme(page, wait, theme) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    await wait(250);
}

export default async (page, { shot, wait, phone }) => {
    if (phone) return; // both pictures are of the desktop layout
    if (await page.evaluate(() => window.__helpShotsDone)) return;
    await page.evaluate(() => { window.__helpShotsDone = true; });
    const themes = ['day', 'night'];

    // 1. The mini multiverse, before anything changes on the board.
    for (const t of themes) {
        await setTheme(page, wait, t);
        await toWebp(page, await shot(`mini-multiverse-${t}`, { clip: 'sel:#mmv' }), `mini-multiverse-${t}.webp`);
    }

    // 2. A "Left here" snapshot with the node it hangs off. The demo has one; if it ever
    //    doesn't, make one: change the board and step back a turn (the board you leave is kept).
    const openTree = async () => {
        await page.evaluate(() => {
            if (App.treeView === 'plot' && App.toggleTreeView) App.toggleTreeView();
            if (document.getElementById('tree-modal').classList.contains('hidden')) App.openTreeModal();
        });
        await wait(1200);
    };
    await openTree();
    if (!(await page.evaluate(() => !!document.querySelector('#tree-nodes .tree-node.is-ghost')))) {
        await page.evaluate(() => { App.closeTreeModal(); App.changeLore(App.state.activePlayer, 1); });
        await wait(300);
        await page.evaluate(() => App.mmvStep('back'));
        await wait(1200);
        await openTree();
    }
    const ok = await page.evaluate(() => {
        const ghost = document.querySelector('#tree-nodes .tree-node.is-ghost');
        if (!ghost) return false;
        App.centerTreeOnNode(ghost.dataset.id);
        return true;
    });
    if (!ok) { console.log('help-shots: no "Left here" snapshot in the tree; left-here not retaken'); return; }
    await wait(900);
    // Follow the snapshot's dashed edge back to the node at its other end, then frame the top
    // of both cards (a node's lower half is empty space in the picture).
    const rect = await page.evaluate(() => {
        const ghost = document.querySelector('#tree-nodes .tree-node.is-ghost');
        const g = ghost.getBoundingClientRect();
        const toScreen = (path, len) => {
            const p = path.getPointAtLength(len), m = path.getScreenCTM();
            return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
        };
        let parent = null, edge = null;
        for (const path of document.querySelectorAll('#tree-svg path.is-ghost')) {
            const end = toScreen(path, path.getTotalLength());
            if (Math.abs(end.x - g.left) < 40 && end.y > g.top - 10 && end.y < g.bottom + 10) { edge = path; break; }
        }
        if (edge) {
            const start = toScreen(edge, 0);
            for (const n of document.querySelectorAll('#tree-nodes .tree-node:not(.is-ghost)')) {
                const r = n.getBoundingClientRect();
                if (start.x >= r.left - 8 && start.x <= r.right + 8 && start.y >= r.top - 8 && start.y <= r.bottom + 8) { parent = r; break; }
            }
        }
        const vp = document.getElementById('tree-viewport').getBoundingClientRect();
        const H = 200; // the head of each card: title, subline, note
        const l = parent ? Math.min(parent.left, g.left) : g.left;
        const t = parent ? Math.min(parent.top, g.top) : g.top;
        const b = Math.max(g.top, parent ? parent.top : g.top) + H;
        const x = Math.max(vp.left, l - 20), y = Math.max(vp.top, t - 20);
        const r = Math.min(vp.right, g.right + 20), bb = Math.min(vp.bottom, b);
        return `${Math.round(x)},${Math.round(y)},${Math.round(r - x)},${Math.round(bb - y)}`;
    });
    for (const t of themes) {
        await setTheme(page, wait, t);
        await toWebp(page, await shot(`left-here-${t}`, { clip: rect }), `left-here-${t}.webp`);
    }
    await page.evaluate(() => App.closeTreeModal());
};
