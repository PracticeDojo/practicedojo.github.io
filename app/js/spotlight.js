// Spotlight (Feature 57, M4): "Show me" and the tours' pointer. Dims the page except one
// control, rings it and shows a callout. docs/ARCH-help-and-tour.md §7.
//
// Contract:
//   DojoSpotlight.setTargets(targets)   // manual.targets; if never called, show() fetches help/manual.json
//   DojoSpotlight.resolve(name) -> Element|null   // the target's element on this device, if visible
//   DojoSpotlight.show(nameOrElement, {
//       title, text,                    // text is short Markdown-free HTML-escaped prose
//       step,                           // e.g. '2 / 8', shown in mono
//       buttons: [{ label, primary, onClick }],
//       passThrough,                    // let clicks reach the target (tour steps that wait for an action)
//       onClose
//   }) -> Promise<boolean>              // false if the target isn't on screen (callout centred instead)
//   DojoSpotlight.hide(), DojoSpotlight.isOpen()
// Handles its own Escape (capture phase) so the app's Escape chain never sees it while open.
//
// As built (M4), beyond the contract:
//   - text is set as plain text; the one exception is **bold**, which becomes <strong>
//     (tour text names controls in bold). Nothing else is interpreted.
//   - buttons: onClick(event) runs first; the spotlight then closes (onClose('button'))
//     unless onClick returned false or called show() again (the next step replaces it).
//     With no buttons, one paper **Got it**. `primary: true` is the signal key; Enter on
//     the callout presses it, and focus starts on it (else on the first button).
//   - options.focus: false leaves focus where it is (a tour step that waits for a hotkey).
//   - onClose(reason) is called once: 'button', 'escape', 'click' (outside, passThrough
//     off), 'replaced' (another show()), 'hide' (hide() was called).
//   - passThrough: the cut-out lets clicks and drags through; outside it, clicks are blocked.
//     A drag that starts in the cut-out may end anywhere (drop targets outside it work).
//   - DojoSpotlight.loadTargets() -> Promise<targets>, the registry show() uses.
// Loaded as a classic script in <head>: no DOM work until the first show().
window.DojoSpotlight = (function () {
    'use strict';

    const PAD = 6;               // the cut-out's margin around the target
    const GAP = 12;              // callout to cut-out
    const EDGE = 8;              // callout to the viewport edge (desktop)
    const FADE = 120;
    const PHONE_MQ = '(max-width: 760px)';

    let targets = null;          // name -> { label, screen, any|desktop|phone }
    let loading = null;          // Promise while help/manual.json is on its way
    let root = null;             // .spot, built on first show()
    let els = null;              // its parts
    let cur = null;              // the open spotlight (one at a time)
    let seq = 0;
    let fadeTimer = 0;
    let textIdSeq = 0;

    const isPhone = () => !!(window.matchMedia && window.matchMedia(PHONE_MQ).matches);
    const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    // ---------------------------------------------------------------- targets
    function setTargets(t) {
        targets = (t && t.targets && !t.label) ? t.targets : (t || null);
    }

    function loadTargets() {
        if (targets) return Promise.resolve(targets);
        if (loading) return loading;
        const viaHelp = (window.DojoHelp && typeof window.DojoHelp.load === 'function')
            ? Promise.resolve().then(() => window.DojoHelp.load())
            : Promise.reject(new Error('no DojoHelp.load'));
        loading = viaHelp
            .catch(() => fetch('help/manual.json').then(r => {
                if (!r.ok) throw new Error(`help/manual.json: ${r.status}`);
                return r.json();
            }))
            .then(m => { if (!targets) targets = (m && m.targets) || {}; return targets; })
            .catch(e => { console.warn('DojoSpotlight: no targets', e); loading = null; return {}; });
        return loading;
    }

    function selectorFor(name) {
        const t = targets && targets[name];
        if (!t) return null;
        return (isPhone() ? t.phone : t.desktop) || t.any || null;
    }

    // Visible: has a box, isn't display:none / visibility:hidden / opacity 0 (itself or an
    // ancestor), and, if it's off screen, could be scrolled there (no fixed ancestor).
    function isVisible(el) {
        if (!el || !el.isConnected) return false;
        if (typeof el.checkVisibility === 'function') {
            if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true, opacityProperty: true, visibilityProperty: true })) return false;
        } else {
            for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
                const cs = getComputedStyle(n);
                if (cs.display === 'none' || cs.opacity === '0') return false;
                if (n === el && cs.visibility === 'hidden') return false;
            }
        }
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        if (el.closest('[hidden], [inert]')) return false;
        const vw = window.innerWidth, vh = window.innerHeight;
        const onScreen = r.right > 0 && r.bottom > 0 && r.left < vw && r.top < vh;
        if (!onScreen) {
            // Reachable if a scrolling box holds it; a fixed box with no scroller in
            // between is a drawer parked off screen.
            for (let n = el.parentElement; n && n.nodeType === 1; n = n.parentElement) {
                const cs = getComputedStyle(n);
                if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) &&
                    (n.scrollHeight > n.clientHeight || n.scrollWidth > n.clientWidth)) break;
                if (cs.position === 'fixed') return false;
            }
        }
        return true;
    }

    function resolve(name) {
        if (!targets) { loadTargets(); return null; }
        const sel = selectorFor(name);
        if (!sel) return null;
        let list;
        try { list = document.querySelectorAll(sel); } catch (e) { return null; }
        for (const el of list) if (isVisible(el)) return el;
        return null;
    }

    // ---------------------------------------------------------------- DOM
    function build() {
        if (root) return;
        root = document.createElement('div');
        root.className = 'spot';
        root.hidden = true;
        root.innerHTML =
            '<div class="spot-dim" aria-hidden="true"></div>' +
            '<div class="spot-hole" aria-hidden="true"></div>' +
            '<div class="spot-block" data-side="t" aria-hidden="true"></div>' +
            '<div class="spot-block" data-side="r" aria-hidden="true"></div>' +
            '<div class="spot-block" data-side="b" aria-hidden="true"></div>' +
            '<div class="spot-block" data-side="l" aria-hidden="true"></div>' +
            '<div class="spot-callout fu-paper" role="dialog">' +
            '<div class="spot-step"></div>' +
            '<div class="spot-title"></div>' +
            '<p class="spot-text"></p>' +
            '<p class="spot-note"></p>' +
            '<div class="spot-actions"></div>' +
            '</div>';
        document.body.appendChild(root);
        const q = (s) => root.querySelector(s);
        els = {
            dim: q('.spot-dim'), hole: q('.spot-hole'), callout: q('.spot-callout'),
            step: q('.spot-step'), title: q('.spot-title'), text: q('.spot-text'),
            note: q('.spot-note'), actions: q('.spot-actions'),
            blocks: [...root.querySelectorAll('.spot-block')]
        };
        const n = ++textIdSeq;
        els.title.id = `spot-title-${n}`;
        els.text.id = `spot-text-${n}`;
        els.note.id = `spot-note-${n}`;

        // Clicks outside the cut-out never reach the app. With passThrough off, a click
        // anywhere ends the spotlight.
        const swallow = (e) => { e.stopPropagation(); if (e.cancelable) e.preventDefault(); };
        for (const b of els.blocks) {
            ['pointerdown', 'mousedown', 'touchstart', 'mouseup', 'pointerup', 'touchend', 'dblclick', 'wheel', 'dragover', 'drop']
                .forEach(t => b.addEventListener(t, swallow, { passive: false }));
            b.addEventListener('contextmenu', (e) => { swallow(e); if (cur && !cur.opts.passThrough) close('click'); });
            b.addEventListener('click', (e) => { swallow(e); if (cur && !cur.opts.passThrough) close('click'); });
        }
        // Clicks on the callout stay on the callout.
        ['pointerdown', 'mousedown', 'touchstart', 'click', 'contextmenu'].forEach(t =>
            els.callout.addEventListener(t, (e) => e.stopPropagation()));
    }

    function escapeText(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    // Plain text, with **bold** as the one mark (tour steps name controls in bold).
    const prose = (s) => escapeText(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    function fill(o, label) {
        els.step.textContent = o.step || '';
        els.step.hidden = !o.step;
        els.title.textContent = o.title || '';
        els.title.hidden = !o.title;
        els.text.innerHTML = prose(o.text || '');
        els.text.hidden = !o.text;
        els.note.hidden = true;
        const c = els.callout;
        if (o.title) { c.setAttribute('aria-labelledby', els.title.id); c.removeAttribute('aria-label'); }
        else { c.removeAttribute('aria-labelledby'); c.setAttribute('aria-label', label ? cap(label) : 'Tip'); }
        c.setAttribute('aria-describedby', [o.text ? els.text.id : '', els.note.id].filter(Boolean).join(' '));

        els.actions.textContent = '';
        const buttons = (o.buttons && o.buttons.length) ? o.buttons : [{ label: 'Got it' }];
        buttons.forEach((b) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = b.primary ? 'btn btn-primary spot-btn' : 'btn spot-btn';
            btn.textContent = b.label || 'OK';
            if (b.primary) btn.dataset.primary = '';
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mine = cur;
                if (!mine) return;
                let keep = false;
                try { keep = (typeof b.onClick === 'function' ? b.onClick(e) : undefined) === false; }
                catch (err) { console.error(err); }
                if (cur === mine && !keep) close('button');
            });
            els.actions.appendChild(btn);
        });
    }

    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

    // ---------------------------------------------------------------- the ring's colour
    // Ink on the chassis, paper on glass: whichever reads against what's around the
    // target, so the first opaque background behind it decides.
    let probe = null;
    function luminance(color) {
        if (!probe) { const c = document.createElement('canvas'); c.width = c.height = 1; probe = c.getContext('2d', { willReadFrequently: true }); }
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#000';
        probe.fillStyle = color;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
        if (a < 128) return null;
        const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }
    function groundIsDark(el) {
        for (let n = el.parentElement; n; n = n.parentElement) {
            const bg = getComputedStyle(n).backgroundColor;
            if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') continue;
            const L = luminance(bg);
            if (L != null) return L < 0.18;
        }
        const L = luminance(getComputedStyle(document.body).backgroundColor);
        return L != null && L < 0.18;
    }

    // ---------------------------------------------------------------- layout
    function radiusOf(el, w, h) {
        const raw = getComputedStyle(el).borderTopLeftRadius || '0';
        let r = parseFloat(raw) || 0;
        if (/%$/.test(raw)) r = Math.min(w, h) * r / 100;
        r = Math.min(r, Math.min(w, h) / 2);
        return r > 0 ? r + PAD : 4;
    }

    function setBox(node, x, y, w, h) {
        const s = node.style;
        const v = [`${Math.round(x)}px`, `${Math.round(y)}px`, `${Math.max(0, Math.round(w))}px`, `${Math.max(0, Math.round(h))}px`];
        if (s.left !== v[0]) s.left = v[0];
        if (s.top !== v[1]) s.top = v[1];
        if (s.width !== v[2]) s.width = v[2];
        if (s.height !== v[3]) s.height = v[3];
    }

    function layout() {
        if (!cur) return;
        const vw = window.innerWidth, vh = window.innerHeight;
        const el = cur.el;
        const lost = !el;
        root.classList.toggle('is-lost', lost);
        root.classList.toggle('is-phone', isPhone());
        els.note.hidden = !lost;
        let hole = null;

        if (!lost) {
            const r = el.getBoundingClientRect();
            // The cut-out, kept 2px inside the viewport so its ring always shows.
            const x1 = Math.max(2, r.left - PAD), y1 = Math.max(2, r.top - PAD);
            const x2 = Math.min(vw - 2, r.right + PAD), y2 = Math.min(vh - 2, r.bottom + PAD);
            hole = { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
            setBox(els.hole, hole.x, hole.y, hole.w, hole.h);
            const rad = `${Math.round(radiusOf(el, r.width, r.height))}px`;
            if (els.hole.style.borderRadius !== rad) els.hole.style.borderRadius = rad;
            if (cur.ringEl !== el) { cur.ringEl = el; root.classList.toggle('is-on-glass', groundIsDark(el)); }
        }

        // Blockers: everything but the cut-out (passThrough), or everything.
        const [t, rt, b, l] = els.blocks;
        if (hole && cur.opts.passThrough) {
            setBox(t, 0, 0, vw, hole.y);
            setBox(b, 0, hole.y + hole.h, vw, vh - hole.y - hole.h);
            setBox(l, 0, hole.y, hole.x, hole.h);
            setBox(rt, hole.x + hole.w, hole.y, vw - hole.x - hole.w, hole.h);
        } else {
            setBox(t, 0, 0, vw, vh);
            setBox(b, 0, 0, 0, 0); setBox(l, 0, 0, 0, 0); setBox(rt, 0, 0, 0, 0);
        }
        placeCallout(hole, vw, vh);
    }

    function placeCallout(hole, vw, vh) {
        const c = els.callout;
        const cs = c.style;
        const phone = isPhone();
        // Measure at the width it will have.
        let w;
        if (phone) w = vw - 32;
        else w = Math.min(320, vw - 2 * EDGE);
        if (cs.width !== `${w}px`) cs.width = `${w}px`;
        const ch = c.offsetHeight;
        let x, y, dock = '';

        if (!hole) {
            x = (vw - w) / 2;
            y = Math.max(EDGE, (vh - ch) / 2);
        } else if (phone) {
            // Docked to the screen edge away from the target, above the safe area.
            x = 16;
            const mid = hole.y + hole.h / 2;
            dock = mid > vh / 2 ? 'top' : 'bottom';
            y = 0;
        } else {
            const cx = hole.x + hole.w / 2;
            x = Math.min(Math.max(EDGE, cx - w / 2), vw - w - EDGE);
            const below = hole.y + hole.h + GAP;
            const above = hole.y - GAP - ch;
            if (below + ch <= vh - EDGE) y = below;
            else if (above >= EDGE) y = above;
            else {
                // Beside it: right if there's room, else left; else over it, clamped.
                const right = hole.x + hole.w + GAP, left = hole.x - GAP - w;
                if (right + w <= vw - EDGE) x = right;
                else if (left >= EDGE) x = left;
                y = Math.min(Math.max(EDGE, hole.y + hole.h / 2 - ch / 2), vh - ch - EDGE);
            }
        }
        if (root.dataset.dock !== dock) root.dataset.dock = dock;
        if (dock) {
            // CSS docks it (env(safe-area-inset-*) lives there).
            if (cs.left !== '16px') cs.left = '16px';
            if (cs.top) cs.top = '';
        } else {
            y = Math.max(EDGE, Math.min(y, vh - ch - EDGE));
            const L = `${Math.round(x)}px`, T = `${Math.round(y)}px`;
            if (cs.left !== L) cs.left = L;
            if (cs.top !== T) cs.top = T;
        }
    }

    // ---------------------------------------------------------------- following
    function startFollowing() {
        stopFollowing();
        const s = cur;
        s.onWin = () => layout();
        window.addEventListener('resize', s.onWin);
        window.addEventListener('scroll', s.onWin, true);
        if (window.ResizeObserver) {
            s.ro = new ResizeObserver(() => layout());
            s.ro.observe(els.callout);
            if (s.el) s.ro.observe(s.el);
        }
        let last = 0;
        const tick = (now) => {
            if (cur !== s) return;
            // Re-find a target shown by name: the app often redraws the board with innerHTML.
            if (s.name && (!s.el || !s.el.isConnected || now - last > 250)) {
                last = now;
                const el = resolve(s.name);
                if (el !== s.el) retarget(el);
            } else if (s.el && !s.el.isConnected) {
                retarget(null);
            }
            layout();
            s.raf = requestAnimationFrame(tick);
        };
        s.raf = requestAnimationFrame(tick);
    }

    function stopFollowing() {
        const s = cur;
        if (!s) return;
        if (s.onWin) {
            window.removeEventListener('resize', s.onWin);
            window.removeEventListener('scroll', s.onWin, true);
        }
        if (s.ro) s.ro.disconnect();
        if (s.raf) cancelAnimationFrame(s.raf);
        s.onWin = s.ro = null;
        s.raf = 0;
    }

    function describe(el) {
        if (!el) return;
        cur.describedOld = el.getAttribute('aria-describedby');
        const ids = [els.text.hidden ? '' : els.text.id, cur.describedOld || ''].filter(Boolean).join(' ');
        if (ids) el.setAttribute('aria-describedby', ids);
    }
    function undescribe(s) {
        const el = s && s.el;
        if (!el) return;
        if (s.describedOld == null) el.removeAttribute('aria-describedby');
        else el.setAttribute('aria-describedby', s.describedOld);
        s.describedOld = null;
    }

    function retarget(el) {
        const s = cur;
        if (s.ro && s.el) s.ro.unobserve(s.el);
        undescribe(s);
        s.el = el;
        s.ringEl = null;
        if (el) {
            describe(el);
            if (s.ro) s.ro.observe(el);
        }
    }

    // ---------------------------------------------------------------- keys and drags
    function onKey(e) {
        if (!cur) return;
        // A styled dialog (z above us) owns the keys while it's up.
        if (document.querySelector('.dlg-backdrop')) return;
        if (e.key === 'Escape') {
            e.stopImmediatePropagation();
            e.preventDefault();
            close('escape');
        } else if (e.key === 'Enter' && els.callout.contains(e.target)) {
            const primary = els.actions.querySelector('[data-primary]');
            const onButton = e.target.closest && e.target.closest('button');
            if (primary && !onButton) {
                e.stopImmediatePropagation();
                e.preventDefault();
                primary.click();
            } else if (onButton) {
                e.stopImmediatePropagation(); // the button's own Enter, not the game's
            }
        }
    }

    // A press that starts in the cut-out lets the whole gesture through, so a drag
    // from the target can be dropped anywhere.
    let dragging = false;
    function onDown(e) {
        if (!cur || !cur.opts.passThrough) return;
        if (root.contains(e.target)) return;
        root.classList.add('is-through');
    }
    function onUp() {
        setTimeout(() => { if (!dragging && root) root.classList.remove('is-through'); }, 0);
    }
    function onDragStart(e) {
        if (!cur || !cur.opts.passThrough || root.contains(e.target)) return;
        dragging = true;
        root.classList.add('is-through');
    }
    function onDragEnd() {
        dragging = false;
        setTimeout(() => { if (root) root.classList.remove('is-through'); }, 0);
    }
    function listen(on) {
        const m = on ? 'addEventListener' : 'removeEventListener';
        document[m]('keydown', onKey, true);
        document[m]('pointerdown', onDown, true);
        window[m]('pointerup', onUp, true);
        window[m]('pointercancel', onUp, true);
        document[m]('dragstart', onDragStart, true);
        document[m]('dragend', onDragEnd, true);
        document[m]('drop', onDragEnd, true);
    }

    // ---------------------------------------------------------------- show / hide
    function close(reason) {
        const s = cur;
        if (!s) return;
        stopFollowing();
        undescribe(s);
        cur = null;
        listen(false);
        dragging = false;
        root.classList.remove('is-through');
        root.classList.remove('is-open');
        clearTimeout(fadeTimer);
        const done = () => { if (!cur) root.hidden = true; };
        if (reducedMotion()) done(); else fadeTimer = setTimeout(done, FADE);
        // Give focus back, unless the player has moved it somewhere else meanwhile.
        const a = document.activeElement;
        if (s.returnFocus && s.returnFocus.isConnected && (!a || a === document.body || root.contains(a))) {
            try { s.returnFocus.focus({ preventScroll: true }); } catch (e) { }
        } else if (root.contains(a)) a.blur();
        if (!s.closed) {
            s.closed = true;
            if (typeof s.opts.onClose === 'function') {
                try { s.opts.onClose(reason); } catch (e) { console.error(e); }
            }
        }
    }

    function hide() { close('hide'); }
    function isOpen() { return !!cur; }

    async function show(target, opts) {
        opts = opts || {};
        const id = ++seq;
        const byName = typeof target === 'string';
        if (byName && !targets) await loadTargets();
        if (id !== seq) return false;            // another show() came in meanwhile
        build();

        // One spotlight at a time: a new one replaces the old without a fade.
        const prev = cur;
        let returnFocus = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
        if (prev) {
            returnFocus = prev.returnFocus;
            stopFollowing();
            undescribe(prev);
            cur = null;
            if (!prev.closed) {
                prev.closed = true;
                if (typeof prev.opts.onClose === 'function') {
                    try { prev.opts.onClose('replaced'); } catch (e) { console.error(e); }
                }
            }
        } else listen(true);

        const t = byName && targets ? targets[target] : null;
        const label = t ? t.label : '';
        let el = byName ? resolve(target) : (target instanceof Element && isVisible(target) ? target : null);
        if (el) {
            try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { }
            await new Promise(r => requestAnimationFrame(() => r()));
            if (id !== seq) return false;
            if (byName) el = resolve(target) || el;
            if (!el.isConnected) el = null;
        }

        cur = { id, name: byName ? target : null, el: null, ringEl: null, opts, returnFocus, closed: false };
        clearTimeout(fadeTimer);
        fill(opts, label);
        els.note.textContent = `${cap(label || 'that control')} isn't on screen right now.`;
        root.classList.toggle('is-pass', !!opts.passThrough);
        retarget(el);
        const wasHidden = root.hidden;
        root.hidden = false;
        layout();
        if (wasHidden || !root.classList.contains('is-open')) {
            if (reducedMotion()) root.classList.add('is-open');
            else { void root.offsetWidth; root.classList.add('is-open'); }
        }
        startFollowing();
        if (opts.focus !== false) {
            const first = els.actions.querySelector('[data-primary]') || els.actions.querySelector('button');
            if (first) try { first.focus({ preventScroll: true }); } catch (e) { }
        }
        return !!el;
    }

    return { setTargets, loadTargets, resolve, show, hide, isOpen };
})();
