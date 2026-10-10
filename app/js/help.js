// Help (Feature 57, M1): the in-app manual. Drawer on desktop, full-screen sheet on phones.
// docs/ARCH-help-and-tour.md §6. Reads app/help/manual.json (built by tools/help.mjs).
//
// Contract:
//   DojoHelp.load() -> Promise<manual>   (fetched once, cached; tours and spotlight may use it)
//   DojoHelp.open(articleId?, slug?)     (no id: the contents)
//   DojoHelp.close(), DojoHelp.toggle(), DojoHelp.isOpen()
//   DojoHelp.device() -> 'desktop'|'phone'   (the layout in use, max-width 760px = phone)
// Loaded as a classic script in <head>: no DOM work until the page has loaded or help is used.
//
// Also (hooks for app/index.html):
//   DojoHelp.onKey(e) -> true when handled   (the app's global keydown: ? toggles, Esc, /)
//   DojoHelp.openFromHash() -> true when the URL is #help, #help/<id> or #help/<id>/<slug>
//   toggle() reopens on the last article; the article and the device switch last for the page's life.
window.DojoHelp = (function () {
    'use strict';

    const MANUAL_URL = 'help/manual.json';
    const STORE_KEY = 'lorcana_dojo_help';
    const PHONE_MQ = '(max-width: 760px)';
    const LIMIT = 12;
    const DEBOUNCE = 80;
    const NAME = { desktop: 'desktop', phone: 'phone' };
    const GESTURES = { 'tap': 'Tap', 'double-tap': 'Double tap', 'long-press': 'Long press', 'swipe': 'Swipe', 'drag': 'Drag', 'pinch': 'Pinch' };

    let manual = null;
    let loading = null;
    let byId = {};
    let sectionById = {};
    let index = null;

    let root = null;
    const els = {};
    let openFlag = false;
    let dev = null;                 // the Desktop · Phone switch
    let view = 'contents';          // 'contents' | 'article'
    let articleId = null;
    let articleSlug = null;
    let contentsScroll = 0;
    let query = '';
    let results = [];
    let active = -1;
    let searchTimer = 0;
    let lastFocus = null;
    let litTimer = 0;

    // ---------- Devices (ARCH §4) ----------
    const mq = (q) => !!(window.matchMedia && window.matchMedia(q).matches);
    function device() { return mq(PHONE_MQ) ? 'phone' : 'desktop'; }
    // The input tag follows the layout, except on a real tablet (desktop layout, no hover),
    // where Desktop keeps touch.
    function tagsFor(layout) {
        const tablet = !mq(PHONE_MQ) && mq('(hover: none)');
        return new Set([layout, layout === 'phone' || tablet ? 'touch' : 'mouse']);
    }
    const otherOf = (d) => (d === 'desktop' ? 'phone' : 'desktop');

    // ---------- The bundle ----------
    function load() {
        if (manual) return Promise.resolve(manual);
        if (!loading) {
            loading = fetch(MANUAL_URL)
                .then((r) => { if (!r.ok) throw new Error(`help/manual.json: HTTP ${r.status}`); return r.json(); })
                .then((m) => {
                    manual = m;
                    byId = {};
                    sectionById = {};
                    (m.sections || []).forEach((s) => { sectionById[s.id] = s; });
                    (m.articles || []).forEach((a) => { byId[a.id] = a; });
                    const S = window.DojoSpotlight;
                    if (S && typeof S.setTargets === 'function') {
                        try { S.setTargets(m.targets || {}); } catch (e) { console.error('DojoSpotlight.setTargets', e); }
                    }
                    return m;
                })
                .catch((e) => { loading = null; throw e; });
        }
        return loading;
    }

    function readProgress() {
        try {
            const v = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
            return v && typeof v === 'object' && v.done && typeof v.done === 'object' ? v.done : {};
        } catch (e) { return {}; }
    }

    // ---------- DOM helpers ----------
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        if (attrs) {
            for (const k in attrs) {
                const v = attrs[k];
                if (v == null || v === false) continue;
                if (k === 'class') el.className = v;
                else if (k === 'text') el.textContent = v;
                else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
                else el.setAttribute(k, v === true ? '' : v);
            }
        }
        for (const kid of kids.flat()) {
            if (kid == null || kid === false) continue;
            el.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
        }
        return el;
    }
    const icon = (cls) => h('i', { class: cls, 'aria-hidden': 'true' });
    const isVisible = (el) => !!(el && el.isConnected && el.getClientRects().length);

    function ensureDom() {
        if (root) return;
        els.label = h('span', { class: 'help-lbl', id: 'help-label', text: 'Help' });
        els.seg = h('div', { class: 'seg help-dev', role: 'group', 'aria-label': 'Instructions for' },
            h('button', { type: 'button', 'data-dev': 'desktop', 'aria-pressed': 'false', text: 'Desktop' }),
            h('button', { type: 'button', 'data-dev': 'phone', 'aria-pressed': 'false', text: 'Phone' }));
        els.close = h('button', { type: 'button', class: 'help-x', 'aria-label': 'Close help', title: 'Close (Esc)' },
            icon('fa-solid fa-xmark'));
        els.q = h('input', {
            type: 'search', id: 'help-q', class: 'help-q-input', placeholder: 'Search the manual',
            enterkeyhint: 'search', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
            role: 'combobox', 'aria-autocomplete': 'list', 'aria-expanded': 'false', 'aria-controls': 'help-results',
            'aria-label': 'Search the manual'
        });
        els.search = h('div', { class: 'help-search', role: 'search' },
            icon('fa-solid fa-magnifying-glass help-search-ico'), els.q,
            h('kbd', { class: 'help-key help-slash', title: 'Press / to search', 'aria-hidden': 'true', text: '/' }));
        els.body = h('div', { class: 'help-body', id: 'help-body' });
        els.mod = h('div', { class: 'help-mod', tabindex: '-1' },
            h('header', { class: 'help-hd' }, els.label, els.seg, els.close), els.search, els.body);
        root = h('aside', { id: 'help-drawer', class: 'help-drawer', hidden: true }, els.mod);
        document.body.appendChild(root);

        els.close.addEventListener('click', () => close());
        els.seg.addEventListener('click', (e) => {
            const b = e.target.closest('button[data-dev]');
            if (b) setDev(b.getAttribute('data-dev'));
        });
        els.q.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => setQuery(els.q.value, true), DEBOUNCE);
        });
        root.addEventListener('keydown', onDrawerKey);
        root.addEventListener('click', onDrawerClick);

        if (window.matchMedia) {
            const m = window.matchMedia(PHONE_MQ);
            const onChange = () => { if (openFlag) applyMode(); };
            if (m.addEventListener) m.addEventListener('change', onChange); else if (m.addListener) m.addListener(onChange);
        }
    }

    // Desktop: a non-modal side drawer. Phones: a full-screen modal sheet.
    function applyMode() {
        const phone = device() === 'phone';
        root.classList.toggle('is-sheet', phone);
        if (phone) {
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.setAttribute('aria-labelledby', 'help-label');
            root.removeAttribute('aria-label');
        } else {
            root.setAttribute('role', 'complementary');
            root.removeAttribute('aria-modal');
            root.removeAttribute('aria-labelledby');
            root.setAttribute('aria-label', 'Help');
        }
    }

    function syncSwitch() {
        els.seg.querySelectorAll('button[data-dev]').forEach((b) => {
            b.setAttribute('aria-pressed', b.getAttribute('data-dev') === dev ? 'true' : 'false');
        });
    }

    function syncOpeners() {
        document.body.classList.toggle('help-open', openFlag);
        ['btn-help', 'btn-home-help'].forEach((id) => {
            const b = document.getElementById(id);
            if (b) b.setAttribute('aria-expanded', openFlag ? 'true' : 'false');
        });
    }

    // ---------- Open / close ----------
    function open(id, slug) {
        ensureDom();
        if (!dev) { dev = device(); syncSwitch(); }
        const wasOpen = openFlag;
        if (!wasOpen) {
            lastFocus = document.activeElement;
            openFlag = true;
            applyMode();
            root.hidden = false;
            syncOpeners();
            if (!manual) els.body.replaceChildren(h('p', { class: 'help-note', text: 'Opening the manual…' }));
        }
        return load().then(() => {
            if (!openFlag) return;
            if (query) setQuery('', false);
            if (id && byId[id]) showArticle(id, slug || null);
            else showContents();
            if (!wasOpen) focusOnOpen();
        }).catch((e) => {
            console.error('Help:', e);
            if (!openFlag) return;
            els.body.replaceChildren(h('p', { class: 'help-note', text: "The manual didn't load. Check your connection and try again." }));
            if (!wasOpen) focusOnOpen();
        });
    }

    function focusOnOpen() {
        // Desktop: straight into the search. Phones: no keyboard over the contents.
        if (device() === 'phone') els.mod.focus({ preventScroll: true });
        else els.q.focus({ preventScroll: true });
    }

    function close() {
        if (!openFlag) return;
        openFlag = false;
        clearTimeout(searchTimer);
        const hadFocus = root.contains(document.activeElement);
        root.hidden = true;
        syncOpeners();
        if (/^#help\b/.test(location.hash)) {
            try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { }
        }
        if (hadFocus) {
            if (isVisible(lastFocus) && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
            else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
        }
        lastFocus = null;
    }

    function toggle() {
        if (openFlag) { close(); return; }
        // Reopen where the player left off (remembered for the page's life, ARCH §6.2).
        if (articleId && view === 'article') open(articleId);
        else open();
    }

    function setHash() {
        if (!openFlag) return;
        const want = view === 'article' && articleId
            ? `#help/${articleId}${articleSlug ? '/' + articleSlug : ''}` : '#help';
        if (location.hash === want) return;
        try { history.replaceState(history.state, '', location.pathname + location.search + want); } catch (e) { }
    }

    function openFromHash() {
        const m = /^#help(?:\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?)?\/?$/.exec(location.hash || '');
        if (!m) return false;
        open(m[1] || null, m[2] || null);
        return true;
    }

    function setDev(d) {
        if (d !== 'desktop' && d !== 'phone') return;
        if (d === dev) return;
        dev = d;
        syncSwitch();
        if (!manual) return;
        if (query) runSearch();
        else if (view === 'article') renderArticle(false);
        else renderContents();
    }

    // ---------- Contents ----------
    function showContents() {
        view = 'contents';
        articleSlug = null;
        renderContents();
        els.body.scrollTop = contentsScroll;
        setHash();
    }

    function articleRow(a, opts) {
        const only = a.devices && a.devices.length === 1 && a.devices[0] !== dev ? a.devices[0] : null;
        return h('li', null,
            h('a', {
                class: 'help-row' + (a.todo ? ' is-todo' : ''), href: `#help/${a.id}`, 'data-article': a.id
            },
                h('span', { class: 'help-row-t' }, a.title,
                    only ? h('span', { class: 'help-tag', text: `${NAME[only]} only` }) : null,
                    a.todo ? h('span', { class: 'help-tag', text: 'Being written' }) : null),
                opts && opts.summary === false ? null : h('span', { class: 'help-row-s', text: a.summary || '' })));
    }

    function renderContents() {
        const kids = [];
        const tours = (manual && manual.tours) || [];
        if (tours.length) {
            const done = readProgress();
            const canStart = !!(window.DojoTour && typeof window.DojoTour.start === 'function');
            kids.push(h('section', { class: 'help-grp', 'aria-labelledby': 'help-grp-tours' },
                h('h3', { class: 'help-lbl', id: 'help-grp-tours', text: 'Tours' }),
                h('ul', { class: 'help-list' }, tours.map((t) => h('li', null,
                    h('button', {
                        type: 'button', class: 'help-row help-tour', 'data-tour': t.id, disabled: !canStart,
                        title: canStart ? null : 'Tours are coming soon'
                    },
                        h('span', { class: 'help-row-t' }, t.title || t.id,
                            t.minutes ? h('span', { class: 'help-row-m', text: `· ${t.minutes} min` }) : null),
                        done[t.id] ? h('span', { class: 'help-done', title: 'Done', 'aria-label': 'Done', text: '✓' }) : null))))));
        }
        (manual.sections || []).forEach((s) => {
            const arts = (s.articles || []).map((id) => byId[id]).filter(Boolean);
            if (!arts.length) return;
            kids.push(h('section', { class: 'help-grp', 'aria-labelledby': `help-grp-${s.id}` },
                h('h3', { class: 'help-lbl', id: `help-grp-${s.id}`, text: s.title }),
                h('ul', { class: 'help-list' }, arts.map((a) => articleRow(a)))));
        });
        els.body.replaceChildren(h('nav', { class: 'help-toc', 'aria-label': 'Manual contents' }, kids));
    }

    // ---------- Article ----------
    function showArticle(id, slug) {
        if (view === 'contents') contentsScroll = els.body.scrollTop;
        view = 'article';
        articleId = id;
        articleSlug = slug || null;
        renderArticle(true);
        setHash();
    }

    function renderArticle(scroll) {
        const a = byId[articleId];
        if (!a) { showContents(); return; }
        const sec = sectionById[a.section];
        const only = a.devices && a.devices.length === 1 && a.devices[0] !== dev ? a.devices[0] : null;
        const prose = h('div', { class: 'help-prose' });
        if (a.todo) {
            prose.appendChild(h('p', { class: 'help-lead', text: a.summary || '' }));
            prose.appendChild(h('p', { class: 'help-note', text: 'This article is being written.' }));
        } else {
            renderBody(a, prose);
        }
        const rel = (a.related || []).map((r) => byId[r]).filter(Boolean);
        const art = h('article', { class: 'help-art', 'aria-labelledby': 'help-art-title' },
            h('a', { class: 'help-back', href: '#help', 'data-back': '' }, icon('fa-solid fa-chevron-left'),
                h('span', { text: sec ? sec.title : 'Contents' })),
            h('h2', { class: 'help-art-t', id: 'help-art-title', tabindex: '-1' }, a.title),
            only ? h('p', { class: 'help-only' }, h('span', { class: 'help-tag', text: `${NAME[only]} only` })) : null,
            prose,
            rel.length ? h('footer', { class: 'help-rel' },
                h('h3', { class: 'help-lbl', text: 'Related' }),
                h('ul', { class: 'help-list' }, rel.map((r) => articleRow(r, { summary: false })))) : null);
        const keep = scroll ? 0 : els.body.scrollTop;
        els.body.replaceChildren(art);
        if (scroll && articleSlug) lightHeading(articleSlug);
        else els.body.scrollTop = keep;
    }

    function lightHeading(slug) {
        const el = els.body.querySelector(`[data-slug="${CSS.escape(slug)}"]`);
        if (!el) { els.body.scrollTop = 0; return; }
        const top = el.getBoundingClientRect().top - els.body.getBoundingClientRect().top + els.body.scrollTop - 8;
        els.body.scrollTop = Math.max(0, top);
        clearTimeout(litTimer);
        els.body.querySelectorAll('.is-lit').forEach((x) => x.classList.remove('is-lit'));
        el.classList.add('is-lit');
        litTimer = setTimeout(() => el.classList.remove('is-lit'), 1600);
    }

    // The rendering pipeline (ARCH §6.4): device blocks, then placeholders for the
    // extensions, then marked + DOMPurify, then the real elements.
    function renderBody(a, into) {
        const cur = tagsFor(dev);
        const oth = tagsFor(otherOf(dev));
        const ph = [];
        const P = (o) => `${ph.push(o) - 1}`;
        const matches = (tags, set) => tags.every((t) => set.has(t));

        // 1. Device blocks. Headings are numbered in source order, as tools/help.mjs
        //    numbers them, so each keeps the slug from the bundle even when a block drops.
        const out = [];
        let inFence = false;
        let block = null;
        let group = null;          // consecutive device blocks
        let hIdx = 0;
        const flush = () => {
            if (group && !group.kept && group.other) out.push('', P({ type: 'other' }), '');
            group = null;
        };
        for (const line of a.body.split('\n')) {
            if (/^```/.test(line)) inFence = !inFence;
            if (!inFence) {
                const o = !block && /^:::\s*([a-z][a-z \t]*?)\s*$/.exec(line);
                if (o) {
                    const tags = o[1].split(/\s+/).filter(Boolean);
                    block = { keep: matches(tags, cur) };
                    if (!group) group = { kept: false, other: false };
                    group.kept = group.kept || block.keep;
                    group.other = group.other || matches(tags, oth);
                    continue;
                }
                if (block && /^:::\s*$/.test(line)) { block = null; continue; }
            }
            if (!block && group && line.trim()) flush();
            const hd = !inFence && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
            if (hd) {
                const k = hIdx++;
                if (!block || block.keep) out.push(`${hd[1]} ${hd[2]} ${k}`);
                continue;
            }
            if (!block || block.keep) out.push(line);
        }
        flush();
        let src = out.join('\n');

        // 2. Extensions to placeholders: keys and gestures first, so a link label can hold them.
        src = src.replace(/\{key:([^}\n]+)\}/g, (m, k) => P({ type: 'key', keys: k.trim() }));
        src = src.replace(/\{gesture:([a-z-]+)\}/g, (m, g) => P({ type: 'gesture', name: g }));
        src = src.replace(/\[([^\]\n]+)\]\((show|help):([^)\s]+)\)/g,
            (m, label, kind, ref) => P({ type: kind, label, ref }));

        // 3. Markdown, sanitised like every Markdown path in the app.
        let html;
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
            html = DOMPurify.sanitize(marked.parse(src));
            into.innerHTML = html;
        } else {
            into.appendChild(h('pre', { class: 'help-raw', text: src }));
        }

        // 4. Placeholders to elements; headings get their bundle slugs.
        swap(into, ph, a);
        into.querySelectorAll('img').forEach((img) => {
            const s = img.getAttribute('src') || '';
            if (s && !/^(?:[a-z]+:|\/|#)/i.test(s)) img.setAttribute('src', 'help/' + s.replace(/^\.\//, ''));
            img.setAttribute('loading', 'lazy');
        });
        into.querySelectorAll('a[href]').forEach((el) => {
            if (/^https?:/i.test(el.getAttribute('href'))) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
        });
        finishShowTools(into);
        // A placeholder that stands alone in a paragraph is a block: drop the <p>.
        into.querySelectorAll('p > .help-other').forEach((el) => {
            const p = el.parentElement;
            if (p.textContent.trim() === el.textContent.trim()) p.replaceWith(el);
        });
    }

    function swap(scope, ph, a) {
        const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
        const hits = [];
        while (walker.nextNode()) if (/[]/.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode);
        hits.forEach((t) => {
            const parent = t.parentElement;
            const frag = document.createDocumentFragment();
            t.nodeValue.split(/(\d+|\d+)/).forEach((part) => {
                if (!part) return;
                let m = /^(\d+)$/.exec(part);
                if (m) { frag.appendChild(buildPlaceholder(ph[+m[1]], ph, a)); return; }
                m = /^(\d+)$/.exec(part);
                if (m) {
                    const hd = parent && parent.closest('h1, h2, h3, h4, h5, h6');
                    const info = a.headings && a.headings[+m[1]];
                    if (hd && info) { hd.id = `help-h-${info.slug}`; hd.setAttribute('data-slug', info.slug); }
                    return;
                }
                frag.appendChild(document.createTextNode(part));
            });
            t.replaceWith(frag);
        });
        scope.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((hd) => {
            const last = hd.lastChild;
            if (last && last.nodeType === 3) last.nodeValue = last.nodeValue.replace(/\s+$/, '');
        });
    }

    function inline(md, ph, a) {
        const span = document.createElement('span');
        if (typeof marked !== 'undefined' && marked.parseInline && typeof DOMPurify !== 'undefined') {
            span.innerHTML = DOMPurify.sanitize(marked.parseInline(md));
        } else span.textContent = md;
        swap(span, ph, a);
        return span;
    }

    function buildPlaceholder(o, ph, a) {
        if (!o) return document.createTextNode('');
        if (o.type === 'key') return keycaps(o.keys);
        if (o.type === 'gesture') {
            return h('span', { class: 'help-gest' }, icon('fa-solid fa-hand-pointer'),
                GESTURES[o.name] || o.name.replace(/-/g, ' '));
        }
        if (o.type === 'help') {
            const [id, slug] = String(o.ref).split('#');
            const link = h('a', {
                class: 'help-link', href: `#help/${id}${slug ? '/' + slug : ''}`, 'data-article': id, 'data-slug': slug || null
            });
            link.appendChild(inline(o.label, ph, a));
            return link;
        }
        if (o.type === 'show') {
            const b = h('button', { type: 'button', class: 'help-show', 'data-show': o.ref },
                icon('fa-solid fa-location-crosshairs'));
            b.appendChild(inline(o.label, ph, a));
            return b;
        }
        if (o.type === 'other') {
            const other = otherOf(dev);
            return h('p', { class: 'help-other' },
                `On a ${NAME[other]} this works differently · `,
                h('button', { type: 'button', class: 'help-other-go', 'data-dev': other, text: `Show ${NAME[other]}` }));
        }
        return document.createTextNode('');
    }

    // {key:Shift+?} is two keycaps; {key:+} is the plus key.
    function keycaps(spec) {
        const parts = spec.length > 1 ? spec.split(/\+(?=.)/).filter(Boolean) : [spec];
        const wrap = h('span', { class: 'help-keys' });
        parts.forEach((p, i) => {
            if (i) wrap.appendChild(document.createTextNode('+'));
            wrap.appendChild(h('kbd', { class: 'help-key', text: p }));
        });
        return wrap;
    }

    // "Show me" works when the spotlight is built, the switch is on this device and
    // the target is on screen; otherwise the tool goes (an inline label stays as words).
    function canShow(target) {
        const S = window.DojoSpotlight;
        if (!S || typeof S.show !== 'function') return false;
        if (dev !== device()) return false;
        if (typeof S.resolve === 'function') {
            try { return S.resolve(target) != null; } catch (e) { return false; }
        }
        return true;
    }

    function finishShowTools(scope) {
        const targets = (manual && manual.targets) || {};
        scope.querySelectorAll('.help-show').forEach((btn) => {
            const target = btn.getAttribute('data-show');
            const label = btn.textContent.replace(/\s+/g, ' ').trim();
            const generic = /^show me$/i.test(label);
            const block = btn.closest('li, p, td, th, blockquote');
            if (!canShow(target)) {
                if (block && block.textContent.trim() === btn.textContent.trim()) block.remove();
                else if (generic) btn.remove();
                else btn.replaceWith(...btn.lastChild.childNodes);
                return;
            }
            // The callout says the sentence the tool sits in, or the paragraph before it.
            let text = '';
            if (block) {
                const c = block.cloneNode(true);
                c.querySelectorAll('.help-show').forEach((s) => {
                    if (/^show me$/i.test(s.textContent.trim())) s.remove(); else s.replaceWith(s.textContent);
                });
                text = c.textContent.replace(/\s+/g, ' ').trim();
                if (!text) {
                    let prev = block.previousElementSibling;
                    while (prev && !prev.textContent.trim()) prev = prev.previousElementSibling;
                    if (prev && !/^H\d$/.test(prev.tagName)) text = prev.textContent.replace(/\s+/g, ' ').trim();
                }
            }
            if (!text) text = (targets[target] && targets[target].label) || label;
            if (text.length > 280) text = text.slice(0, 277).replace(/\s+\S*$/, '') + '…';
            btn.setAttribute('data-text', text);
            if (generic) btn.setAttribute('aria-label', `Show me: ${text}`);
        });
    }

    function showMe(target, text) {
        const S = window.DojoSpotlight;
        if (!S || typeof S.show !== 'function') return;
        const go = () => { try { S.show(target, { text }); } catch (e) { console.error('DojoSpotlight.show', e); } };
        if (device() === 'phone') { close(); requestAnimationFrame(go); } else go();
    }

    // ---------- Search ----------
    function plain(md) {
        return String(md || '')
            .replace(/^:::.*$/gm, ' ')
            .replace(/\{key:([^}\n]+)\}/g, '$1')
            .replace(/\{gesture:([a-z-]+)\}/g, (m, g) => g.replace(/-/g, ' '))
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/^\s*(?:[-+*]|\d+\.)\s+/gm, '')
            .replace(/[*_`>|]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Until DojoHelpSearch (M2) is built: a plain substring filter with the same result shape.
    function buildBasic() {
        const recs = [];
        (manual.articles || []).forEach((a) => {
            const section = (sectionById[a.section] || {}).title || '';
            const aliases = (a.aliases || []).join(' ');
            const chunks = [{ anchor: '', heading: '', lines: [] }];
            let inFence = false;
            let hIdx = 0;
            if (!a.todo) {
                a.body.split('\n').forEach((line) => {
                    if (/^```/.test(line)) inFence = !inFence;
                    const hd = !inFence && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
                    if (hd) {
                        const info = (a.headings || [])[hIdx++];
                        chunks.push({ anchor: info ? info.slug : '', heading: plain(hd[2]), lines: [] });
                    } else chunks[chunks.length - 1].lines.push(line);
                });
            }
            chunks.forEach((c, i) => {
                const text = i === 0 ? [a.summary, plain(c.lines.join('\n'))].filter(Boolean).join(' ') : plain(c.lines.join('\n'));
                if (i > 0 && !text && !c.heading) return;
                recs.push({
                    id: `${a.id}#${c.anchor}`, article: a.id, anchor: c.anchor, title: a.title, heading: c.heading,
                    section, devices: a.devices || [], aliases, text,
                    hay: [a.title, c.heading, aliases, text].join(' \u0001 ').toLowerCase()
                });
            });
        });
        return recs;
    }

    function basicQuery(recs, q, limit) {
        const words = q.toLowerCase().split(/\s+/).filter(Boolean);
        if (!words.length) return [];
        const out = [];
        recs.forEach((r) => {
            if (!words.every((w) => r.hay.includes(w))) return;
            const ql = q.toLowerCase().trim();
            let score = r.title.toLowerCase().includes(ql) ? 0 : r.heading.toLowerCase().includes(ql) ? 1
                : r.aliases.toLowerCase().includes(ql) ? 1.5 : 2;
            if (r.anchor) score += 0.1;
            const otherDevice = r.devices.length === 1 && r.devices[0] !== dev;
            if (otherDevice) score += 0.5;
            out.push({
                id: r.id, article: r.article, anchor: r.anchor, title: r.title, heading: r.heading,
                section: r.section, otherDevice, score, snippet: snippetFor(r.text, words)
            });
        });
        return out.sort((x, y) => x.score - y.score).slice(0, limit);
    }

    function snippetFor(text, words) {
        const low = text.toLowerCase();
        let at = -1;
        words.forEach((w) => { const i = low.indexOf(w); if (i >= 0 && (at < 0 || i < at)) at = i; });
        let start = 0;
        let end = Math.min(text.length, 140);
        if (at > 50) { start = text.lastIndexOf(' ', at - 40) + 1; end = Math.min(text.length, start + 140); }
        let s = text.slice(start, end);
        const pre = start > 0 ? '…' : '';
        const post = end < text.length ? '…' : '';
        s = pre + s + post;
        const ranges = [];
        const sl = s.toLowerCase();
        words.forEach((w) => {
            let i = sl.indexOf(w);
            while (i >= 0) { ranges.push([i, i + w.length - 1]); i = sl.indexOf(w, i + w.length); }
        });
        ranges.sort((x, y) => x[0] - y[0]);
        return { text: s, ranges };
    }

    function searchApi() {
        const S = window.DojoHelpSearch;
        return S && typeof S.build === 'function' && typeof S.query === 'function' ? S : null;
    }

    function runQuery(q) {
        const S = searchApi();
        if (!index) {
            if (S) {
                try { index = { kind: 'search', data: S.build(manual, { Fuse: window.Fuse }) }; }
                catch (e) { console.error('DojoHelpSearch.build', e); index = { kind: 'basic', data: buildBasic() }; }
            } else index = { kind: 'basic', data: buildBasic() };
        }
        if (index.kind === 'search') {
            try { return (S.query(index.data, q, { device: dev, limit: LIMIT }) || []).slice(0, LIMIT); }
            catch (e) { console.error('DojoHelpSearch.query', e); return []; }
        }
        return basicQuery(index.data, q, LIMIT);
    }

    function setQuery(q, fromInput) {
        query = String(q || '');
        if (!fromInput && els.q.value !== query) els.q.value = query;
        if (query.trim()) runSearch();
        else endSearch();
    }

    function endSearch() {
        results = [];
        active = -1;
        els.q.setAttribute('aria-expanded', 'false');
        els.q.removeAttribute('aria-activedescendant');
        if (!manual) return;
        if (view === 'article' && byId[articleId]) renderArticle(false);
        else renderContents();
    }

    function runSearch() {
        if (!manual) return;
        const q = query.trim();
        results = runQuery(q);
        active = results.length ? 0 : -1;
        if (!results.length) { renderNoResults(q); return; }
        const list = h('ul', { class: 'help-results', id: 'help-results', role: 'listbox', 'aria-label': 'Results' },
            results.map((r, i) => {
                const path = r.anchor && r.heading ? `${r.section} › ${r.title}` : r.section;
                return h('li', {
                    class: 'help-res', role: 'option', id: `help-opt-${i}`, 'data-i': String(i),
                    'aria-selected': i === active ? 'true' : 'false'
                },
                    h('span', { class: 'help-res-path', text: path || '' }),
                    h('span', { class: 'help-res-h' }, (r.anchor && r.heading) || r.title,
                        r.otherDevice ? h('span', { class: 'help-tag', text: NAME[otherOf(dev)] }) : null),
                    r.snippet && r.snippet.text ? marked_(r.snippet) : null);
            }));
        els.body.replaceChildren(list);
        els.body.scrollTop = 0;
        els.q.setAttribute('aria-expanded', 'true');
        syncActive();
    }

    // A snippet with its matched ranges in ink weight. Text only: never innerHTML.
    function marked_(snip) {
        const t = String(snip.text || '');
        const el = h('span', { class: 'help-res-s' });
        const ranges = (snip.ranges || []).map(([s, e]) => [Math.max(0, s), Math.min(t.length - 1, e)])
            .filter(([s, e]) => e >= s).sort((x, y) => x[0] - y[0]);
        let pos = 0;
        ranges.forEach(([s, e]) => {
            if (s < pos) s = pos;
            if (e < s) return;
            if (s > pos) el.appendChild(document.createTextNode(t.slice(pos, s)));
            el.appendChild(h('mark', { text: t.slice(s, e + 1) }));
            pos = e + 1;
        });
        if (pos < t.length) el.appendChild(document.createTextNode(t.slice(pos)));
        return el;
    }

    function renderNoResults(q) {
        els.q.setAttribute('aria-expanded', 'false');
        els.q.removeAttribute('aria-activedescendant');
        const S = searchApi();
        let ids = [];
        if (S && typeof S.suggest === 'function' && index && index.kind === 'search') {
            try { ids = S.suggest(index.data, q, { limit: 3 }) || []; } catch (e) { ids = []; }
        }
        const sugg = ids.map((id) => byId[id]).filter(Boolean);
        els.body.replaceChildren(h('div', { class: 'help-none', role: 'status' },
            h('p', { class: 'help-note' }, 'Nothing in the manual for ', h('b', { text: `“${q}”` }), '.'),
            sugg.length ? h('h3', { class: 'help-lbl', text: 'Closest' }) : null,
            sugg.length ? h('ul', { class: 'help-list' }, sugg.map((a) => articleRow(a))) : null,
            h('button', { type: 'button', class: 'help-browse', 'data-browse': '' }, 'Browse the sections')));
    }

    function syncActive() {
        const opts = els.body.querySelectorAll('.help-res');
        opts.forEach((o, i) => {
            o.setAttribute('aria-selected', i === active ? 'true' : 'false');
            o.classList.toggle('is-active', i === active);
        });
        if (active >= 0 && opts[active]) {
            els.q.setAttribute('aria-activedescendant', opts[active].id);
            const o = opts[active];
            const b = els.body.getBoundingClientRect();
            const r = o.getBoundingClientRect();
            if (r.top < b.top) els.body.scrollTop -= b.top - r.top + 4;
            else if (r.bottom > b.bottom) els.body.scrollTop += r.bottom - b.bottom + 4;
        } else els.q.removeAttribute('aria-activedescendant');
    }

    function openResult(i) {
        const r = results[i];
        if (!r) return;
        const id = r.article;
        const slug = r.anchor || null;
        query = '';
        els.q.value = '';
        results = [];
        active = -1;
        els.q.setAttribute('aria-expanded', 'false');
        els.q.removeAttribute('aria-activedescendant');
        showArticle(id, slug);
    }

    // ---------- Events ----------
    function onDrawerClick(e) {
        const t = e.target;
        const res = t.closest('.help-res');
        if (res) { openResult(+res.getAttribute('data-i')); return; }
        const art = t.closest('a[data-article]');
        if (art && !(e.metaKey || e.ctrlKey || e.shiftKey || e.button)) {
            e.preventDefault();
            if (query) { query = ''; els.q.value = ''; els.q.setAttribute('aria-expanded', 'false'); }
            showArticle(art.getAttribute('data-article'), art.getAttribute('data-slug') || null);
            const title = document.getElementById('help-art-title');
            if (title && !art.getAttribute('data-slug') && e.detail === 0) title.focus({ preventScroll: true });
            return;
        }
        if (t.closest('[data-back]')) { e.preventDefault(); showContents(); return; }
        if (t.closest('[data-browse]')) { setQuery('', false); showContents(); return; }
        const other = t.closest('.help-other-go');
        if (other) { setDev(other.getAttribute('data-dev')); return; }
        const show = t.closest('.help-show');
        if (show) { showMe(show.getAttribute('data-show'), show.getAttribute('data-text') || ''); return; }
        const tour = t.closest('.help-tour');
        if (tour && !tour.disabled && window.DojoTour && typeof window.DojoTour.start === 'function') {
            const id = tour.getAttribute('data-tour');
            close();
            try { window.DojoTour.start(id); } catch (err) { console.error('DojoTour.start', err); }
        }
    }

    const typing = (el) => !!(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable));

    // Keys inside help stay inside help: the app's game hotkeys never see them.
    function onDrawerKey(e) {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const inSearch = e.target === els.q;
        if (e.key === 'Escape') { e.preventDefault(); escape(); return; }
        if (inSearch) {
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length) {
                e.preventDefault();
                const n = results.length;
                active = e.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n;
                syncActive();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimer);
                if (els.q.value !== query) setQuery(els.q.value, true);
                if (results.length) openResult(active >= 0 ? active : 0);
                else if (device() === 'phone') els.q.blur();
                return;
            }
            if (e.key === 'Backspace' && !els.q.value && view === 'article') { e.preventDefault(); showContents(); }
            return;
        }
        if (e.key === 'Tab' && root.classList.contains('is-sheet')) { trapTab(e); return; }
        if (typing(e.target)) return;
        if (e.key === '/') { e.preventDefault(); els.q.focus(); return; }
        if (e.key === '?') { e.preventDefault(); close(); }
    }

    function trapTab(e) {
        const f = Array.from(root.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'))
            .filter(isVisible);
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === els.mod)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // Esc: clear the search, then back from an article, then close.
    function escape() {
        if (query || els.q.value) { clearTimeout(searchTimer); setQuery('', false); return; }
        if (view === 'article') {
            const back = root.contains(document.activeElement);
            showContents();
            if (back && device() !== 'phone') els.q.focus({ preventScroll: true });
            return;
        }
        close();
    }

    // The app's global keydown (focus outside help, not typing): true = handled.
    function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return false;
        if (typing(document.activeElement)) return false;
        if (e.key === '?') { e.preventDefault(); toggle(); return true; }
        if (!openFlag) return false;
        if (e.key === 'Escape') { e.preventDefault(); escape(); return true; }
        if (e.key === '/' && !root.classList.contains('is-sheet')) { e.preventDefault(); els.q.focus(); return true; }
        return false;
    }

    // Help in context (ARCH §6.5): any [data-help="<id>"] opens that article.
    function onDocClick(e) {
        const el = e.target && e.target.closest ? e.target.closest('[data-help]') : null;
        if (!el || (root && root.contains(el))) return;
        e.preventDefault();
        open(el.getAttribute('data-help') || null);
    }

    if (typeof document !== 'undefined') {
        document.addEventListener('click', onDocClick, true);
        window.addEventListener('hashchange', () => { openFromHash(); });
    }

    return {
        load,
        open,
        close,
        toggle,
        isOpen: () => openFlag,
        device,
        onKey,
        openFromHash
    };
})();
