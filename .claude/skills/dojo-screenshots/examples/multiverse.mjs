// Steps example: the board, then the Multiverse open.
//   node shoot.mjs --demo --widths 1440,390 --steps examples/multiverse.mjs
export default async (page, { shot, wait }) => {
    await shot('board');
    await shot('topbar', { clip: 'top:60' });
    await page.click('#btn-multiverse');
    await wait(1000);
    await shot('multiverse');
    await page.keyboard.press('Escape');
    await wait(300);
};
