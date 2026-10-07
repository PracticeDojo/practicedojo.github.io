// Steps example for mock-ups: one top-bar strip per variant.
//   node shoot.mjs --demo --widths 1440,390 --inject examples/mock-topbar.js --steps examples/mock-topbar.mjs
export default async (page, { shot, wait }) => {
    for (const v of ['A', 'B']) {
        await page.evaluate(v => window.__mock(v), v);
        await wait(200);
        await shot(`mock-${v}`, { clip: 'top:60' });
    }
};
