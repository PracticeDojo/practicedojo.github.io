// Landing page multiverse: the Set 13 demo session, drawn with the app's own tree.
// Renderer first (MV), then the sections that use it: the hero map + lore race,
// the mock log and imported-turns list, the explorable tree, and the step-3 slice.
//
// Multiverse tree renderer. Same layout as App.renderTree() in app/index.html
// (leaves stack, parents centre between children, 230px nodes in 310px columns),
// same Field Unit node card (deck icon, subline, the note as glass, the Played
// strip or every label · value section),
// same edges (#6A655E hairlines, the path to the node you're on in signal).
// Data: window.MV_DATA (the Set 13 demo). Colours come from css/landing.css
// classes, so switching day / night restyles everything without a re-render.
window.MV = (function () {
  const D = window.MV_DATA;
  const byId = {};
  D.nodes.forEach(n => { byId[n.id] = n; });
  const kids = {}, roots = [];
  D.nodes.forEach(n => {
    if (n.parent && byId[n.parent]) (kids[n.parent] = kids[n.parent] || []).push(n);
    else roots.push(n);
  });
  Object.values(kids).forEach(a => a.sort((x, y) => x.ts - y.ts));
  roots.sort((x, y) => x.ts - y.ts);
  const active = D.nodes.find(n => n.active);
  const mainLine = [];
  for (let n = active; n; n = byId[n.parent]) mainLine.unshift(n);
  const onMain = new Set(mainLine.map(n => n.id));
  const leaves = D.nodes.filter(n => !kids[n.id]);

  // App.TREE_SECTIONS: the label is the verb only ("Played", not "Cards Played").
  const SECTIONS = [
    { key: 'played', label: 'Played' },
    { key: 'inked', label: 'Inked' },
    { key: 'drawn', label: 'Drawn' },
    { key: 'discarded', label: 'Discarded' },
    { key: 'banished', label: 'Banished' },
    { key: 'quested', label: 'Quested' },
    { key: 'startingHand', label: 'Starting hand', marksLeft: true, wrap: true }
  ];
  const NODE_H = { compact: 250, full: 510 };
  const NODE_W = 230, COL = 310;
  const INK = { Amber: 'var(--ink-amber)', Amethyst: 'var(--ink-amethyst)', Ruby: 'var(--ink-ruby)', Emerald: 'var(--ink-emerald)', Sapphire: 'var(--ink-sapphire)', Steel: 'var(--ink-steel)' };

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  function md(src) {
    let html = '', list = false;
    esc(src).split('\n').forEach(line => {
      if (/^- /.test(line)) {
        if (!list) { html += '<ul>'; list = true; }
        html += '<li>' + inline(line.slice(2)) + '</li>';
      } else {
        if (list) { html += '</ul>'; list = false; }
        if (line.trim()) html += '<p>' + inline(line) + '</p>';
      }
    });
    if (list) html += '</ul>';
    return html;
  }
  // The node subline: "Turn 16 · P1: 10 - P2: 11 · 14:29", as the app writes it.
  const time = (n) => new Date(n.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const subline = (n) => `${n.stats.replace(/ \| /g, ' · ')} · ${time(n)}`;
  const entriesOf = (n, key) => (n.sections[key] || []).map(e => (e && typeof e === 'object') ? e : { id: e });
  // App.shownComment(): the auto-save's stock first line is never shown.
  const shown = (c) => String(c || '').replace(/^\s*Auto-saved at start of turn\.\s*/, '').trim();
  // The owner's deck icon (P2's hatched), as the app draws it.
  const deckIcon = (p, extra) => `<span class="deck-icon${p ? ' is-p' + p : ''}${extra ? ' ' + extra : ''}" aria-hidden="true"></span>`;

  function card(id) { return D.cards[id] || { name: 'Unknown card' }; }
  // Same as App.cardThumbHtml(): a text face (name + ink strip) underneath, the
  // card's database thumbnail on top, hidden if it fails to load.
  function thumb(id, extra) {
    const c = card(id), name = esc(c.name);
    return `<div class="mv-thumb${extra ? ' ' + extra : ''}" title="${name}">` +
      `<div class="mv-cf" style="--cf-ink:${INK[c.ink] || 'transparent'}"><span>${name}</span></div>` +
      (c.thumb ? `<img src="${esc(c.thumb)}" alt="${name}" loading="lazy" decoding="async" draggable="false" onerror="this.style.visibility='hidden'">` : '') +
      `</div>`;
  }

  // App.buildNodeSectionsHtml(): full = every section as a label · value row,
  // compact = the Played strip only (and nothing when nothing was played).
  function sectionsHtml(n, view) {
    const full = view === 'full';
    let inner = '';
    for (const sec of (full ? SECTIONS : SECTIONS.slice(0, 1))) {
      const entries = entriesOf(n, sec.key);
      if (!full && !entries.length) continue;
      const left = entries.filter(e => e.left).length;
      const count = sec.marksLeft && left ? `${entries.length} · −${left}` : (entries.length || '—');
      inner += `<div class="mv-sec${entries.length ? '' : ' is-empty'}${sec.wrap ? ' is-wrap' : ''}">` +
        `<div class="mv-sec-label"><span>${sec.label}</span><span class="mv-sec-n">${count}</span></div>` +
        (entries.length ? `<div class="mv-sec-row">${entries.map(e => thumb(e.id, e.left ? 'is-left' : '')).join('')}</div>` : '') +
        `</div>`;
    }
    return inner ? `<div class="mv-cards ${full ? 'is-full' : 'is-compact'}">${inner}</div>` : '';
  }

  function nodeHtml(n, opts) {
    opts = opts || {};
    const view = opts.view || 'compact';
    const style = opts.pos ? ` style="left:${opts.pos.x}px;top:${opts.pos.y}px"` : '';
    // The whole comment (the note and the turn recap text) as a glass note,
    // only when there's something to show.
    const c = shown(n.comment);
    return `<div class="mv-node paper tn-p${n.player}${n.active ? ' is-active' : ''}" data-id="${esc(n.id)}"${style}>` +
      deckIcon(n.player) +
      `<div class="mv-nb">` +
      `<div class="mv-title"><i class="fa-solid fa-bookmark" aria-hidden="true"></i> <span>${esc(n.name)}</span></div>` +
      `<div class="mv-stats">${esc(subline(n))}</div>` +
      (c ? `<div class="mv-note"><div class="mv-note-head"><span>Note</span><i class="fa-solid fa-pen" aria-hidden="true"></i></div>` +
        `<div class="mv-comment">${md(c)}</div></div>` : '') +
      `<span class="mv-ibtn d" aria-hidden="true"><i class="fa-solid fa-trash"></i></span>` +
      `</div>${sectionsHtml(n, view)}</div>`;
  }

  // App.renderTree() layout: leaves stack, parents centre between their children.
  // `list` limits it to a subset (e.g. one branch point and its neighbours).
  function layout(view, list) {
    list = list || D.nodes;
    const inSet = new Set(list.map(n => n.id));
    const k = {}, r = [];
    list.forEach(n => { if (n.parent && inSet.has(n.parent)) (k[n.parent] = k[n.parent] || []).push(n); else r.push(n); });
    Object.values(k).forEach(a => a.sort((x, y) => x.ts - y.ts));
    r.sort((x, y) => x.ts - y.ts);
    const H = NODE_H[view || 'compact'], W = NODE_W, YS = H + 40;
    let y = 0, maxX = 0;
    const pos = {};
    const go = (n, d) => {
      const c = k[n.id] || [];
      const x = d * COL;
      maxX = Math.max(maxX, x);
      if (!c.length) { pos[n.id] = { x, y, d }; y += YS; }
      else { const s0 = y; c.forEach(ch => go(ch, d + 1)); pos[n.id] = { x, y: (s0 + y - YS) / 2, d }; }
    };
    r.forEach(n => go(n, 0));
    return { pos, W, H, list, width: maxX + W, height: y - YS + H };
  }

  // Quiet hairlines, then the path to the node you're on in signal, on top.
  function edgesSvg(L) {
    let p = '', live = '';
    L.list.forEach(n => {
      if (!n.parent || !L.pos[n.parent]) return;
      const a = L.pos[n.parent], b = L.pos[n.id];
      const sx = a.x + L.W, sy = a.y + L.H / 2, ex = b.x, ey = b.y + L.H / 2;
      const isLive = onMain.has(n.id);
      const path = `<path class="mv-edge${isLive ? ' is-live' : ''}" d="M ${sx} ${sy} C ${sx + 40} ${sy}, ${ex - 40} ${ey}, ${ex} ${ey}" data-to="${esc(n.id)}"/>`;
      if (isLive) live += path; else p += path;
    });
    return `<svg width="${L.width}" height="${L.height}" aria-hidden="true">${p}${live}</svg>`;
  }

  // Mounts a tree into a viewport element. Returns a small camera API.
  function mount(viewport, opts) {
    opts = opts || {};
    let view = opts.view || 'compact';
    let L, canvas;
    const cam = { x: 0, y: 0, z: opts.zoom || 0.6 };
    function build() {
      L = layout(view, opts.nodes);
      viewport.innerHTML = `<div class="mv-canvas" style="width:${L.width}px;height:${L.height}px;--tn-h:${L.H}px">` +
        edgesSvg(L) + L.list.map(n => nodeHtml(n, { view, pos: L.pos[n.id] })).join('') + `</div>`;
      canvas = viewport.firstElementChild;
      apply();
    }
    function apply() { canvas.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})`; }
    // Put a node's centre at screen point (sx, sy) of the viewport.
    function pin(id, z, sx, sy) {
      if (z) cam.z = z;
      const p = L.pos[id];
      if (!p) return;
      cam.x = sx - (p.x + L.W / 2) * cam.z;
      cam.y = sy - (p.y + L.H / 2) * cam.z;
      apply();
    }
    function center(id, z, dx, dy) {
      pin(id, z, viewport.clientWidth / 2 + (dx || 0), viewport.clientHeight / 2 + (dy || 0));
    }
    // Scale the whole canvas into the viewport, centred.
    function fit(pad) {
      pad = pad == null ? 16 : pad;
      const w = viewport.clientWidth, h = viewport.clientHeight;
      cam.z = Math.min((w - pad * 2) / L.width, (h - pad * 2) / L.height);
      cam.x = (w - L.width * cam.z) / 2;
      cam.y = (h - L.height * cam.z) / 2;
      apply();
    }
    build();
    return {
      get layout() { return L; }, get canvas() { return canvas; }, cam, apply, center, pin, fit,
      setView(v) { view = v; build(); },
      get view() { return view; },
      nodeEl(id) { return canvas.querySelector(`.mv-node[data-id="${id}"]`); }
    };
  }

  return { D, byId, kids, roots, active, mainLine, onMain, leaves, esc, md, shown, deckIcon, thumb, card, subline, entriesOf, nodeHtml, sectionsHtml, layout, edgesSvg, mount, NODE_H, SECTIONS };
})();

(function () {
  const { D, byId, kids, roots, active, mainLine, onMain, leaves, esc, md, shown, deckIcon, thumb, card, subline, entriesOf, SECTIONS } = MV;
  const $ = (id) => document.getElementById(id);
  const fill = (k, v) => document.querySelectorAll(`[data-mv="${k}"]`).forEach(el => { el.textContent = v; });
  const TURN_RE = /^Turn (\d+) - Player (\d) Active$/;
  const short = (n) => { const m = TURN_RE.exec(n.name); return m ? `T${m[1]}·P${m[2]}` : n.name; };
  const isAuto = (n) => !n.comment || /^Auto-saved/.test(n.comment);
  // What the player wrote on a node: a custom name, or the first line of a hand-written comment.
  const note = (n) => !TURN_RE.test(n.name) ? n.name : (!isAuto(n) ? n.comment.split('\n')[0].trim() : '');
  const two = (i) => String(i).padStart(2, '0');

  fill('title', D.title);
  fill('nodes', D.nodes.length + ' nodes');
  fill('lines', leaves.length + ' lines');
  fill('imported', mainLine.length + ' turn nodes');
  fill('game', `A ${mainLine.length}-turn game`);
  fill('turn', active.turn);
  fill('player', 'Player ' + active.player);
  fill('lore1', active.lore[0]);
  fill('lore2', active.lore[1]);


  // ---------- Map geometry: depth across, lanes down ----------
  const depth = {};
  (function walk(list, d) { list.forEach(n => { depth[n.id] = d; walk(kids[n.id] || [], d + 1); }); })(roots, 0);
  // A chain follows the line you're on, else the first child, until it ends.
  function chainOf(n) {
    const c = [n];
    for (let x = n; kids[x.id] && !x.active;) { const ks = kids[x.id]; x = ks.find(k => k.main) || ks[0]; c.push(x); }
    return c;
  }
  const lane = {}, occ = {};
  const free = (l, a, b) => { const s = occ[l]; if (!s) return true; for (let c = a; c <= b; c++) if (s.has(c)) return false; return true; };
  const take = (l, a, b) => { const s = occ[l] || (occ[l] = new Set()); for (let c = a; c <= b; c++) s.add(c); };
  const span = (ch) => [depth[ch[0].id] - (ch[0].parent ? 1 : 0), depth[ch[ch.length - 1].id]];
  function place(start, l) {
    const ch = chainOf(start);
    ch.forEach(n => { lane[n.id] = l; });
    take(l, ...span(ch));
    ch.forEach(n => (kids[n.id] || []).forEach(k => {
      if (ch.includes(k)) return;
      const [a, b] = span(chainOf(k));
      for (const off of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7]) {
        if (free(l + off, a, b)) { place(k, l + off); return; }
      }
    }));
  }
  roots.forEach(r => place(r, 0));
  const lanes = Object.values(lane), minL = Math.min(...lanes), maxL = Math.max(...lanes);
  const maxD = Math.max(...Object.values(depth));
  const G = { cx: 17, ry: 24, padL: 18, padR: 96, padT: 40 };
  const W = G.padL + maxD * G.cx + G.padR;
  const X = (id) => G.padL + depth[id] * G.cx;
  const Y = (id) => G.padT + (lane[id] - minL) * G.ry;
  const MAP_H = G.padT + (maxL - minL) * G.ry + 18;

  // Branch points, numbered in the order they were tried.
  const branchPts = D.nodes.filter(n => (kids[n.id] || []).length > 1).sort((a, b) => a.ts - b.ts);
  const branchNo = {};
  branchPts.forEach((n, i) => { branchNo[n.id] = i + 1; });
  const branchText = (n) => {
    const words = (kids[n.id] || []).map(note).filter(Boolean);
    return words.length ? words.join(' / ') : 'turn replayed';
  };

  // ---------- Hero lines: every leaf, the line played first ----------
  // The hero shows one line at a time in signal and steps through them all,
  // so the lore readouts, the turn stamp and the lore race change with it.
  const pathOf = (leaf) => { const p = []; for (let n = leaf; n; n = byId[n.parent]) p.unshift(n); return p; };
  // Where a line left the one it came from: the last node before its lane changes.
  const forkOf = (path) => {
    for (let i = path.length - 2; i >= 0; i--) if (lane[path[i + 1].id] !== lane[path[i].id]) return path[i];
    return null;
  };
  const LINES = leaves.map(leaf => {
    const path = pathOf(leaf), fork = forkOf(path);
    return { leaf, path, ids: new Set(path.map(n => n.id)), fork, no: fork ? branchNo[fork.id] : 0 };
  }).sort((a, b) => (a.leaf.active ? -1 : b.leaf.active ? 1 : a.no - b.no));

  // Every saved node. Off the line shown: #6A655E hairlines and hollow dots.
  // The line shown: signal. Its last node: a filled signal dot with a ring.
  function mapSvg() {
    let edges = '', dots = '', marks = '';
    D.nodes.forEach(n => {
      if (!n.parent) return;
      const px = X(n.parent), py = Y(n.parent), x = X(n.id), y = Y(n.id);
      const d = py === y ? `M ${px} ${py} L ${x} ${y}` : `M ${px} ${py} C ${px + G.cx * 0.7} ${py}, ${x - G.cx * 0.7} ${y}, ${x} ${y}`;
      edges += `<path class="m-edge" data-id="${n.id}" d="${d}"/>`;
    });
    D.nodes.forEach(n => {
      const x = X(n.id), y = Y(n.id);
      const label = `${n.name}, ${n.stats.replace(/\|/g, '·')}${note(n) && TURN_RE.test(n.name) ? ', note: ' + note(n) : ''}`;
      dots += `<g><title>${esc(label)}</title><circle class="m-dot" data-id="${n.id}" cx="${x}" cy="${y}" r="3"/></g>`;
      if (branchNo[n.id]) {
        marks += `<text class="m-bn" x="${x}" y="${y - 10}" text-anchor="middle" aria-hidden="true">${two(branchNo[n.id])}</text>`;
      }
    });
    const you = `<g class="m-you"><circle class="m-ring" r="9"/><text class="m-here" x="14" y="3.5"></text></g>`;
    return `<svg viewBox="0 0 ${W} ${MAP_H}" role="img" aria-label="Map of all ${D.nodes.length} saved nodes in ${leaves.length} lines"><g class="m-edges">${edges}</g>${dots}${marks}${you}</svg>`;
  }

  // Lore race along the line shown, on the same x scale as the map.
  // P1 solid, P2 dashed (the shape carries identity, as P2's ticks are striped);
  // the lore numerals at the end are signal. Built once; showLine() moves it.
  const LH = 112, LTOP = 12, LBOT = 24;
  const vMax = Math.max(20, ...D.nodes.map(n => Math.max(...n.lore)));
  const yv = (v) => LTOP + (1 - v / vMax) * (LH - LTOP - LBOT);
  function loreSvg() {
    const grid = [0, 10, 20].map(v => `<line class="m-grid${v === 20 ? ' is-win' : ''}" x1="${G.padL}" x2="${W - 20}" y1="${yv(v)}" y2="${yv(v)}"/>`).join('');
    return `<svg viewBox="0 0 ${W} ${LH}" role="img">
      ${grid}<text class="m-tick" x="${G.padL}" y="${yv(20) - 4}">20 WINS</text>
      <path class="m-p1"/><path class="m-p2"/>
      <circle class="m-end" r="3"/><circle class="m-end" r="3"/>
      <text class="m-who">P2 <tspan class="m-num"></tspan></text>
      <text class="m-who">P1 <tspan class="m-num"></tspan></text>
      <g class="m-ticks"></g></svg>`;
  }
  // Turn ticks along a line: T1, then every third turn.
  function ticksOf(line) {
    let out = '', seen = new Set();
    line.path.forEach(n => {
      if (seen.has(n.turn)) return; seen.add(n.turn);
      if (n.turn === 1 || n.turn % 3 === 1) out += `<text class="m-tick" x="${X(n.id)}" y="${LH - 6}" text-anchor="middle">T${n.turn}</text>`;
    });
    return out;
  }

  // ---------- Hero: map + lore race + numbered branch points ----------
  const heroMap = $('hero-map'), heroLore = $('hero-lore'), heroNotes = $('hero-notes');
  heroMap.innerHTML = mapSvg();
  heroLore.innerHTML = loreSvg();
  heroNotes.innerHTML = branchPts.map(n =>
    `<li data-fork="${n.id}"><span class="bn">${two(branchNo[n.id])}</span><span class="bt">T${n.turn}</span><span class="bx" title="${esc(branchText(n))}">${esc(branchText(n))}</span></li>`).join('');
  const pips = $('hero-pips');
  pips.innerHTML = LINES.map((l, i) =>
    `<button type="button" class="pip" data-i="${i}" aria-label="${l.fork ? `Branch ${two(l.no)}, from turn ${l.fork.turn}` : 'The line played'}: ${esc(l.leaf.name)}, ${l.leaf.lore[0]}–${l.leaf.lore[1]}"></button>`).join('');

  const mapEdges = heroMap.querySelector('.m-edges');
  const edgeEls = [...heroMap.querySelectorAll('.m-edge')], dotEls = [...heroMap.querySelectorAll('.m-dot')];
  const you = heroMap.querySelector('.m-you'), youText = you.querySelector('.m-here');
  const [p1Path, p2Path] = heroLore.querySelectorAll('.m-p1, .m-p2');
  const [p1End, p2End] = heroLore.querySelectorAll('.m-end');
  const [p2Who, p1Who] = heroLore.querySelectorAll('.m-who');
  const loreSvgEl = heroLore.querySelector('svg'), loreTicks = heroLore.querySelector('.m-ticks');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');

  // A line as points at every depth; a short line holds its last point, so
  // any two lines tween point for point (the shared stretch stays put).
  const ptsOf = (line, p) => {
    const out = [];
    for (let d = 0; d <= maxD; d++) { const n = line.path[Math.min(d, line.path.length - 1)]; out.push([X(n.id), n.lore[p]]); }
    return out;
  };
  let cur = null, tween = 0;
  function drawLore(a, b) {
    const dOf = (pts) => pts.map(([x, v], k) => `${k ? 'L' : 'M'} ${x.toFixed(1)} ${yv(v).toFixed(1)}`).join(' ');
    p1Path.setAttribute('d', dOf(a)); p2Path.setAttribute('d', dOf(b));
    const [ex, e1] = a[maxD], e2 = b[maxD][1], hi = e2 >= e1;
    p1End.setAttribute('cx', ex); p1End.setAttribute('cy', yv(e1));
    p2End.setAttribute('cx', ex); p2End.setAttribute('cy', yv(e2));
    // The higher end's label sits above its dot, the lower one's below, at least 13px apart.
    const yHi = Math.min(yv(e1), yv(e2)) - 2, yLo = Math.max(Math.max(yv(e1), yv(e2)) + 12, yHi + 13);
    p2Who.setAttribute('x', ex + 10); p2Who.setAttribute('y', hi ? yHi : yLo);
    p1Who.setAttribute('x', ex + 10); p1Who.setAttribute('y', hi ? yLo : yHi);
    p2Who.lastChild.textContent = Math.round(e2); p1Who.lastChild.textContent = Math.round(e1);
    fill('lore1', Math.round(e1)); fill('lore2', Math.round(e2));
  }

  function showLine(i) {
    const line = LINES[i], end = line.leaf;
    edgeEls.forEach(el => {
      const on = line.ids.has(el.dataset.id);
      el.classList.toggle('is-live', on);
      if (on) mapEdges.appendChild(el); // the line shown draws over the hairlines
    });
    dotEls.forEach(el => {
      const id = el.dataset.id, isEnd = id === end.id, on = line.ids.has(id);
      el.setAttribute('class', isEnd ? 'm-dot is-here' : on ? 'm-dot is-live' : 'm-dot');
      el.setAttribute('r', isEnd ? 5 : on ? 2.4 : 3);
    });
    you.style.transform = `translate(${X(end.id)}px, ${Y(end.id)}px)`;
    // On a narrow screen the map scrolls: bring the line's end into view.
    if (heroMap.scrollWidth > heroMap.clientWidth) {
      const sx = heroMap.scrollWidth / W, left = X(end.id) * sx - heroMap.clientWidth * 0.6;
      const to = { left: Math.max(0, left), behavior: cur && !calm.matches ? 'smooth' : 'auto' };
      heroMap.scrollTo(to); heroLore.scrollTo(to); // same x scale, so they scroll together
    }
    youText.textContent = line.fork ? `WHAT IF · ${two(line.no)}` : 'YOU ARE HERE';
    heroNotes.querySelectorAll('li').forEach(li => li.classList.toggle('is-on', !!line.fork && li.dataset.fork === line.fork.id));
    pips.querySelectorAll('.pip').forEach((b, k) => { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', k === i); });
    fill('turn', end.turn);
    fill('player', 'Player ' + end.player);
    fill('line-label', line.fork ? `What if · branch ${two(line.no)}, from turn ${line.fork.turn}` : 'The line played · in signal');
    fill('lore-label', line.fork ? `Lore along branch ${two(line.no)}` : 'Lore along the line played');
    loreTicks.innerHTML = ticksOf(line);
    loreSvgEl.setAttribute('aria-label', `Lore by turn on ${line.fork ? 'branch ' + two(line.no) : 'the line played'}: Player 1 reaches ${end.lore[0]}, Player 2 reaches ${end.lore[1]}, 20 wins`);

    const to = [ptsOf(line, 0), ptsOf(line, 1)];
    const from = cur ? [ptsOf(LINES[cur.i], 0), ptsOf(LINES[cur.i], 1)] : to;
    cur = { i };
    cancelAnimationFrame(tween);
    if (from === to || calm.matches) { drawLore(to[0], to[1]); return; }
    const t0 = performance.now(), MS = 700;
    const mix = (A, B, t) => A.map(([x, v], k) => [x + (B[k][0] - x) * t, v + (B[k][1] - v) * t]);
    (function frame(now) {
      const p = Math.min(1, (now - t0) / MS), e = 1 - Math.pow(1 - p, 3);
      drawLore(mix(from[0], to[0], e), mix(from[1], to[1], e));
      if (p < 1) tween = requestAnimationFrame(frame);
    })(t0);
  }

  // Step through the lines every few seconds while the inset is on screen;
  // hover, focus or a click on a pip holds it. Reduced motion: no stepping.
  (function () {
    const inset = heroMap.closest('.inset'), STEP = 4500;
    let timer = 0, seen = false, held = false;
    inset.style.setProperty('--line-step', STEP + 'ms');
    const run = () => !calm.matches && seen && !held && !document.hidden;
    function arm() {
      clearTimeout(timer);
      inset.classList.toggle('is-cycling', run());
      if (run()) timer = setTimeout(() => { showLine((cur.i + 1) % LINES.length); restartPip(); arm(); }, STEP);
    }
    // Restart the pip's fill so it runs in step with the timer.
    function restartPip() { const b = pips.querySelector('.pip.is-on'); if (b) { b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on'); } }
    pips.addEventListener('click', (e) => {
      const b = e.target.closest('.pip'); if (!b) return;
      showLine(+b.dataset.i); restartPip(); arm();
    });
    inset.addEventListener('mouseenter', () => { held = true; arm(); });
    inset.addEventListener('mouseleave', () => { held = false; restartPip(); arm(); });
    inset.addEventListener('focusin', () => { held = true; arm(); });
    inset.addEventListener('focusout', (e) => { if (!inset.contains(e.relatedTarget)) { held = false; arm(); } });
    document.addEventListener('visibilitychange', arm);
    calm.addEventListener('change', arm);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) restartPip(); arm(); }, { threshold: 0.35 }).observe(inset);
    } else { seen = true; }
    showLine(0);
    arm();
  })();

  // ---------- Step 02: the app's mini multiverse, stepped back three turns ----------
  // App.renderMiniVerse() (app/js/mini-multiverse.js) at its sizes, 1:1: 15px a
  // turn, 17px a line, the node you're on a little right of centre, the lines
  // centred when they fit. On the map's lanes.
  (function () {
    const el = $('bm-mmv');
    if (!el) return;
    const hi = Math.max(0, mainLine.length - 4), here = mainLine[hi];
    const live = new Set(mainLine.slice(0, hi + 1).map(n => n.id));
    const ahead = new Set(mainLine.slice(hi + 1).map(n => n.id));
    const CX = 15, RY = 17, VH = 112, TOP = 24, FOOT = 22;
    const x = (id) => depth[id] * CX, y = (id) => lane[id] * RY;
    const ys = D.nodes.map(n => y(n.id)), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let edges = '', lines = '', dots = '', ruler = '', last = null;
    D.nodes.forEach(n => {
      if (!n.parent || !byId[n.parent]) return;
      const px = x(n.parent), py = y(n.parent), nx = x(n.id), ny = y(n.id);
      const d = py === ny ? `M ${px} ${py} L ${nx} ${ny}` : `M ${px} ${py} C ${px + CX * 0.7} ${py}, ${nx - CX * 0.7} ${ny}, ${nx} ${ny}`;
      const cls = live.has(n.id) ? ' is-live' : ahead.has(n.id) ? ' is-ahead' : '';
      if (cls) lines += `<path class="m-edge${cls}" d="${d}"/>`;
      else edges += `<path class="m-edge" d="${d}"/>`;
    });
    D.nodes.forEach(n => {
      const cls = live.has(n.id) ? ' is-live' : ahead.has(n.id) ? ' is-ahead' : '';
      dots += `<circle class="m-dot${cls}" cx="${x(n.id)}" cy="${y(n.id)}" r="3.2"/>`;
    });
    mainLine.forEach(n => {
      if (n.turn === last) return;
      last = n.turn;
      if (n.turn % 2 === 1) ruler += `<text class="m-tick" x="${x(n.id)}" y="13" text-anchor="middle">${two(n.turn)}</text>`;
    });
    const map = `${edges}${lines}${dots}<circle class="m-ring" cx="${x(here.id)}" cy="${y(here.id)}" r="7.2"/>`;
    function draw() {
      const VW = Math.round(el.clientWidth) || 300, band = VH - TOP - FOOT;
      const ox = VW * 0.58 - x(here.id);
      const oy = y1 - y0 <= band - 12 ? TOP + (band - (y1 - y0)) / 2 - y0
        : Math.min(TOP + 6 - y0, Math.max(VH - FOOT - 6 - y1, TOP + band / 2 - y(here.id)));
      el.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" aria-hidden="true">` +
        `<g transform="translate(${ox} ${oy})">${map}</g><g transform="translate(${ox} 0)">${ruler}</g>` +
        `<text class="m-tick bm-cap" x="10" y="${VH - 8}">${D.nodes.length} NODES · ${leaves.length} LINES</text></svg>`;
    }
    draw();
    let t = 0;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 120); });
    // The board above is a mock with its own lore, so the readout says only where you are.
    fill('bm-here', `T${here.turn} · P${here.player}`);
  })();

  // ---------- Import: the start of the log, as Duels.ink writes it ----------
  (function () {
    const lines = [`<span class="t">Game started!</span>`];
    mainLine.slice(0, 6).forEach((n, i) => {
      const who = 'Player ' + n.player;
      lines.push('', `<span class="t">--- Turn ${i + 1} ---</span>`, `${who}'s turn begins`, `<span class="t">Ready step: cards readied</span>`);
      entriesOf(n, 'inked').forEach(e => lines.push(`${who} added ${esc(card(e.id).name)} to ink`));
      entriesOf(n, 'played').forEach(e => {
        const c = card(e.id);
        lines.push(`${who} played ${esc(c.name)}${c.cost != null ? ` (cost ${c.cost})` : ''}`);
      });
      lines.push(`${who} ended ${who}'s turn`);
    });
    $('mock-log').innerHTML = lines.join('\n');
  })();

  // ---------- Import: one row per imported turn ----------
  const recapLine = (n) => md(n.comment.replace(/^Auto-saved at start of turn\.\s*(\*\*Turn recap\*\*)?\s*/, ''))
    .replace(/<\/?(ul|p)>/g, '').replace(/<li>/g, '').replace(/<\/li>/g, ' · ').replace(/ · $/, '');
  $('ledger').innerHTML = mainLine.map(n => {
    const m = TURN_RE.exec(n.name);
    const own = !isAuto(n) ? `<span class="note">${esc(note(n))}</span><br>` : '';
    const played = entriesOf(n, 'played').slice(0, 3).map(e => thumb(e.id)).join('');
    return `<div class="lg-row">${deckIcon(n.player)}
      <div class="lg-turn">Turn ${n.turn}<span class="label">Player ${m ? m[2] : n.player}</span></div>
      <div class="lg-what">${own}<span class="rc">${isAuto(n) ? recapLine(n) : ''}</span></div>
      <div class="lg-right">${played}<span class="lg-lore">${n.lore[0]}–${n.lore[1]}</span></div></div>`;
  }).join('');

  // ---------- Multiverse: the whole session, explorable ----------
  (function () {
    const el = $('multi-mv'), side = $('mv-side');
    let view = 'compact';
    const t = MV.mount(el, { view });
    let sel = active.id;
    // About 3 columns on a desktop, 1.6 on a phone so the cards stay readable.
    const zDefault = () => Math.min(0.62, el.clientWidth / ((el.clientWidth < 640 ? 1.6 : 3.3) * 310));
    const clampZ = (z) => Math.max(0.18, Math.min(1.4, z));

    function glideTo(id) { el.classList.add('is-glide'); t.center(id, t.cam.z); }
    function mark() {
      el.querySelectorAll('.mv-node.is-sel').forEach(x => x.classList.remove('is-sel'));
      const ne = t.nodeEl(sel); if (ne) ne.classList.add('is-sel');
      // Corner marks around the selected node, as in the app.
      const L = t.layout, p = L.pos[sel];
      let c = t.canvas.querySelector('.mv-cursor');
      if (!p) { if (c) c.remove(); return; }
      if (!c) {
        c = document.createElement('div');
        c.className = 'mv-cursor';
        c.innerHTML = '<i></i><i></i><i></i><i></i>';
        t.canvas.appendChild(c);
      }
      c.style.cssText = `left:${p.x - 9}px;top:${p.y - 9}px;width:${L.W + 18}px;height:${L.H + 18}px`;
    }
    function select(id, pan) {
      sel = id; mark(); renderSide();
      if (pan) glideTo(id);
    }
    function zoomAt(sx, sy, f) {
      const z0 = t.cam.z, z = clampZ(z0 * f);
      t.cam.x = sx - (sx - t.cam.x) * z / z0;
      t.cam.y = sy - (sy - t.cam.y) * z / z0;
      t.cam.z = z; t.apply();
    }

    // Side panel: the app's Multiverse panel (renderTreePanel) for the selected
    // node, plus the line so far and its branches to walk the tree by.
    const meter = (p, v) => `<div class="meter-row"><span class="who">${deckIcon(p)}P${p}</span>
      <div class="track"><span class="mk" style="left:${Math.min(100, v / 20 * 100)}%"></span></div><span class="v">${v}</span></div>`;
    function renderSide() {
      const n = byId[sel];
      const path = []; for (let p = n; p; p = byId[p.parent]) path.unshift(p);
      const crumbs = path.slice(-5);
      const ch = kids[n.id] || [];
      const c = shown(n.comment);
      const secs = SECTIONS.map(s => {
        const ids = entriesOf(n, s.key);
        if (!ids.length) return '';
        const left = ids.filter(e => e.left).length;
        return `<div class="side-sec"><div class="mv-sec-label">${s.label}<span class="mv-sec-n">${s.marksLeft && left ? `${ids.length} · −${left}` : ids.length}</span></div>
          <div class="side-thumbs">${ids.map(e => thumb(e.id, e.left ? 'is-left' : '')).join('')}</div></div>`;
      }).join('');
      side.innerHTML = `
        <div>
          <div class="label">Selected${n.active ? '<span class="side-here">· you are here</span>' : ''}</div>
          <div class="side-title">${deckIcon(n.player)}<span class="side-name">${esc(n.name)}</span></div>
          <div class="side-stats">${esc(subline(n))}</div>
        </div>
        <div class="side-open">
          <a href="app/" class="tool strong"><i class="fa-solid fa-play" aria-hidden="true"></i> Play it in the Dojo</a>
          <p>This match is under “Pick up again”, as “Set 13 example: PY vs GY”.</p>
        </div>
        <div class="side-note${c ? '' : ' is-empty'}"><div class="side-note-head">Turn ${n.turn} note · Player ${n.player}</div>
          <div class="side-note-body">${c ? md(c) : 'No note on this node.'}</div></div>
        <div class="side-block"><div class="label">Lore race to 20</div>${meter(1, n.lore[0])}${meter(2, n.lore[1])}</div>
        <div class="side-block"><div class="label">Line so far · ${path.length} nodes</div>
          <div class="crumbs">${path.length > crumbs.length ? '<span class="more">…</span>' : ''}
          ${crumbs.map(p => `<button type="button" data-go="${esc(p.id)}" class="${p.id === n.id ? 'is-cur' : ''}">${esc(short(p))}</button>`).join('')}</div></div>
        ${ch.length > 1 ? `<div class="side-block"><div class="label">Branches from here · ${ch.length}</div>
          <div class="crumbs">${ch.map(c => `<button type="button" data-go="${esc(c.id)}">${esc(short(c))}</button>`).join('')}</div></div>` : ''}
        <div class="side-block">
          <div class="side-recap-head"><span class="label">Turn recap</span>
            <button type="button" class="side-switch-row" data-act="toggle-view" role="switch" aria-checked="${view === 'full'}"
              title="Show the full recap inside every node">Show in nodes<span class="side-switch${view === 'full' ? ' is-on' : ''}"></span></button></div>
          ${secs ? `<div class="side-secs">${secs}</div>` : '<p class="side-empty">No cards recorded for this turn.</p>'}
        </div>`;
    }
    side.addEventListener('click', (e) => {
      const b = e.target.closest('[data-go]');
      if (b) select(b.dataset.go, true);
      else if (e.target.closest('[data-act="toggle-view"]')) setView(view === 'compact' ? 'full' : 'compact');
    });

    // Drag to pan. Touch pans sideways only, so the page still scrolls.
    let drag = null;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      el.classList.remove('is-glide');
      drag = { x: e.clientX, y: e.clientY, cx: t.cam.x, cy: t.cam.y, moved: false, touch: e.pointerType === 'touch', id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; el.classList.add('is-dragging'); }
      if (drag.moved) { t.cam.x = drag.cx + dx; if (!drag.touch) t.cam.y = drag.cy + dy; t.apply(); }
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved && e.type === 'pointerup') {
        const node = e.target.closest && e.target.closest('.mv-node');
        if (node && el.contains(node)) { select(node.dataset.id, false); el.focus({ preventScroll: true }); }
      }
      el.classList.remove('is-dragging'); drag = null;
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault(); el.classList.remove('is-glide');
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
    }, { passive: false });

    // Arrow keys walk the tree, like the app's tree navigation.
    el.addEventListener('keydown', (e) => {
      const pos = t.layout.pos, p = pos[sel];
      let next = null;
      if (e.key === 'ArrowLeft') next = byId[sel].parent;
      else if (e.key === 'ArrowRight') { const c = kids[sel] || []; next = c.length ? (c.find(x => x.main) || c[0]).id : null; }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const up = e.key === 'ArrowUp';
        const same = D.nodes.filter(m => m.id !== sel && pos[m.id].d === p.d && (up ? pos[m.id].y < p.y : pos[m.id].y > p.y))
          .sort((a, b) => Math.abs(pos[a.id].y - p.y) - Math.abs(pos[b.id].y - p.y));
        next = same.length ? same[0].id : null;
      } else return;
      e.preventDefault();
      if (next) select(next, true);
    });

    // Header tools
    const mid = () => [el.clientWidth / 2, el.clientHeight / 2];
    $('ex-in').addEventListener('click', () => { el.classList.add('is-glide'); zoomAt(...mid(), 1.25); });
    $('ex-out').addEventListener('click', () => { el.classList.add('is-glide'); zoomAt(...mid(), 0.8); });
    $('ex-home').addEventListener('click', () => { select(active.id, false); el.classList.add('is-glide'); t.center(active.id, zDefault(), -el.clientWidth * 0.08); });
    // Compact (lean) or full nodes: the header tool and the panel's
    // "Show in nodes" switch, as in the app.
    function setView(v) {
      view = v;
      const z = t.cam.z;
      t.setView(view); mark();
      el.classList.remove('is-glide'); t.center(sel, z);
      const b = $('ex-view'), label = view === 'full' ? 'Switch to compact nodes' : 'Switch to full nodes';
      b.innerHTML = `<i class="fa-solid ${view === 'full' ? 'fa-grip-lines' : 'fa-list-ul'}"></i>`;
      b.title = label; b.setAttribute('aria-label', label);
      renderSide();
    }
    $('ex-view').addEventListener('click', () => setView(view === 'compact' ? 'full' : 'compact'));

    t.center(active.id, zDefault(), -el.clientWidth * 0.08);
    select(active.id, false);
  })();

  // ---------- Step 03: one branch point on the line you're on ----------
  (function () {
    const el = $('mini-mv');
    if (!el) return;
    // The last branch point before the node you're on, its parent and its children.
    const bp = [...mainLine].reverse().find(n => (kids[n.id] || []).length > 1);
    if (!bp) return;
    const nodes = [byId[bp.parent], bp, ...kids[bp.id]].filter(Boolean);
    const t = MV.mount(el, { view: 'compact', nodes });
    const refit = () => t.fit(14);
    refit();
    if (window.ResizeObserver) new ResizeObserver(refit).observe(el);
  })();
})();
