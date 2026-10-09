// Mini Multiverse (Feature 53): the multiverse drawn as lines in the sidebar,
// and the moves its step buttons make. The landing page's map layout
// (js/landing-multiverse.js): a line keeps its row and a branch takes the
// nearest free row, so a whole game fits in a few rows.
//
// It knows nothing about game state. App (app/index.html) hands it the nodes
// as plain items and decides what loading one means:
//   items: [{ id, parentId, ts, auto, turn, p, lore, win, name }]
//   build(items, hereId, trail) -> model    (hereId: the node you're on;
//                                            trail: ids you stepped back along)
//   move(model, kind, edited)   -> id | null (kind: back fwd forkBack forkFwd up down)
//   mount(el, { onPick, onHover })           (once: the glass well to draw in)
//   show(model, { edited, recenter })        (draw, and follow the node you're on)
window.MiniVerse = (function () {
    'use strict';

    const CX = 15;   // column (one saved turn) spacing
    const RY = 17;   // row (one line) spacing
    const R = 3.2;   // dot radius
    const PAD = 14;  // the map's inset from the well's sides
    const TOP = 17;  // room for the turn ruler
    const FOOT = 17; // room for the caption along the bottom

    // ---------- Model ----------

    function build(items, hereId, trail) {
        const byId = {};
        items.forEach(it => { byId[it.id] = it; });
        const par = {};
        items.forEach(it => { par[it.id] = it.parentId && it.parentId !== it.id && byId[it.parentId] ? it.parentId : null; });

        // Real children carry a line on; auto-saves ("Left here") hang off a node
        // on their own. Oldest first.
        const kids = {}, ghosts = {}, roots = [];
        const ord = (a, b) => ((a.auto ? 1 : 0) - (b.auto ? 1 : 0)) || (a.ts - b.ts);
        items.slice().sort(ord).forEach(it => {
            const p = par[it.id];
            const into = it.auto ? ghosts : kids;
            if (!p) roots.push(it);
            else (into[p] || (into[p] = [])).push(it);
        });

        // Depth across. A parent cycle is never reached from a root, so it is
        // simply left out.
        const col = {};
        const walk = (n, d) => {
            if (col[n.id] !== undefined) return;
            col[n.id] = d;
            (kids[n.id] || []).forEach(k => walk(k, d + 1));
            (ghosts[n.id] || []).forEach(k => walk(k, d + 1));
        };
        roots.forEach(r => walk(r, 0));

        // How far each node's longest line runs on. The row carries on into the
        // child with the longest line (the oldest on a tie): usually the game as
        // played, with the tries hanging off it. It doesn't depend on where you
        // are, so the map holds still while you jump around.
        const reach = {};
        const reachOf = (n) => {
            if (reach[n.id] !== undefined) return reach[n.id];
            reach[n.id] = 0;
            let best = 0;
            (kids[n.id] || []).forEach(k => { best = Math.max(best, 1 + reachOf(k)); });
            return (reach[n.id] = best);
        };
        const next = {};
        Object.keys(kids).forEach(id => {
            next[id] = kids[id].reduce((a, k) => (reachOf(k) > reachOf(a) ? k : a), kids[id][0]);
        });

        // Rows down: a chain follows that child to the line's end; every other
        // child starts a chain on the nearest row that's free over its span.
        const chainOf = (n) => {
            const c = [n];
            if (n.auto) return c;
            for (let x = n; next[x.id] && c.length < 100000;) { x = next[x.id]; c.push(x); }
            return c;
        };
        const occ = {}, row = {};
        const span = (ch) => [col[ch[0].id] - (par[ch[0].id] ? 1 : 0), col[ch[ch.length - 1].id]];
        const free = (l, a, b) => { const s = occ[l]; if (!s) return true; for (let c = a; c <= b; c++) if (s.has(c)) return false; return true; };
        const nearest = (l, a, b) => {
            for (let d = 0; d < 400; d++) {
                if (free(l + d, a, b)) return l + d;
                if (d && free(l - d, a, b)) return l - d;
            }
            return l + 400;
        };
        const place = (start, l0) => {
            const ch = chainOf(start);
            const [a, b] = span(ch);
            const l = nearest(l0, a, b);
            const s = occ[l] || (occ[l] = new Set());
            for (let c = a; c <= b; c++) s.add(c);
            ch.forEach(n => { row[n.id] = l; });
            ch.forEach((n, i) => {
                (kids[n.id] || []).forEach(k => { if (k !== ch[i + 1]) place(k, l); });
                (ghosts[n.id] || []).forEach(k => place(k, l));
            });
        };
        roots.forEach(r => { if (col[r.id] !== undefined) place(r, 0); });

        const shown = items.filter(it => col[it.id] !== undefined && row[it.id] !== undefined);
        const here = hereId && row[hereId] !== undefined ? hereId : null;

        // The line you're on: root to here, then ahead of you the trail you
        // stepped back along (as far as it still holds), then the first child on.
        const path = [];
        for (let cur = here, guard = 0; cur && guard < 100000; cur = par[cur], guard++) path.unshift(cur);
        const ahead = [];
        if (here && !byId[here].auto) {
            let cur = here;
            for (const t of (trail || [])) {
                if (!byId[t] || byId[t].auto || par[t] !== cur || row[t] === undefined) break;
                ahead.push(t);
                cur = t;
            }
            while (next[cur] && ahead.length < 100000) { cur = next[cur].id; ahead.push(cur); }
        }

        // The ruler: each column's turn, read off the line you're on where it
        // reaches, else off the first node drawn there.
        const turnAt = {};
        path.concat(ahead).forEach(id => { if (byId[id].turn != null) turnAt[col[id]] = byId[id].turn; });
        shown.forEach(it => { if (turnAt[col[it.id]] === undefined && it.turn != null) turnAt[col[it.id]] = it.turn; });

        const real = shown.filter(it => !it.auto);
        return {
            items: shown, byId, par, kids, col, row, here, path, ahead, turnAt,
            onPath: new Set(path), onAhead: new Set(ahead),
            nodeCount: real.length,
            lineCount: real.filter(it => !kids[it.id]).length
        };
    }

    // ---------- Moves ----------

    const isFork = (M, id) => (M.kids[id] || []).length > 1;

    // Where a step button goes from the node you're on. On a board you've
    // changed since loading it, you're past that node: back reloads it and
    // forward goes on to its next turn.
    function move(M, kind, edited) {
        if (!M || !M.here) return null;
        const here = M.here;
        const up = M.par[here];
        if (kind === 'back') return edited ? here : (up || null);
        if (kind === 'fwd') return M.ahead[0] || null;
        if (kind === 'forkBack') {
            let cur = edited ? here : up;
            for (let guard = 0; cur && guard < 100000; guard++) {
                if (isFork(M, cur) || !M.par[cur]) return cur;
                cur = M.par[cur];
            }
            return null;
        }
        if (kind === 'forkFwd') {
            for (const id of M.ahead) if (isFork(M, id)) return id;
            return M.ahead[M.ahead.length - 1] || null;
        }
        if (kind === 'up' || kind === 'down') {
            // The nearest node on a line above (below): rows weigh more than columns,
            // so it lands near the same point in the game.
            const r0 = M.row[here], c0 = M.col[here];
            let best = null, bestScore = Infinity;
            M.items.forEach(it => {
                if (it.auto || it.id === here) return;
                const dr = M.row[it.id] - r0;
                if (kind === 'up' ? dr >= 0 : dr <= 0) return;
                const score = Math.abs(M.col[it.id] - c0) + 3 * Math.abs(dr);
                if (score < bestScore) { bestScore = score; best = it.id; }
            });
            return best;
        }
        return null;
    }

    // ---------- Drawing ----------

    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const X = (M, id) => M.col[id] * CX;
    const Y = (M, id) => M.row[id] * RY;

    function mapSvg(M, edited) {
        let edges = '', live = '', dots = '';
        M.items.forEach(it => {
            const p = M.par[it.id];
            if (!p) return;
            const px = X(M, p), py = Y(M, p), x = X(M, it.id), y = Y(M, it.id);
            const d = py === y ? `M ${px} ${py} L ${x} ${y}`
                : `M ${px} ${py} C ${px + CX * 0.7} ${py}, ${x - CX * 0.7} ${y}, ${x} ${y}`;
            const cls = it.auto ? ' is-ghost' : M.onPath.has(it.id) ? ' is-live' : M.onAhead.has(it.id) ? ' is-ahead' : '';
            const e = `<path class="mmv-edge${cls}" d="${d}"/>`;
            if (cls === ' is-live' || cls === ' is-ahead') live += e;
            else edges += e;
        });
        // A won branch ends in a stop, as in the full tree.
        M.items.forEach(it => {
            if (!it.win || M.kids[it.id]) return;
            const x = X(M, it.id) + R + 4, y = Y(M, it.id);
            edges += `<line class="mmv-stop" x1="${x}" y1="${y - 5}" x2="${x}" y2="${y + 5}"/>`;
        });
        M.items.forEach(it => {
            const x = X(M, it.id), y = Y(M, it.id);
            const cls = it.auto ? ' is-ghost' : M.onPath.has(it.id) ? ' is-live' : M.onAhead.has(it.id) ? ' is-ahead' : '';
            const mark = it.win
                ? `<rect class="mmv-mark" x="${-R - 0.6}" y="${-R - 0.6}" width="${2 * R + 1.2}" height="${2 * R + 1.2}" rx="1"/>`
                : `<circle class="mmv-mark" r="${it.auto ? R - 0.4 : R}"/>`;
            dots += `<g class="mmv-dot${cls}" data-id="${esc(it.id)}" transform="translate(${x} ${y})"><circle class="mmv-hit" r="7.5"/>${mark}</g>`;
        });
        const ring = M.here
            ? `<circle class="mmv-ring${edited ? ' is-edited' : ''}" cx="${X(M, M.here)}" cy="${Y(M, M.here)}" r="${R + 4}"/>` : '';
        return edges + live + dots + ring;
    }

    // Every other turn, over the column it starts in.
    function rulerSvg(M) {
        let out = '', last = null;
        Object.keys(M.turnAt).map(Number).sort((a, b) => a - b).forEach(c => {
            const t = M.turnAt[c];
            if (t === last) return;
            last = t;
            if (t % 2 === 1) out += `<text class="mmv-turn" x="${c * CX}" y="11" text-anchor="middle">${String(t).padStart(2, '0')}</text>`;
        });
        return out;
    }

    // ---------- The mounted view ----------

    let view = null, mapG = null, rulerG = null, hooks = {};
    let model = null, cam = { x: 0, y: 0 }, camFor = undefined, lastW = 0, hover = null;

    function setHover(id) {
        if (id === hover) return;
        hover = id;
        if (hooks.onHover) hooks.onHover(id);
    }

    function bounds() {
        const ids = model ? model.items.map(it => it.id) : [];
        if (!ids.length) return { x0: 0, x1: 0, y0: 0, y1: 0 };
        const xs = ids.map(id => X(model, id)), ys = ids.map(id => Y(model, id));
        return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    }

    // Keep the map in the well: short maps sit at the left, short stacks of
    // lines sit in the middle; longer ones pan no further than their ends.
    function clamp() {
        const b = bounds(), w = view.clientWidth, h = view.clientHeight;
        if (b.x1 - b.x0 <= w - PAD * 2) cam.x = PAD - b.x0;
        else cam.x = Math.min(PAD - b.x0, Math.max(w - PAD - b.x1, cam.x));
        const band = h - TOP - FOOT;
        if (b.y1 - b.y0 <= band - R * 4) cam.y = TOP + (band - (b.y1 - b.y0)) / 2 - b.y0;
        else cam.y = Math.min(TOP + R * 2 - b.y0, Math.max(h - FOOT - R * 2 - b.y1, cam.y));
    }

    function apply(glide) {
        if (!view) return;
        view.classList.toggle('is-gliding', !!glide);
        mapG.style.transform = `translate(${cam.x}px, ${cam.y}px)`;
        rulerG.style.transform = `translate(${cam.x}px, 0px)`;
    }

    // The node you're on a little right of centre, so the turns behind it and
    // the line ahead both show. With nowhere to be, the newest end of the map.
    function follow() {
        const w = view.clientWidth, h = view.clientHeight;
        if (model.here) {
            cam.x = w * 0.58 - X(model, model.here);
            cam.y = TOP + (h - TOP - FOOT) / 2 - Y(model, model.here);
        } else {
            const b = bounds();
            cam.x = w - PAD - b.x1;
            cam.y = TOP + (h - TOP - FOOT) / 2 - (b.y0 + b.y1) / 2;
        }
        clamp();
    }

    function show(M, opts) {
        opts = opts || {};
        model = M;
        if (!view) return;
        mapG.innerHTML = mapSvg(M, !!opts.edited);
        rulerG.innerHTML = rulerSvg(M);
        // Jumped (or first draw, or the well changed size): bring the node into
        // view. Otherwise leave the map where you panned it.
        const resized = view.clientWidth !== lastW;
        lastW = view.clientWidth;
        if (opts.recenter || camFor !== M.here || resized) {
            const first = camFor === undefined;
            setHover(null);
            camFor = M.here;
            follow();
            apply(!first && !resized);
        } else {
            clamp();
            apply(false);
        }
    }

    function mount(el, h) {
        view = el;
        hooks = h || {};
        view.insertAdjacentHTML('afterbegin',
            '<svg class="mmv-svg" aria-hidden="true"><g class="mmv-map"></g><g class="mmv-ruler"></g></svg>');
        mapG = view.querySelector('.mmv-map');
        rulerG = view.querySelector('.mmv-ruler');

        // Drag pans; a press that doesn't travel is a click on what it landed on.
        let drag = null;
        view.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            const dot = e.target.closest('.mmv-dot');
            drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, id: dot ? dot.dataset.id : null, moved: false, pid: e.pointerId };
        });
        view.addEventListener('pointermove', (e) => {
            if (!drag || e.pointerId !== drag.pid) return;
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 4) return;
            if (!drag.moved) {
                drag.moved = true;
                view.setPointerCapture(e.pointerId);
                view.classList.add('is-dragging');
            }
            cam.x = drag.cx + dx;
            cam.y = drag.cy + dy;
            clamp();
            apply(false);
        });
        const end = (e) => {
            if (!drag || e.pointerId !== drag.pid) return;
            const d = drag;
            drag = null;
            view.classList.remove('is-dragging');
            if (e.type === 'pointerup' && !d.moved && d.id && hooks.onPick) hooks.onPick(d.id);
        };
        view.addEventListener('pointerup', end);
        view.addEventListener('pointercancel', end);

        // A mouse wheel pans across; a trackpad pans both ways.
        view.addEventListener('wheel', (e) => {
            if (!model || !model.items.length) return;
            e.preventDefault();
            const unit = e.deltaMode === 1 ? 16 : 1;
            if (e.deltaX) { cam.x -= e.deltaX * unit; cam.y -= e.deltaY * unit; }
            else cam.x -= e.deltaY * unit;
            clamp();
            apply(false);
        }, { passive: false });

        // Hover names the dot under the pointer. Read off pointer moves only, so
        // the map gliding under a still pointer after a jump names nothing.
        view.addEventListener('pointermove', (e) => {
            if (drag && drag.moved) return;
            const dot = e.target.closest('.mmv-dot');
            setHover(dot ? dot.dataset.id : null);
        });
        view.addEventListener('pointerleave', () => setHover(null));
    }

    return { build, move, mount, show };
})();
