// Card modifiers (Feature 61): "+2 strength this turn", "Resist +1 until your
// next turn", "Challenger +3", and when each one ends.
//
// It knows nothing about game state. App (app/index.html) keeps the modifiers
// on each card in play as `card.mods` and asks this module to read and change
// them:
//   STATS, UNTIL                     the five stats and the three durations
//   total(card, stat)                sum of a card's modifiers for one stat
//   make(stat, value, until, by)     a new modifier (by: the player who added it)
//   label / full / title(mod)        "+2 STR" / "+2 strength" / "+2 strength · this turn"
//   expire(cards, phase, player)     drop the ones ending now, return them
//   openPicker(opts) / closePicker() the popover that builds one
// A modifier: { id, stat, value, until: 'turn' | 'next' | 'always', by }.
window.Mods = (function () {
    'use strict';

    // Strength, willpower and lore go either way; Challenger and Resist only up.
    const STATS = [
        { key: 'strength', short: 'STR', name: 'strength', signed: true },
        { key: 'willpower', short: 'WP', name: 'willpower', signed: true },
        { key: 'lore', short: 'LORE', name: 'lore', signed: true },
        { key: 'challenger', short: 'Chal', name: 'Challenger', signed: false },
        { key: 'resist', short: 'Res', name: 'Resist', signed: false }
    ];
    const UNTIL = {
        turn: 'this turn',
        next: 'until my next turn',
        always: 'always'
    };
    const stat = (key) => STATS.find(s => s.key === key);

    function total(card, key) {
        if (!card || !card.mods) return 0;
        return card.mods.reduce((n, m) => n + (m.stat === key ? m.value : 0), 0);
    }

    let seq = 0;
    function make(key, value, until, by) {
        return { id: 'm' + Date.now().toString(36) + (seq++).toString(36), stat: key, value, until, by };
    }

    // Keywords read like the card ("Challenger +2"); stats read like a buff ("+2 STR").
    function label(m) {
        const s = stat(m.stat);
        if (!s) return '';
        const n = (m.value > 0 ? '+' : '−') + Math.abs(m.value);
        return s.signed ? `${n} ${s.short}` : `${s.short} ${n}`;
    }
    // In words, for the log and tooltips: "+2 strength", "Challenger +1".
    function full(m) {
        const s = stat(m.stat);
        if (!s) return '';
        const n = (m.value > 0 ? '+' : '−') + Math.abs(m.value);
        return s.signed ? `${n} ${s.name}` : `${s.name} ${n}`;
    }
    function title(m) {
        return `${full(m)} · ${UNTIL[m.until] || ''}`;
    }

    // phase 'end': the turn is ending, so every "this turn" modifier goes.
    // phase 'start': `player`'s turn is starting, so theirs "until my next turn" go.
    function expire(cards, phase, player) {
        const gone = [];
        cards.forEach(card => {
            if (!card.mods || !card.mods.length) return;
            const keep = [];
            card.mods.forEach(m => {
                const ends = phase === 'end' ? m.until === 'turn' : (m.until === 'next' && m.by === player);
                (ends ? gone : keep).push(ends ? { card, mod: m } : m);
            });
            if (keep.length) card.mods = keep; else delete card.mods;
        });
        return gone;
    }

    // ---------- Picker ----------
    // opts: { anchor: DOMRect, cardName, allLabel, recent: [{stat, value, until}],
    //         last: {stat, value, until}, onAdd({stat, value, until, all}),
    //         getRecent() -> the list again after an add (the picker stays open on a desktop),
    //         onNav('left'|'right'|'up'|'down') -> {anchor, cardName, allLabel, onAdd} or null,
    //         onClose() }

    let el = null, onKey = null, onDown = null, onClose = null;

    function closePicker() {
        if (!el) return;
        el.remove();
        el = null;
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('pointerdown', onDown, true);
        const done = onClose;
        onClose = null;
        if (done) done();
    }
    function isOpen() { return !!el; }

    function openPicker(opts) {
        closePicker();
        onClose = opts.onClose || null;
        const pick = Object.assign({ stat: 'strength', value: 1, until: 'turn' }, opts.last || {});
        let all = false;
        const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

        el = document.createElement('div');
        el.className = 'mod-pop';
        el.id = 'mod-pop';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', `Add a modifier to ${opts.cardName}`);
        el.addEventListener('click', (e) => e.stopPropagation());
        el.addEventListener('contextmenu', (e) => e.stopPropagation());

        const draw = () => {
            const s = stat(pick.stat);
            if (!s.signed && pick.value < 1) pick.value = 1;
            if (pick.value === 0) pick.value = 1;
            const preview = { stat: pick.stat, value: pick.value, until: pick.until };
            const recent = (opts.recent || []).filter(r => stat(r.stat));
            el.innerHTML = `
                <div class="mp-head"><span class="mp-key">Modify</span><span class="mp-name">${esc(opts.cardName)}</span>
                    <button type="button" class="mp-x" data-act="close" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
                <div class="mp-label">Stat</div>
                <div class="mp-seg mp-stats" role="radiogroup" aria-label="Stat">${STATS.map(t =>
                    `<button type="button" role="radio" aria-checked="${t.key === pick.stat}" class="${t.key === pick.stat ? 'on' : ''}" data-stat="${t.key}">${t.signed ? t.short : t.name}</button>`).join('')}</div>
                <div class="mp-label">Amount</div>
                <div class="mp-amt">
                    <button type="button" data-step="-1" aria-label="One less" ${!s.signed && pick.value <= 1 ? 'disabled' : ''}>−</button>
                    <output aria-live="polite">${(pick.value > 0 ? '+' : '−') + Math.abs(pick.value)}</output>
                    <button type="button" data-step="1" aria-label="One more">+</button>
                </div>
                <div class="mp-label">Lasts</div>
                <div class="mp-seg mp-until" role="radiogroup" aria-label="Lasts">${Object.keys(UNTIL).map(k =>
                    `<button type="button" role="radio" aria-checked="${k === pick.until}" class="${k === pick.until ? 'on' : ''}" data-until="${k}"><span class="mod-pill is-${k}" aria-hidden="true"></span>${k === 'turn' ? 'This turn' : k === 'next' ? 'Until my next turn' : 'Always'}</button>`).join('')}</div>
                ${opts.allLabel ? `<label class="mp-all"><input type="checkbox" ${all ? 'checked' : ''}> ${esc(opts.allLabel)}</label>` : ''}
                ${recent.length ? `<div class="mp-label">Recent</div><div class="mp-recent">${recent.map((r, i) =>
                    `<button type="button" class="mod-pill is-${r.until}${r.value < 0 ? ' is-neg' : ''}" data-recent="${i}" title="Add ${esc(title(r))}">${esc(label(r))}</button>`).join('')}</div>` : ''}
                <div class="mp-foot"><span class="mod-pill is-${pick.until}${pick.value < 0 ? ' is-neg' : ''}" title="${esc(title(preview))}">${esc(label(preview))}</span>
                    <button type="button" class="mp-add" data-act="add">Add</button></div>`;
        };
        // On a desktop the picker stays up after an add, for the next one; the
        // phone sheet closes as before.
        const commit = (m) => {
            const add = Object.assign({ all: all && !!opts.allLabel }, m);
            if (el.classList.contains('is-sheet')) {
                const done = opts.onAdd;
                closePicker();
                done(add);
                return;
            }
            opts.onAdd(add);
            if (!el) return; // the add took its card out of play and closed us
            if (opts.getRecent) opts.recent = opts.getRecent();
            redraw();
        };
        // Redraw, keeping the focused key focused.
        const redraw = () => {
            const a = document.activeElement;
            const sel = a && el.contains(a)
                ? ['stat', 'until', 'step', 'act'].map(k => a.dataset[k] !== undefined ? `[data-${k}="${a.dataset[k]}"]` : null).find(Boolean)
                : null;
            draw();
            const again = sel && el.querySelector(sel);
            if (again && !again.disabled) again.focus();
        };

        el.addEventListener('click', (e) => {
            const cb = e.target.closest('input[type=checkbox]');
            if (cb) { all = cb.checked; return; }
            const b = e.target.closest('button');
            if (!b || b.disabled) return;
            if (b.dataset.act === 'close') { closePicker(); return; }
            if (b.dataset.act === 'add') { commit({ stat: pick.stat, value: pick.value, until: pick.until }); return; }
            if (b.dataset.recent !== undefined) {
                const r = opts.recent[Number(b.dataset.recent)];
                if (r) commit({ stat: r.stat, value: r.value, until: r.until });
                return;
            }
            if (b.dataset.stat) pick.stat = b.dataset.stat;
            if (b.dataset.until) pick.until = b.dataset.until;
            if (b.dataset.step) {
                let v = pick.value + Number(b.dataset.step);
                if (v === 0) v += Number(b.dataset.step); // there is no "+0"
                pick.value = Math.max(stat(pick.stat).signed ? -20 : 1, Math.min(20, v));
            }
            redraw();
        });

        draw();
        document.body.appendChild(el);

        // Beside the card, kept on screen. Phones get a sheet along the bottom (CSS).
        const place = () => {
            const r = opts.anchor;
            const w = el.offsetWidth, h = el.offsetHeight;
            let left = r.right + 10;
            if (left + w > window.innerWidth - 8) left = r.left - w - 10;
            left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
            const top = Math.max(8, Math.min(window.innerHeight - h - 8, r.top));
            el.style.left = left + 'px';
            el.style.top = top + 'px';
        };
        if (opts.anchor && window.innerWidth > 600) place();
        else el.classList.add('is-sheet');

        // Arrows move the picker to the next card; opts.onNav(dir) says which
        // (or returns null to stay). Desktop only: the phone sheet has no board beside it.
        const NAV = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
        onKey = (e) => {
            if (NAV[e.key] && opts.onNav && !e.altKey && !e.ctrlKey && !e.metaKey) {
                if (el.classList.contains('is-sheet')) return;
                e.stopPropagation(); e.preventDefault();
                const t = opts.onNav(NAV[e.key]);
                if (t) {
                    Object.assign(opts, t);
                    el.setAttribute('aria-label', `Add a modifier to ${opts.cardName}`);
                    redraw();
                    place();
                }
            }
            else if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); closePicker(); }
            else if (e.key === 'Enter' && !e.target.closest('button')) { e.preventDefault(); commit({ stat: pick.stat, value: pick.value, until: pick.until }); }
        };
        onDown = (e) => { if (el && !el.contains(e.target)) closePicker(); };
        document.addEventListener('keydown', onKey, true);
        document.addEventListener('pointerdown', onDown, true);
        const first = el.querySelector('.mp-stats .on');
        if (first) first.focus();
    }

    return { STATS, UNTIL, total, make, label, full, title, expire, openPicker, closePicker, isOpen };
})();
