// Ink redesign prototypes (RED_20261004_1): one small board engine shared by
// the three proposals. Board.mount(el, { layout, compare }) draws a live board
// in `layout` ('dock' | 'bar' | 'score') with a toggle back to today's layout
// ('cur'), and measures field space and card size against the other one.
// The sample match is turn 7 of Amethyst/Ruby (you) vs Sapphire/Steel.
(function () {
  'use strict';

  // Real cards (LorcanaJSON): name, version, cost, inkable, ink, type, S/W/L.
  const CAT = {
    tbff: ['Tinker Bell', 'Fancy Footwork', 1, 1, 'ruby', 'Character', 3, 1, 1],
    golt: ['Goliath', 'Transformed Warrior', 4, 1, 'amethyst', 'Character', 5, 5, 1],
    mokl: ['Moana', 'Kakamora Leader', 7, 1, 'ruby', 'Character', 6, 5, 1],
    tbqa: ['Tinker Bell', 'Queen of the Azurite Fairies', 7, 1, 'amethyst', 'Character', 5, 6, 2],
    pefb: ['Pete', 'Freebooter', 3, 1, 'ruby', 'Character', 5, 2, 1],
    mewc: ['Merida', 'Wisp Conjurer', 4, 0, 'amethyst', 'Character', 3, 3, 1],
    tbsc: ['Tinker Bell', 'Snowflake Collector', 3, 1, 'amethyst', 'Character', 3, 3, 1],
    gogc: ['Goliath', 'Guardian of Castle Wyvern', 4, 1, 'ruby', 'Character', 5, 5, 1],
    mots: ['Moana', 'Self-Taught Sailor', 1, 1, 'ruby', 'Character', 3, 2, 1],
    pecv: ['Pete', 'Created by the Vine', 1, 1, 'amethyst', 'Character', 1, 2, 1],
    tbfw: ['Tinker Bell', 'Finding a Way', 2, 1, 'amethyst', 'Character', 2, 2, 2],
    casi: ['Casa Madrigal', 'Casita', 1, 1, 'amethyst', 'Location', 0, 6, 0],
    tbif: ['Tinker Bell', 'Insistent Fairy', 2, 1, 'ruby', 'Character', 1, 1, 1],
    moie: ['Moana', 'Island Explorer', 4, 1, 'ruby', 'Character', 4, 3, 1],
    tbtf: ['Tinker Bell', 'Temperamental Fairy', 5, 1, 'ruby', 'Character', 5, 3, 1],
    gocl: ['Goliath', 'Clan Leader', 6, 1, 'steel', 'Character', 6, 5, 2],
    rhcs: ['Robin Hood', 'Champion of Sherwood', 5, 1, 'steel', 'Character', 3, 6, 2],
    cirt: ['Cinderella', 'Resourceful Traveler', 4, 1, 'sapphire', 'Character', 1, 4, 2],
    caco: ['Casa Madrigal', 'Courtyard', 4, 1, 'sapphire', 'Location', 0, 7, 2],
    arsw: ['Ariel', 'Sonic Warrior', 6, 1, 'steel', 'Character', 3, 8, 2],
    moce: ['Moana', 'Curious Explorer', 5, 1, 'sapphire', 'Character', 4, 4, 2],
    thar: ['Three Arrows', '', 3, 1, 'steel', 'Action', 0, 0, 0],
    sail: ['Sail the Azurite Sea', '', 2, 1, 'sapphire', 'Action', 0, 0, 0],
    rhdw: ['Robin Hood', 'Desert Wanderer', 1, 1, 'sapphire', 'Character', 1, 3, 1],
    tbvc: ['Tinker Bell', 'Very Clever Fairy', 5, 1, 'sapphire', 'Character', 3, 4, 2]
  };
  const DRAW_POOL = ['tbtf', 'moie', 'tbif', 'pefb', 'golt', 'tbff'];
  const card = (k) => { const c = CAT[k]; return { k, n: c[0], v: c[1], cost: c[2], inkable: !!c[3], ink: c[4], type: c[5], s: c[6], w: c[7], l: c[8] }; };

  let uid = 0;
  const inst = (k, extra) => Object.assign({ id: 'c' + (++uid), k }, extra || {});
  const inkCards = (total, ready) => Array.from({ length: total }, (_, i) => inst(null, { faceUp: false, exerted: i >= ready }));

  function sample() {
    uid = 0;
    return {
      turn: 7,
      players: [
        { name: 'You', lore: 11, deck: 38, inkedThisTurn: 0,
          hand: ['tbff', 'golt', 'mokl', 'tbqa', 'pefb', 'mewc'].map(k => inst(k)),
          field: ['tbsc', 'gogc', 'mots', 'pecv', 'tbfw', 'tbif', 'moie', 'casi'].map(k => inst(k, { exerted: k === 'gogc' || k === 'moie' })),
          discard: ['tbtf', 'pefb'].map(k => inst(k)),
          ink: inkCards(6, 6) },
        { name: 'Opponent', lore: 9, deck: 36, inkedThisTurn: 0, handCount: 4,
          field: ['gocl', 'rhcs', 'cirt', 'caco', 'arsw', 'moce', 'rhdw', 'tbvc'].map(k => inst(k, { exerted: k === 'rhcs' || k === 'arsw' })),
          discard: ['sail', 'thar'].map(k => inst(k)),
          ink: inkCards(6, 1) }
      ]
    };
  }

  const SIZES = { desk: [912, 856], phone: [390, 800] };
  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ready = (p) => p.ink.filter(c => !c.exerted).length;
  const fmt = (n) => n.toLocaleString('en-US');

  // ---------------------------------------------------------------- pieces
  function cardFace(c, cls) {
    const d = card(c.k);
    const st = d.type === 'Character' ? `<span class="st"><span>${d.s}¤</span><span>${d.w}⛉</span><span>${d.l}◆</span></span>`
      : d.type === 'Location' ? `<span class="st"><span>${d.w}⛉</span><span>${d.l}◆</span></span>` : `<span class="st"><span>${d.type}</span></span>`;
    return `<div class="card c-${d.ink} ${cls || ''}" title="${esc(d.n + (d.v ? ' – ' + d.v : ''))}"><span class="cost ${d.inkable ? 'ik' : 'nik'}">${d.cost}</span>
      <span class="plate"><span class="nm">${esc(d.n)}</span>${d.v ? `<span class="vr">${esc(d.v)}</span>` : ''}${st}</span></div>`;
  }
  const back = () => '<div class="card back"></div>';
  const slot = (inner, cls, attrs) => `<div class="slot ${cls || ''}" ${attrs || ''}>${inner}</div>`;

  function fieldCards(p) {
    return p.field.map(c => {
      const d = card(c.k), loc = d.type === 'Location';
      return slot(cardFace(c), (loc ? 'wide loc' : c.exerted ? 'wide ex' : ''), `data-fc="${c.id}"`);
    }).join('');
  }
  function field(pi, extra) {
    return `<div class="field" data-drop="field:${pi}" data-zone="field" data-fit="field"><div class="fi">${fieldCards(S.players[pi])}</div>${extra || ''}</div>`;
  }
  function handCards(pi) {
    const p = S.players[pi];
    if (pi === 1) return Array.from({ length: p.handCount }, () => slot(back())).join('');
    return p.hand.map(c => slot(cardFace(c, c.id === S.ui.menu ? 'inked' : ''), '', `data-hand="${c.id}"`)).join('');
  }
  function hand(pi, label) {
    const p = S.players[pi];
    const lbl = label ? `<span class="hand-label">Hand · ${pi === 1 ? p.handCount : p.hand.length}</span>` : '';
    return `${pi === 0 ? '' : lbl}<div class="hand" data-fit="hand" data-pi="${pi}">${handCards(pi)}</div>${pi === 0 ? lbl : ''}`;
  }
  function pips(p) {
    const r = ready(p);
    // Ready ink first, then spent; the card inked this turn is marked.
    const sorted = p.ink.slice().sort((a, b) => (a.exerted - b.exerted));
    return sorted.map((c, i) => `<span class="pip${i < r ? '' : ' used'}${c.faceUp ? ' new' : ''}"></span>`).join('');
  }
  const newTag = (p) => (p.ink.some(c => c.faceUp) ? '<span class="new-tag">+1</span>' : '');
  const inkAttrs = (pi, cls) => `class="${cls || ''}" data-ink="${pi}" data-drop="ink:${pi}" data-zone="ink" role="button" tabindex="0" aria-haspopup="dialog" aria-label="${esc(S.players[pi].name)} inkwell, ${ready(S.players[pi])} of ${S.players[pi].ink.length} ready"`;

  function pile(pi, kind) {
    const p = S.players[pi];
    if (kind === 'deck') return `<button class="pile" data-act="draw:${pi}" title="Deck · ${p.deck} cards${pi === 0 ? ' · click to draw' : ''}"><span class="stk back"></span><span class="cnt">${p.deck}</span></button>`;
    const top = p.discard[p.discard.length - 1];
    return `<button class="pile" data-act="discard:${pi}" title="Discard · ${p.discard.length}"><span class="stk ${top ? 'face' : 'empty'}">${top ? cardFace(top, 'xs') : ''}</span><span class="cnt">${p.discard.length}</span></button>`;
  }
  function lore(pi, rowWrap) {
    const p = S.players[pi];
    const btns = `<button data-act="lore:${pi}:-1" aria-label="Lore down">−</button><button data-act="lore:${pi}:1" aria-label="Lore up">+</button>`;
    return rowWrap
      ? `<div class="lore"><span class="lbl">Lore</span><b>${p.lore}</b><span class="row">${btns}</span></div>`
      : `<div class="lore"><span class="lbl">Lore</span><b>${p.lore}</b>${btns}</div>`;
  }

  // Segmented ring for B: one arc per ink card.
  function ring(p) {
    const n = Math.max(p.ink.length, 1), r = 42, cx = 50, cy = 50, gapDeg = p.ink.length > 1 ? Math.min(10, 120 / n) : 0;
    const sorted = p.ink.slice().sort((a, b) => (a.exerted - b.exerted));
    const pt = (deg) => { const a = (deg - 90) * Math.PI / 180; return [(cx + r * Math.cos(a)).toFixed(2), (cy + r * Math.sin(a)).toFixed(2)]; };
    let arcs = '';
    if (!p.ink.length) arcs = `<circle cx="50" cy="50" r="${r}" fill="none" stroke="oklch(1 0 0 / .12)" stroke-width="7" stroke-dasharray="3 5"></circle>`;
    sorted.forEach((c, i) => {
      const a0 = i * 360 / n + gapDeg / 2, a1 = (i + 1) * 360 / n - gapDeg / 2;
      const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
      const cls = c.exerted ? 'seg-off' : c.faceUp ? 'seg-new' : 'seg-on';
      arcs += `<path class="${cls}" d="M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}" fill="none" stroke-width="9" stroke-linecap="butt"></path>`;
    });
    return `<svg viewBox="0 0 100 100" aria-hidden="true">${arcs}</svg><span class="num"><b>${ready(p)}</b><small>of ${p.ink.length}</small></span>${newTag(p)}`;
  }

  // ---------------------------------------------------------------- layouts
  function layoutHTML(L, ph) {
    const P = S.players;
    if (L === 'cur') {
      const pileRow = (pi) => `<div class="pilerow"><div ${inkAttrs(pi, 'inkc drop')}><div class="readout"><i></i>${ready(P[pi])}/${P[pi].ink.length}${newTag(P[pi])}</div><div class="pips">${pips(P[pi])}</div></div>
        <div class="piles" data-zone="piles">${pile(pi, 'discard')}${pile(pi, 'deck')}</div></div>`;
      const badge = (pi) => `<div class="lorebadge">${lore(pi)}</div>`;
      return `<div class="half top p2"><div class="handrow">${hand(1, false)}</div>${pileRow(1)}${field(1)}${badge(1)}</div>
        <div class="divider"></div>
        <div class="half bottom p1">${field(0)}${pileRow(0)}<div class="handrow">${hand(0, ph)}</div>${badge(0)}</div>`;
    }
    if (L === 'dock') {
      const dock = (pi) => `<div class="dock">${lore(pi, true)}<div ${inkAttrs(pi, 'well drop')}><div class="wl-h"><span class="lbl">Ink</span><b>${ready(P[pi])}<small>/${P[pi].ink.length}</small></b></div><div class="wl-pips">${pips(P[pi])}</div>${newTag(P[pi])}</div>
        <div data-zone="piles" style="display:contents">${pile(pi, 'discard')}${pile(pi, 'deck')}</div></div>`;
      return `<div class="half top p2"><div class="handrow">${hand(1, false)}</div>${field(1)}${dock(1)}</div>
        <div class="divider"></div>
        <div class="half bottom p1">${field(0)}<div class="handrow">${hand(0, ph)}</div>${dock(0)}</div>`;
    }
    if (L === 'bar') {
      const bar = (pi) => `<div class="bar"><div ${inkAttrs(pi, 'ring drop')}>${ring(P[pi])}</div><div class="hand" data-fit="hand" data-pi="${pi}">${handCards(pi)}</div>
        <div class="piles" data-zone="piles">${pile(pi, 'discard')}${pile(pi, 'deck')}</div>${lore(pi, true)}</div>`;
      return `<div class="half top p2">${bar(1)}${field(1)}</div>
        <div class="divider"></div>
        <div class="half bottom p1">${field(0)}${bar(0)}</div>`;
    }
    // score
    const cp = (pi) => `<div class="cpiles" data-zone="piles">${pile(pi, 'deck')}${pile(pi, 'discard')}</div>`;
    const lane = (pi) => { const p = P[pi]; return `<div class="lane ${pi ? 'p2' : 'p1'}"><span class="who">${ph ? (pi ? 'Opp' : 'You') : esc(p.name)}</span>
      <div ${inkAttrs(pi, 'drop')}><span class="pips">${pips(p)}</span><span class="cnt">${ready(p)}<small>/${p.ink.length}</small></span>${newTag(p)}</div>${lore(pi)}</div>`; };
    return `<div class="half top p2"><div class="handrow">${hand(1, false)}${cp(1)}</div>${field(1)}</div>
      <div class="band">${lane(1)}${lane(0)}</div>
      <div class="half bottom p1">${field(0)}<div class="handrow">${hand(0, ph)}${cp(0)}</div></div>`;
  }

  // ---------------------------------------------------------------- fitting
  // Largest card height (step 2px) at which every card fits the field's box.
  function fitCards(W, H, items, max, gap) {
    for (let h = max; h >= 26; h -= 2) {
      let rows = 1, x = 0;
      for (const wide of items) {
        const w = wide ? h : h * 0.714;
        if (x > 0 && x + gap + w > W) { rows++; x = w; } else x += (x > 0 ? gap : 0) + w;
      }
      if (rows * h + (rows - 1) * gap <= H) return h;
    }
    return 26;
  }
  function fitAll(fr, ph) {
    const out = [];
    fr.querySelectorAll('[data-fit="field"]').forEach(f => {
      const fi = f.querySelector('.fi');
      const W = fi.clientWidth, H = fi.clientHeight, gap = ph ? 6 : 10;
      const items = [...fi.children].map(s => s.classList.contains('wide'));
      const h = fitCards(W, H, items, ph ? 96 : 140, gap);
      fi.style.setProperty('--ch', h + 'px'); fi.style.setProperty('--gap', gap + 'px');
      fi.querySelectorAll('.card').forEach(c => { c.classList.toggle('sm', h < 84); c.classList.toggle('xs', h < 50); });
      out.push({ w: W, h: H, ch: h });
    });
    fr.querySelectorAll('[data-fit="hand"]').forEach(hd => {
      const pi = +hd.dataset.pi, box = hd.parentElement;
      // Card height comes from the row the hand sits in.
      const rowH = box.clientHeight || 60;
      const ch = pi === 1 ? Math.min(ph ? 30 : 64, rowH - 10) : Math.min(ph ? 54 : 118, rowH - (ph ? 10 : 22));
      hd.style.setProperty('--ch', ch + 'px');
      const n = hd.children.length, w = ch * 0.714, avail = hd.clientWidth || box.clientWidth;
      const ml = n > 1 ? Math.min(pi === 1 ? -ch * 0.35 : 6, (avail - n * w) / (n - 1)) : 0;
      hd.style.setProperty('--ml', ml + 'px');
      hd.querySelectorAll('.card').forEach(c => { c.classList.toggle('sm', ch < 84); c.classList.toggle('xs', ch < 50); });
    });
    return out;
  }

  // ---------------------------------------------------------------- state + mount
  let S, root, frame, shadow, scaler, stageIn, stage, toastEl, opts;

  function frameClass(L, dev) { return `board L-${L} ${dev === 'phone' ? 'ph' : 'dk'}`; }

  function render() {
    const L = S.view.layout, dev = S.view.device, ph = dev === 'phone', [W, H] = SIZES[dev];
    frame.className = frameClass(L, dev) + (S.view.measure ? ' measure' : '');
    frame.style.width = W + 'px'; frame.style.height = H + 'px';
    frame.innerHTML = layoutHTML(L, ph);
    const mine = fitAll(frame, ph);
    if (S.ui.panel != null) drawPanel();
    if (S.ui.menu) drawMenu();
    if (S.view.measure) drawZoneLabels();
    scale();
    metrics(mine);
    syncToolbar();
  }

  function metrics(mine) {
    const L = S.view.layout, dev = S.view.device, ph = dev === 'phone', [W, H] = SIZES[dev];
    const other = L === 'cur' ? opts.layout : 'cur';
    shadow.className = frameClass(other, dev);
    shadow.style.width = W + 'px'; shadow.style.height = H + 'px';
    shadow.innerHTML = layoutHTML(other, ph);
    const theirs = fitAll(shadow, ph);
    shadow.innerHTML = '';
    const area = (a) => a.reduce((s, f) => s + f.w * f.h, 0);
    const pct = (a, b) => Math.round((a / b - 1) * 100);
    const deltaPill = (d) => `<span class="delta ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${d > 0 ? '+' : ''}${d}%</span>`;
    const otherName = other === 'cur' ? 'today' : 'proposal';
    // mine/theirs: [top (opponent), bottom (you)]
    const box = root.querySelector('[data-metrics]');
    if (!box) return;
    const fa = area(mine), fb = area(theirs);
    box.innerHTML = `
      <div class="metric"><div class="k">Battlefield area</div><div class="v"><b>${fmt(Math.round(fa / 1000))}k px²</b>${deltaPill(pct(fa, fb))}<small>${otherName} ${fmt(Math.round(fb / 1000))}k</small></div></div>
      <div class="metric"><div class="k">Your cards in play</div><div class="v"><b>${mine[1].ch} px</b>${deltaPill(pct(mine[1].ch, theirs[1].ch))}<small>${otherName} ${theirs[1].ch} px</small></div></div>
      <div class="metric"><div class="k">Their cards in play</div><div class="v"><b>${mine[0].ch} px</b>${deltaPill(pct(mine[0].ch, theirs[0].ch))}<small>${otherName} ${theirs[0].ch} px</small></div></div>`;
  }

  function scale() {
    const [W, H] = SIZES[S.view.device];
    const avail = stage.clientWidth - parseFloat(getComputedStyle(stage).paddingLeft) * 2;
    const s = Math.min(1, avail / W);
    S.scale = s;
    scaler.style.transform = `scale(${s})`;
    stageIn.style.width = W * s + 'px';
    stageIn.style.height = H * s + 'px';
  }

  function local(el) {
    const r = el.getBoundingClientRect(), f = frame.getBoundingClientRect(), s = S.scale;
    return { x: (r.left - f.left) / s, y: (r.top - f.top) / s, w: r.width / s, h: r.height / s };
  }

  function drawZoneLabels() {
    frame.querySelectorAll('[data-zone]').forEach(z => {
      let el = z;
      if (getComputedStyle(z).display === 'contents') return;
      const b = local(el);
      if (!b.w || !b.h) return;
      const lab = document.createElement('span');
      lab.className = 'zlabel';
      lab.style.setProperty('--zc', getComputedStyle(z).getPropertyValue('--zc') || '');
      lab.textContent = `${z.dataset.zone} ${Math.round(b.w)}×${Math.round(b.h)}`;
      lab.style.left = (b.x + 4) + 'px'; lab.style.top = (b.y + 4) + 'px';
      frame.appendChild(lab);
    });
  }

  // ---------------------------------------------------------------- ink panel
  function drawPanel() {
    const pi = S.ui.panel, p = S.players[pi], r = ready(p), inkedNow = p.ink.some(c => c.faceUp);
    const rows = p.ink.map(c => {
      const nm = c.faceUp && c.k ? card(c.k).n + ' – ' + card(c.k).v : 'Face-down card';
      return `<div class="ip-row${c.exerted ? ' is-exerted' : ''}"><span class="ip-name"><b>${esc(nm)}</b><span>${c.faceUp ? 'inked this turn · face up' : 'face down'}</span></span>
        <button class="ip-btn${c.exerted ? '' : ' is-ready'}" data-act="tog:${pi}:${c.id}">${c.exerted ? 'Exerted' : 'Ready'}</button>
        <button class="ip-btn" data-act="tohand:${pi}:${c.id}" ${pi === 0 ? '' : 'disabled'}>To hand</button>
        <button class="ip-btn" data-act="todisc:${pi}:${c.id}">Discard</button></div>`;
    }).join('');
    const el = document.createElement('div');
    el.className = 'ipanel';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', p.name + ' inkwell');
    el.innerHTML = `<div class="ip-head"><b>${esc(p.name)} · inkwell</b><span>${r} of ${p.ink.length} ready${inkedNow ? ' · inked' : ''}</span><button class="ip-x" data-act="close" aria-label="Close inkwell">✕</button></div>
      <div class="ip-acts"><button class="ip-btn" data-act="spend:${pi}" ${r > 0 ? '' : 'disabled'}>Spend 1</button><button class="ip-btn" data-act="ready1:${pi}" ${r < p.ink.length ? '' : 'disabled'}>Ready 1</button><button class="ip-btn" data-act="readyall:${pi}" ${r < p.ink.length ? '' : 'disabled'}>Ready all</button></div>
      <div class="ip-list">${rows || '<span class="ip-empty">No ink yet. Drag a card here to ink it.</span>'}</div>`;
    frame.appendChild(el);
    if (S.view.device === 'phone') return;
    const a = frame.querySelector(`[data-ink="${pi}"]`);
    if (!a) return;
    const b = local(a), [W, H] = SIZES[S.view.device], pw = el.offsetWidth, ph = el.offsetHeight;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (S.view.layout === 'dock') {
      el.style.left = (b.x - pw - 10) + 'px';
      el.style.top = clamp(b.y + b.h / 2 - ph / 2, 8, H - ph - 8) + 'px';
    } else {
      el.style.left = clamp(b.x, 8, W - pw - 8) + 'px';
      el.style.top = (pi === 0 ? clamp(b.y - ph - 8, 8, H - ph - 8) : clamp(b.y + b.h + 8, 8, H - ph - 8)) + 'px';
    }
  }

  function drawMenu() {
    const c = S.players[0].hand.find(x => x.id === S.ui.menu);
    const a = c && frame.querySelector(`[data-hand="${c.id}"]`);
    if (!a) { S.ui.menu = null; return; }
    const d = card(c.k), b = local(a), r = ready(S.players[0]);
    const el = document.createElement('div');
    el.className = 'cmenu';
    el.innerHTML = `<button data-act="play:${c.id}" ${d.cost <= r ? '' : 'disabled'}>Play · ${d.cost}</button><button class="ink" data-act="ink:${c.id}" ${d.inkable ? '' : 'disabled'}>${d.inkable ? 'Ink it' : 'Not inkable'}</button>`;
    el.style.left = (b.x + b.w / 2) + 'px';
    el.style.top = (b.y - 6) + 'px';
    frame.appendChild(el);
  }

  // ---------------------------------------------------------------- actions
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function inkFromHand(id) {
    const p = S.players[0], i = p.hand.findIndex(c => c.id === id);
    if (i < 0) return;
    const d = card(p.hand[i].k);
    if (!d.inkable) { toast(`${d.n} – ${d.v} has no inkwell symbol, so it can't be inked`); return; }
    const [c] = p.hand.splice(i, 1);
    p.ink.push(inst(c.k, { faceUp: true, exerted: false }));
    p.inkedThisTurn++;
    toast(p.inkedThisTurn > 1 ? `Inked ${d.n}. That's ${p.inkedThisTurn} ink this turn (normally 1)` : `Inked ${d.n} · ${ready(p)} of ${p.ink.length} ready`);
  }
  function exert(p, n) { for (const c of p.ink) { if (n <= 0) break; if (!c.exerted) { c.exerted = true; n--; } } }
  function playFromHand(id) {
    const p = S.players[0], i = p.hand.findIndex(c => c.id === id);
    if (i < 0) return;
    const d = card(p.hand[i].k), r = ready(p);
    if (d.cost > r) { toast(`${d.n} costs ${d.cost}, you have ${r} ink ready`); return; }
    const [c] = p.hand.splice(i, 1);
    exert(p, d.cost);
    if (d.type === 'Action') p.discard.push(c); else p.field.push(c);
    toast(`Played ${d.n} for ${d.cost} · ${ready(p)} ink left`);
  }
  function nextTurn() {
    S.turn += 2;
    const me = S.players[0], op = S.players[1];
    // Opponent's turn, summarised: they ink, ready, spend most of it.
    op.ink.forEach(c => { c.faceUp = false; c.exerted = false; });
    op.ink.push(inst(null, { faceUp: false, exerted: false }));
    exert(op, op.ink.length - 1 - Math.floor(Math.random() * 2));
    op.lore = Math.min(20, op.lore + 2); op.deck = Math.max(0, op.deck - 1);
    // Your ready step: all ink and characters ready, last turn's ink goes face down.
    me.ink.forEach(c => { c.faceUp = false; c.exerted = false; });
    me.field.forEach(c => { c.exerted = false; });
    me.inkedThisTurn = 0;
    draw(0, true);
    toast(`Turn ${S.turn} · ${me.ink.length} ink ready · drew a card`);
  }
  function draw(pi, quiet) {
    const p = S.players[pi];
    if (p.deck <= 0) return;
    p.deck--;
    if (pi === 1) { p.handCount++; return; }
    if (p.hand.length >= 9) { if (!quiet) toast('Hand is full in this prototype'); p.deck++; return; }
    p.hand.push(inst(DRAW_POOL[Math.floor(Math.random() * DRAW_POOL.length)]));
    if (!quiet) toast(`Drew ${card(p.hand[p.hand.length - 1].k).n}`);
  }

  function act(a) {
    const [k, x, y] = a.split(':');
    const P = S.players;
    switch (k) {
      case 'close': S.ui.panel = null; break;
      case 'spend': exert(P[x], 1); break;
      case 'ready1': { const c = P[x].ink.find(c => c.exerted); if (c) c.exerted = false; break; }
      case 'readyall': P[x].ink.forEach(c => { c.exerted = false; }); break;
      case 'tog': { const c = P[x].ink.find(c => c.id === y); if (c) c.exerted = !c.exerted; break; }
      case 'tohand': { const i = P[x].ink.findIndex(c => c.id === y); if (i >= 0) { const [c] = P[x].ink.splice(i, 1); P[x].hand.push(inst(c.k || 'tbif')); } break; }
      case 'todisc': { const i = P[x].ink.findIndex(c => c.id === y); if (i >= 0) { const [c] = P[x].ink.splice(i, 1); P[x].discard.push(inst(c.k || 'tbif')); } break; }
      case 'lore': P[x].lore = Math.max(0, Math.min(20, P[x].lore + +y)); break;
      case 'draw': draw(+x); break;
      case 'discard': { const p = P[x]; toast(`${p.name} discard · ${p.discard.map(c => card(c.k).n).join(', ') || 'empty'}`); return; }
      case 'play': S.ui.menu = null; playFromHand(x); break;
      case 'ink': S.ui.menu = null; inkFromHand(x); break;
      default: return;
    }
    render();
  }

  // ---------------------------------------------------------------- input
  let drag = null, ghost = null;
  function bind() {
    frame.addEventListener('click', (e) => {
      if (drag && drag.moved) return;
      const b = e.target.closest('[data-act]');
      if (b) { e.stopPropagation(); if (!b.disabled) act(b.dataset.act); return; }
      if (e.target.closest('.ipanel, .cmenu')) return;
      const ink = e.target.closest('[data-ink]');
      if (ink) { const pi = +ink.dataset.ink; S.ui.menu = null; S.ui.panel = S.ui.panel === pi ? null : pi; render(); return; }
      if (e.target.closest('[data-hand]')) return; // handled on pointerup
      if (S.ui.panel != null || S.ui.menu) { S.ui.panel = null; S.ui.menu = null; render(); }
    });
    frame.addEventListener('keydown', (e) => {
      const ink = e.target.closest('[data-ink]');
      if (ink && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const pi = +ink.dataset.ink; S.ui.panel = S.ui.panel === pi ? null : pi; render(); const f = frame.querySelector('.ipanel button:not([disabled])'); if (f) f.focus(); }
      if (e.key === 'Escape' && (S.ui.panel != null || S.ui.menu)) { S.ui.panel = null; S.ui.menu = null; render(); }
    });
    frame.addEventListener('pointerdown', (e) => {
      const h = e.target.closest('[data-hand]');
      if (!h || e.button > 0) return;
      drag = { id: h.dataset.hand, x0: e.clientX, y0: e.clientY, el: h, moved: false };
      h.setPointerCapture(e.pointerId);
    });
    frame.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      if (!drag.moved) {
        drag.moved = true; S.ui.menu = null; S.ui.panel = null;
        frame.querySelectorAll('.cmenu, .ipanel').forEach(n => n.remove());
        const r = drag.el.getBoundingClientRect();
        ghost = drag.el.cloneNode(true);
        ghost.className = 'ghost';
        ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
        ghost.style.setProperty('--ch', r.height + 'px');
        document.body.appendChild(ghost);
        drag.el.style.opacity = '.3';
        frame.classList.add('dragging');
      }
      ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px';
      const t = targetAt(e.clientX, e.clientY);
      frame.querySelectorAll('.over').forEach(n => { if (n !== t) n.classList.remove('over'); });
      if (t) t.classList.add('over');
    });
    const end = (e) => {
      if (!drag) return;
      const d = drag;
      if (d.moved) {
        const t = targetAt(e.clientX, e.clientY);
        if (ghost) ghost.remove();
        ghost = null;
        frame.classList.remove('dragging');
        drag = null;
        if (t && t.dataset.drop === 'ink:0') inkFromHand(d.id);
        else if (t && t.dataset.drop === 'field:0') playFromHand(d.id);
        else if (t) toast("That's the opponent's side");
        render();
        setTimeout(() => { drag = null; }, 0);
      } else {
        drag = null;
        S.ui.panel = null;
        S.ui.menu = S.ui.menu === d.id ? null : d.id;
        render();
      }
    };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', () => { if (ghost) ghost.remove(); ghost = null; drag = null; frame.classList.remove('dragging'); render(); });
  }
  function targetAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && frame.contains(el) ? el.closest('[data-drop]') : null;
  }

  function syncToolbar() {
    root.querySelectorAll('[data-view]').forEach(b => {
      const [k, v] = b.dataset.view.split(':');
      b.setAttribute('aria-pressed', String(k === 'measure' ? S.view.measure : S.view[k] === v));
    });
  }

  window.Board = {
    mount(el, o) {
      opts = o; root = el;
      S = sample();
      S.ui = { panel: null, menu: null };
      S.view = { layout: o.layout, device: window.innerWidth < 700 ? 'phone' : 'desk', measure: false };
      stage = el.querySelector('.stage');
      stage.innerHTML = '<div class="stage-in"><div class="scaler"><div class="board"></div></div></div><div class="toast" role="status" aria-live="polite"></div>';
      stageIn = stage.querySelector('.stage-in'); scaler = stage.querySelector('.scaler'); frame = stage.querySelector('.board'); toastEl = stage.querySelector('.toast');
      shadow = document.createElement('div');
      shadow.setAttribute('aria-hidden', 'true');
      shadow.style.cssText = 'position:fixed;left:-20000px;top:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(shadow);
      el.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
        const [k, v] = b.dataset.view.split(':');
        if (k === 'measure') S.view.measure = !S.view.measure; else S.view[k] = v;
        S.ui.panel = null; S.ui.menu = null;
        render();
      }));
      const nt = el.querySelector('[data-do="next"]'); if (nt) nt.addEventListener('click', () => { S.ui.panel = null; S.ui.menu = null; nextTurn(); render(); });
      const rs = el.querySelector('[data-do="reset"]'); if (rs) rs.addEventListener('click', () => { const v = S.view; S = sample(); S.view = v; S.ui = { panel: null, menu: null }; render(); toast('Back to the turn 7 sample'); });
      bind();
      window.addEventListener('resize', () => { scale(); });
      const go = () => render();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
      go();
    }
  };
})();
