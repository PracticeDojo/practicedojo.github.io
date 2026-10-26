/* Turn replay prototypes: what A–D share. The compiled turns, how a step is
   named and coloured, card faces, the top bar and the theme. */
(function () {
    const CARDS = window.CARDS, TURNS = window.TURNS;
    const cache = {};

    // ---- Theme: day / Kiln, following the viewer's choice when there is one.
    const root = document.documentElement;
    function setTheme(t) {
        root.dataset.theme = t;
        try { localStorage.setItem('tr-theme', t); } catch (e) { /* storage blocked */ }
    }
    let saved = null;
    try { saved = localStorage.getItem('tr-theme'); } catch (e) { /* storage blocked */ }
    const asked = root.dataset.theme;
    setTheme(asked === 'dark' || asked === 'night' ? 'night' : asked === 'light' || asked === 'day' ? 'day'
        : saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'));
    // An artifact viewer writes dark / light on <html>: read it as Kiln / day.
    new MutationObserver(() => {
        const t = root.dataset.theme;
        if (t === 'dark') setTheme('night');
        else if (t === 'light') setTheme('day');
    }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    // ---- Icons: line icons for the verbs with no game art (16px grid).
    const P = d => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    const ICON = {
        challenge: P('<path d="M3 3l10 10M13 3L3 13M3 3v3M3 3h3M13 3v3M13 3h-3"/>'),
        ink: P('<path d="M8 2.2C8 2.2 3.6 7 3.6 10a4.4 4.4 0 0 0 8.8 0C12.4 7 8 2.2 8 2.2z"/>'),
        banish: P('<path d="M4 4l8 8M12 4l-8 8"/>'),
        sing: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2.5l7-1.5v9.2a2.3 2.3 0 1 1-1.5-2.15V4.1L7.5 5v6.7a2.3 2.3 0 1 1-1.5-2.15z"/></svg>',
        play: P('<path d="M8 12V3M4.5 6.5L8 3l3.5 3.5M3 14h10"/>'),
        draw: P('<rect x="4" y="2" width="8" height="10.5" rx="1.5"/><path d="M8 14.5v-4M6.2 12.7L8 14.5l1.8-1.8"/>'),
        discard: P('<path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13.5h10"/>'),
        bottom: P('<rect x="4" y="2" width="8" height="7" rx="1.2"/><path d="M8 9.5v4M6 11.5l2 2 2-2"/>'),
        ability: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5l2 4.6 4.6 2-4.6 2L8 14.6l-2-4.5-4.6-2 4.6-2z"/></svg>',
        dmg: P('<path d="M8 2v6M8 11.2v.6"/><circle cx="8" cy="8" r="6.2"/>'),
        start: P('<path d="M4 2.5v11M4 3h8l-2 3 2 3H4"/>'),
        end: P('<path d="M3 8h9M9 4.5L12.5 8 9 11.5"/>'),
        prev: P('<path d="M10 3.5L5.5 8l4.5 4.5"/>'),
        next: P('<path d="M6 3.5l4.5 4.5L6 12.5"/>'),
        first: P('<path d="M11 3.5L6.5 8l4.5 4.5M4 3.5v9"/>'),
        last: P('<path d="M5 3.5L9.5 8 5 12.5M12 3.5v9"/>'),
        playback: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 2.8v10.4L13 8z"/></svg>',
        pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".6"/><rect x="9.4" y="3" width="2.6" height="10" rx=".6"/></svg>',
        branch: P('<circle cx="4.5" cy="3.5" r="1.6"/><circle cx="4.5" cy="12.5" r="1.6"/><circle cx="11.5" cy="5.5" r="1.6"/><path d="M4.5 5.1v5.8M11.5 7.1c0 2.6-7 1.9-7 4"/>'),
        sun: P('<circle cx="8" cy="8" r="3"/><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1"/>'),
        moon: P('<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/>'),
        check: P('<path d="M3.5 8.5l3 3 6-7"/>'),
    };
    const gi = name => `<span class="gi gi-${name}" aria-hidden="true"></span>`;
    const icon = name => name === 'quest' || name === 'lore' ? gi('lore') : name === 'exert' ? gi('exert') : `<span class="ico" aria-hidden="true">${ICON[name] || ''}</span>`;

    // ---- Turns, compiled once.
    function get(id) {
        if (!cache[id]) {
            const turn = JSON.parse(JSON.stringify(TURNS.find(t => t.id === id)));
            const steps = Tape.compile(turn, CARDS);
            cache[id] = { turn, steps, acc: Tape.account(turn, steps, CARDS) };
        }
        return cache[id];
    }

    // ---- Names.
    const SHORT = {
        'Strength of a Raging Fire': 'Strength', 'Malicious, Mean, and Scary': 'Malicious', 'To Wither a Flower': 'Wither',
        'Strike a Good Match': 'Strike', 'Woolter & Jesse': 'Woolter', 'Akood et Emuti': 'Akood', 'Circle of Life': 'Circle',
        'Darkwing Duck': 'Darkwing', 'Prince Phillip': 'Phillip', 'Milo Thatch': 'Milo', 'Don Karnage': 'Karnage',
    };
    const cardOf = (st, iid) => CARDS[st.c[iid].id];
    const nm = (st, iid) => cardOf(st, iid).n;
    const short = (st, iid) => SHORT[nm(st, iid)] || nm(st, iid);
    const list = a => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
    const owner = (st, iid) => 'P' + (st.c[iid].owner + 1);

    // Which key colour and icon a step wears.
    function verb(s) {
        switch (s.v) {
            case 'challenge': return { k: 'coral', i: 'challenge', w: 'Challenge' };
            case 'quest': return { k: 'olive', i: 'quest', w: 'Quest' };
            case 'ink': return { k: 'olive', i: 'ink', w: 'Ink' };
            case 'lore': return { k: 'olive', i: 'lore', w: 'Lore' };
            case 'sing': return { k: 'trace', i: 'sing', w: 'Sing' };
            case 'banish': return { k: 'graphite', i: 'banish', w: 'Banished' };
            case 'discard': return { k: 'graphite', i: 'discard', w: 'Discard' };
            case 'bottom': return { k: 'graphite', i: 'bottom', w: 'Deck bottom' };
            case 'dmg': return { k: 'dmg', i: 'dmg', w: 'Damage' };
            case 'play': return { k: 'bone', i: 'play', w: s.from === 'discard' ? 'Play from discard' : 'Play' };
            case 'draw': return { k: 'bone', i: 'draw', w: 'Draw' };
            case 'ability': return { k: 'bone', i: 'ability', w: s.when ? 'Trigger' : 'Ability' };
            case 'start': return { k: 'bone', i: 'start', w: 'Turn starts' };
            default: return { k: 'bone', i: 'end', w: 'End of turn' };
        }
    }

    // A step a rule refused has no cards on the board: name it from the script.
    const nameOf = q => typeof q === 'string' ? q.split(' - ')[0] : q && q.name || '';
    function rawTitle(a) {
        switch (a.v) {
            case 'ink': return `Inks ${nameOf(a.card)}`;
            case 'play': return `Plays ${nameOf(a.card)}`;
            case 'sing': return `${list(a.singers.map(nameOf))} sing${a.singers.length > 1 ? '' : 's'} ${nameOf(a.card)}`;
            case 'quest': return `${nameOf(a.card)} quests`;
            case 'challenge': return `${nameOf(a.att)} challenges ${nameOf(a.def)}`;
            case 'ability': return `${nameOf(a.card)}: ${a.name}`;
            case 'dmg': return `${a.n === 'chars' ? 'Damage' : a.n + ' damage'} to ${a.all ? 'each opposing character' : nameOf(a.target)}`;
            case 'discard': return `Discards ${nameOf(a.card)}`;
            default: return a.v;
        }
    }

    // The words on a tape key: short, card names only.
    function chip(s) {
        if (s.skipped) return rawTitle(s.raw);
        const st = s.state;
        const T = (s.targets || []).map(i => short(st, i));
        const A = (s.actors || []).map(i => short(st, i));
        switch (s.v) {
            case 'start': return 'Ready';
            case 'end': return 'Pass';
            case 'draw': return T.join(' + ');
            case 'ink': case 'play': return short(st, s.card);
            case 'sing': return `${A.join(' + ')} → ${short(st, s.card)}`;
            case 'quest': return `${A[0]} +${s.lore}`;
            case 'challenge': return `${A[0]} → ${T[0]}`;
            case 'dmg': return `${s.n} → ${T.length > 2 ? 'each' : T.join(', ')}`;
            case 'banish': case 'discard': case 'bottom': return T.join(', ');
            case 'lore': return `+${s.lore} lore`;
            case 'ability': return s.name.toLowerCase().replace(/(^|\s)\S/g, m => m.toUpperCase());
        }
        return '';
    }

    // The sentence for a step.
    function title(s) {
        if (s.skipped) return rawTitle(s.raw);
        const st = s.state;
        const T = (s.targets || []).map(i => nm(st, i));
        const A = (s.actors || []).map(i => nm(st, i));
        switch (s.v) {
            case 'start': return `Turn ${st.turn} · Player ${st.active + 1} begins`;
            case 'end': return 'End of turn';
            case 'draw': return (s.phase === 'start' ? 'Draw step: ' : 'Draws ') + list(T);
            case 'ink': return `Inks ${nm(st, s.card)}`;
            case 'play': return `Plays ${nm(st, s.card)}` + (s.from === 'discard' ? ' from the discard' : '');
            case 'sing': return `${list(A)} sing${A.length > 1 ? '' : 's'} ${nm(st, s.card)}`;
            case 'quest': return `${A[0]} quests for ${s.lore} lore`;
            case 'challenge': return `${A[0]} challenges ${T[0]}`;
            case 'dmg': return T.length > 2 ? `${s.n} damage to each of ${list(T)}` : `${s.n} damage to ${list(T)}`;
            case 'banish': return `${list(T)} ${T.length > 1 ? 'are' : 'is'} banished`;
            case 'discard': return `Discards ${list(T)}`;
            case 'bottom': return `${list(T)} goes to the bottom of the deck`;
            case 'lore': return `Gains ${s.lore} lore`;
            case 'ability': return `${nm(st, s.card)}: ${s.name}`;
        }
        return '';
    }

    // A mono figure for what a step cost or made.
    function figure(s) {
        if (s.skipped) return "can't";
        if (s.fizzled) return "doesn't fire";
        switch (s.v) {
            case 'ink': return '+1 ink';
            case 'play': return s.cost ? `−${s.cost} ink` : 'free';
            case 'sing': return 'free · exerts';
            case 'quest': case 'lore': return `+${s.lore} lore`;
            case 'challenge': return `${s.dealt} / ${s.took} dmg`;
            case 'dmg': return `${s.n} dmg${s.targets.length > 1 ? ' × ' + s.targets.length : ''}`;
            case 'banish': return s.why || '';
            case 'draw': return `+${s.targets.length} card${s.targets.length > 1 ? 's' : ''}`;
            case 'ability': return s.when ? 'end of turn' : '';
        }
        return '';
    }

    // ---- A card face: the art over its text card (the text shows if the art can't load).
    function face(st, iid, opts = {}) {
        const c = cardOf(st, iid), k = st.c[iid];
        const stats = c.type === 'Character' ? `${c.cost} · ${c.s}/${c.w} · ${c.l}◊` : `${c.cost}`;
        return `<div class="cc${opts.cls ? ' ' + opts.cls : ''}" data-iid="${iid}"${opts.style ? ` style="${opts.style}"` : ''} title="${c.n}${c.v ? ' - ' + c.v : ''}">`
            + `<div class="cc-txt"><b>${c.n}</b><i>${c.v || c.type}</i><span class="st">${stats}</span></div>`
            + (c.img && !opts.noArt ? `<img src="${c.img}" alt="" loading="lazy" onerror="this.remove()">` : '')
            + (opts.inner || '') + '</div>';
    }
    const back = (iid, cls) => `<div class="cc is-back${cls ? ' ' + cls : ''}"${iid ? ` data-iid="${iid}"` : ''}></div>`;

    // ---- Top bar: the four prototypes and the turns.
    const PAGES = [['A', 'Tape', 'A-tape.html'], ['B', 'Lanes', 'B-lanes.html'], ['C', 'Chain', 'C-chain.html'], ['D', 'Fork', 'D-fork.html']];
    function topbar(el, page, onTurn, current, turns) {
        const tabs = PAGES.map(([l, n, f]) => `<a class="tr-tool" href="${f}" data-page="${l}"${l === page ? ' aria-current="page"' : ''}><span class="tn">${l}</span><span>${n}</span></a>`).join('');
        const tt = (turns || TURNS.filter(t => !t.fork || t.fork)).map(t =>
            `<button class="tr-tool${t.id === current ? ' is-on' : ''}" data-turn="${t.id}"><span class="tn">T${t.turn} · P${t.active + 1}</span><span class="tl">${t.title}</span></button>`).join('');
        el.innerHTML = `<div class="tr-brand"><b>TURN REPLAY</b><span class="lbl">prototype</span></div>
            <nav class="tr-tabs">${tabs}</nav>
            <div class="tr-turns">${onTurn ? tt : ''}</div>
            <button class="tr-tool tr-theme" id="tr-theme" aria-label="Switch day / Kiln">${icon(root.dataset.theme === 'night' ? 'sun' : 'moon')}</button>`;
        el.querySelector('#tr-theme').onclick = e => {
            setTheme(root.dataset.theme === 'night' ? 'day' : 'night');
            e.currentTarget.innerHTML = icon(root.dataset.theme === 'night' ? 'sun' : 'moon');
            window.dispatchEvent(new Event('tr-theme'));
        };
        el.querySelectorAll('[data-turn]').forEach(b => b.onclick = () => {
            el.querySelectorAll('[data-turn]').forEach(x => x.classList.toggle('is-on', x === b));
            onTurn(b.dataset.turn);
        });
        // Tabs keep the turn and step you are on.
        el.querySelectorAll('[data-page]').forEach(a => a.addEventListener('click', () => { a.href = a.href.split('#')[0] + location.hash; }));
    }

    function toast(msg) {
        let t = document.querySelector('.tr-toast');
        if (!t) { t = document.createElement('div'); t.className = 'tr-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
        t.innerHTML = msg;
        clearTimeout(toast.t);
        toast.t = setTimeout(() => t.remove(), 4200);
    }

    // #t4p2.5 → turn t4p2, step 5
    function readHash(def) {
        const m = /^#?([a-z0-9]+)(?:\.(\d+))?$/.exec(location.hash);
        const id = m && TURNS.some(t => t.id === m[1]) ? m[1] : def;
        return { id, step: m && m[1] === id && m[2] ? +m[2] : null };
    }
    function writeHash(id, step) {
        history.replaceState(null, '', '#' + id + (step != null ? '.' + step : ''));
    }

    window.TR = { rawTitle, nameOf, CARDS, TURNS, get, verb, chip, title, figure, icon, face, back, topbar, toast, readHash, writeHash, nm, short, list, cardOf, owner };
})();
