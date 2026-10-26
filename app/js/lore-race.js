// Lore race (Feature 65): both players' lore along one line of the multiverse,
// drawn on glass. A port of the landing page's chart (js/landing-multiverse.js):
// P1 solid, P2 dashed, 20 wins dashed, the lore numerals in signal.
//
// It knows nothing about game state. App hands it the points:
//   svg(pts, { width, height, now }) -> SVG markup
//     pts: [{ turn, lore: [p1, p2] }] from the first turn on
//     now: index of the node you're on; points after it are ahead (faint)
window.LoreRace = (function () {
    'use strict';

    const PAD_L = 10, PAD_R = 46, TOP = 10, BOT = 18;

    function svg(pts, { width, height, now } = {}) {
        const W = Math.max(120, Math.round(width || 280)), H = height || 74;
        const last = pts.length - 1;
        const at = now == null || now < 0 || now > last ? last : now;
        const span = Math.max(1, last);
        const vMax = Math.max(20, ...pts.map(p => Math.max(...p.lore)));
        const x = (i) => PAD_L + i * (W - PAD_L - PAD_R) / span;
        const y = (v) => TOP + (1 - v / vMax) * (H - TOP - BOT);
        const d = (p, a, b) => pts.slice(a, b + 1)
            .map((q, k) => `${k ? 'L' : 'M'} ${x(a + k).toFixed(1)} ${y(q.lore[p]).toFixed(1)}`).join(' ');
        const right = W - PAD_R + 4;

        // Turn ticks: T1, then every third turn.
        let ticks = '';
        const seen = new Set();
        pts.forEach((p, i) => {
            if (p.turn == null || seen.has(p.turn)) return;
            seen.add(p.turn);
            if (p.turn === 1 || p.turn % 3 === 1) ticks += `<text class="lr-tick" x="${x(i).toFixed(1)}" y="${H - 4}" text-anchor="middle">T${p.turn}</text>`;
        });

        // The higher player's label sits above the lower one's, at least 12px apart.
        const [e1, e2] = pts[at].lore, hi = e2 >= e1;
        const yHi = Math.min(y(e1), y(e2)) + 3, yLo = Math.max(Math.max(y(e1), y(e2)) + 3, yHi + 12);
        const lx = x(last) + 8;

        return `<svg class="lr-svg" viewBox="0 0 ${W} ${H}" role="img"
            aria-label="Lore by turn on this line: Player 1 has ${e1}, Player 2 has ${e2}, 20 wins">
            <line class="lr-grid" x1="${PAD_L}" x2="${right}" y1="${y(0)}" y2="${y(0)}"/>
            <line class="lr-grid is-win" x1="${PAD_L}" x2="${right}" y1="${y(20)}" y2="${y(20)}"/>
            <text class="lr-tick" x="${PAD_L}" y="${y(20) - 4}">20 WINS</text>
            ${at < last ? `<path class="lr-p1 is-ahead" d="${d(0, at, last)}"/><path class="lr-p2 is-ahead" d="${d(1, at, last)}"/>` : ''}
            <path class="lr-p1" d="${d(0, 0, at)}"/><path class="lr-p2" d="${d(1, 0, at)}"/>
            <line class="lr-now" x1="${x(at)}" x2="${x(at)}" y1="${y(20)}" y2="${y(0)}"/>
            <circle class="lr-end" cx="${x(at)}" cy="${y(e1)}" r="2.6"/><circle class="lr-end" cx="${x(at)}" cy="${y(e2)}" r="2.6"/>
            <text class="lr-who" x="${lx}" y="${hi ? yHi : yLo}">P2 <tspan class="lr-num">${e2}</tspan></text>
            <text class="lr-who" x="${lx}" y="${hi ? yLo : yHi}">P1 <tspan class="lr-num">${e1}</tspan></text>
            ${ticks}</svg>`;
    }

    return { svg };
})();
