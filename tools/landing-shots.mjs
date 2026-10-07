// Retakes the landing page's screenshots of the app: a --steps module for the
// dojo-screenshots skill. Run it through tools/refresh-landing.mjs, or by hand:
//
//   node .claude/skills/dojo-screenshots/shoot.mjs --demo --widths 1440,390 \
//     --themes day,night --steps tools/landing-shots.mjs --out <scratch dir>
//
// It writes WebP files straight into img/ (the PNGs stay in --out):
//   dojo_board_<theme>.webp         desktop, 1440×900 at 2×, Dumbo hovered, 2400 wide
//   dojo_phone_board_<theme>.webp   phone, 390×844 at 2×, the board
//   dojo_phone_drawer_<theme>.webp  phone, Dumbo tapped: the card drawer
// The browser encodes the WebP itself, so nothing else needs installing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const IMG = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'img');

async function toWebp(page, png, name, width) {
    const b64 = fs.readFileSync(png).toString('base64');
    const out = await page.evaluate(async ({ b64, width }) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = width;
        c.height = Math.round(img.height * width / img.width);
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, { b64, width });
    const file = path.join(IMG, name);
    fs.writeFileSync(file, Buffer.from(out, 'base64'));
    console.log(file);
}

export default async (page, { shot, phone, theme, wait }) => {
    // The Dumbo on the board (the discard list and the tree have one too).
    const dumbo = page.locator('.play .card.card-face[aria-label="Dumbo"]:visible').last();
    if (!phone) {
        await dumbo.hover();
        await wait(700);
        await toWebp(page, await shot('board'), `dojo_board_${theme}.webp`, 2400);
        await page.mouse.move(2, 2);
        await wait(300);
        return;
    }
    await toWebp(page, await shot('phone-board'), `dojo_phone_board_${theme}.webp`, 780);
    await dumbo.tap();
    await wait(900);
    await toWebp(page, await shot('phone-drawer'), `dojo_phone_drawer_${theme}.webp`, 780);
    await page.keyboard.press('Escape');
    // Drop the tapped card's focus ring, or the next theme's board shows it.
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await wait(600);
};
