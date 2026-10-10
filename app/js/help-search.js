// Help search (Feature 57, M2): fuzzy search over the manual's sections.
// docs/ARCH-help-and-tour.md §6.3. Pure: no DOM, so tools/help.mjs --test runs it in Node.
//
// Contract (M1's viewer calls these):
//   DojoHelpSearch.build(manual, { Fuse }) -> index
//       manual: app/help/manual.json. Fuse defaults to the global one (fuse.js 6.6.2).
//   DojoHelpSearch.query(index, q, { device: 'desktop'|'phone', limit: 12 }) -> [{
//       id,            // 'inkwell#ready-all' ('inkwell#' for an article's lead)
//       article, anchor, title, heading, section,   // anchor '' = the article's lead
//       otherDevice,   // true when the record is only for the other device (tag it, don't hide it)
//       score,         // lower is better, after the ranking tweaks
//       snippet: { text, ranges: [[start, end], …] }  // one line around the match; ranges to mark
//   }]
//   DojoHelpSearch.suggest(index, q, { limit: 3 }) -> [articleId]   // looser pass for "no results"
//   DojoHelpSearch.highlight(snippet) -> HTML string: the snippet text escaped, ranges in <mark>.
// Ranges are [start, end) like String.slice: end is exclusive.
//
// How it works. Fuse over the full text of every section is too slow for "as you type"
// (10-20 ms a search), so each record's fields are split into words, and Fuse only matches the
// query's words against the manual's vocabulary (typos: "chalenge" -> "challenge"). Records are
// then scored per query word: the best field it's in (title and heading count most, the text
// least), weighted by how rare the word is. Stop words go; player words from synonyms.json
// also look for the Dojo word ("attack" also searches "challenge").
window.DojoHelpSearch = (function () {
    'use strict';

    // Fields, and how much a word found in each counts.
    const F = { name: 0, sub: 1, alias: 2, syn: 3, title: 4, summary: 5, text: 6, section: 7 };
    // name: the article title (lead) or the ## heading; sub: ### headings; alias: the article's
    // aliases; syn: synonyms added at build time; title: the article title on a section record;
    // summary; text; section: the section title.
    const W_LEAD = [1.0, 0.6, 0.8, 0.4, 0, 0.65, 0.45, 0.15];
    const W_SECT = [1.0, 0.6, 0.8, 0.4, 0.55, 0.3, 0.45, 0.15];
    const DEVICE_PENALTY = 0.15;
    const SAME_ARTICLE = 0.1;
    const MIN_RELEVANCE = 0.12;
    const SNIPPET = 120;

    const STOP = new Set(('a an the to of in on at for from by with and or but how do does did i im ' +
        'me my mine we our you your youre can cant could should would will what whats when where why ' +
        'which is are was were be been it its this that there these those get got want need way about ' +
        'into onto if not dont doesnt no any some just so as').split(' '));
    // Whole queries that are a key: they go to Keyboard shortcuts first.
    const KEYS = new Set(['space', 'spacebar', 'space bar', 'esc', 'escape', 'enter', 'return', 'tab',
        'arrow', 'arrows', 'arrow keys', 'ctrl', 'cmd', 'backspace', 'delete']);
    const KEY_WORDS = /^(?:(?:key|hotkey|shortcut)\s+(\S+)|(\S+)\s+(?:key|hotkey|shortcut|arrow))$/;
    const SHORTCUTS = 'keyboard-shortcuts';

    // ---- Text ----
    function plain(md) {
        return md.split('\n')
            .filter(l => !/^\s*:::/.test(l) && !/^\s*\|?\s*:?-{3,}/.test(l))
            .map(l => /^\s*\|/.test(l) ? l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()).join(' · ') + ' ·' : l
                .replace(/^\s*#{1,6}\s+/, '')
                .replace(/^\s*(?:[-*+]|\d+\.)\s+/, '')
                .replace(/^\s*>\s?/, ''))
            .join(' ')
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
            .replace(/\{key:([^}]*)\}/g, '$1')
            .replace(/\{gesture:([^}]*)\}/g, (_, g) => g.replace(/-/g, ' '))
            .replace(/<[^>]+>/g, ' ')
            .replace(/[`*]|\b_+|_+\b|\\/g, '')
            .replace(/\s+/g, ' ')
            .replace(/(\s*·\s*)+/g, ' · ')
            .replace(/^[\s·]+|[\s·]+$/g, '');
    }
    const stem = (w) => w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y'
        : w.length > 3 && w.endsWith('s') && !/(ss|us|is)$/.test(w) ? w.slice(0, -1) : w;
    const words = (s) => (s || '').toLowerCase().replace(/['’]/g, '').match(/[a-z0-9]+/g) || [];
    const terms = (s) => words(s).map(stem);
    const padded = (ts) => ' ' + ts.join(' ') + ' ';

    // ---- Build ----
    function build(manual, opts) {
        const Fuse = (opts && opts.Fuse) || (typeof window !== 'undefined' && window.Fuse) || null;
        const sectionTitle = {};
        (manual.sections || []).forEach(s => { sectionTitle[s.id] = s.title; });
        const groups = (manual.synonyms || []).map(g => g.map(w => ({ raw: w, t: terms(w) })));
        const records = [];

        for (const a of manual.articles || []) {
            const parts = splitSections(a);
            parts.forEach((p, i) => {
                const lead = i === 0;
                const devices = narrow(a.devices || ['desktop', 'phone'], p.lines);
                const text = plain(p.lines.join('\n'));
                const r = {
                    id: a.id + '#' + p.slug, article: a.id, anchor: p.slug, title: a.title,
                    heading: lead ? '' : p.heading, section: sectionTitle[a.section] || '',
                    devices, lead, order: records.length, text, summary: a.summary || ''
                };
                const f = [];
                f[F.name] = terms(lead ? a.title : p.heading);
                f[F.sub] = terms(p.sub.join(' '));
                f[F.alias] = terms((a.aliases || []).join(' '));
                f[F.title] = lead ? [] : terms(a.title);
                f[F.summary] = terms(a.summary);
                f[F.text] = terms(text);
                f[F.section] = terms(r.section);
                // Synonyms: a record that has a group's Dojo word also matches the rest of the group.
                const own = padded([].concat(f[F.name], f[F.sub], f[F.title], f[F.text], lead ? f[F.summary] : []));
                const syn = [];
                for (const g of groups) if (own.includes(padded(g[0].t))) g.slice(1).forEach(w => syn.push(w.raw));
                r.aliases = (a.aliases || []).concat(syn).join(', ');
                f[F.syn] = terms(syn.join(' '));
                r.fields = f;
                r.strs = f.map(padded);
                r.weights = lead ? W_LEAD : W_SECT;
                records.push(r);
            });
        }

        // Postings: term -> [record, field, count, …]; df: records per term.
        const post = new Map();
        records.forEach((r, ri) => {
            const seen = new Set();
            r.fields.forEach((ts, fi) => {
                const counts = new Map();
                ts.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
                counts.forEach((n, t) => {
                    let p = post.get(t);
                    if (!p) post.set(t, p = { df: 0, list: [] });
                    p.list.push(ri, fi, n);
                    if (!seen.has(t)) { seen.add(t); p.df++; }
                });
            });
        });
        const vocab = [...post.keys()];
        const fuseOpts = (threshold) => ({ includeScore: true, threshold, location: 0, distance: 4, minMatchCharLength: 2 });
        return {
            records, post, vocab, groups,
            fuse: Fuse ? new Fuse(vocab, fuseOpts(0.38)) : null,
            fuseLoose: Fuse ? new Fuse(vocab, fuseOpts(0.6)) : null,
            titles: Fuse ? new Fuse((manual.articles || []).map(a => ({ id: a.id, title: a.title, summary: a.summary })),
                { keys: [{ name: 'title', weight: 0.7 }, { name: 'summary', weight: 0.3 }], includeScore: true, ignoreLocation: true, threshold: 0.6 }) : null
        };
    }

    // An article's lead and ## sections. Slugs come from the bundle's headings.
    function splitSections(a) {
        const parts = [{ slug: '', heading: '', lines: [], sub: [] }];
        if (a.todo) return parts;
        const hs = a.headings || [];
        let k = 0, fence = false;
        for (const line of (a.body || '').split('\n')) {
            if (/^```/.test(line)) fence = !fence;
            const h = !fence && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
            if (h) {
                const head = hs[k++] || { level: h[1].length, text: h[2], slug: '' };
                if (head.level === 2) { parts.push({ slug: head.slug, heading: head.text, lines: [], sub: [] }); continue; }
                parts[parts.length - 1].sub.push(head.text);
            }
            parts[parts.length - 1].lines.push(line);
        }
        return parts;
    }

    // A record whose content is all inside :::desktop (or all :::phone) blocks is for that device.
    function narrow(devices, lines) {
        let open = null, outside = false;
        const layouts = new Set();
        for (const line of lines) {
            const b = /^\s*:::\s*(.*)$/.exec(line);
            if (b) { open = b[1].trim() ? b[1].trim().split(/\s+/) : null; continue; }
            if (!line.trim() || /^\s*\[[^\]]*\]\(show:[^)]*\)\s*$/.test(line)) continue;
            if (!open) { outside = true; continue; }
            const l = open.filter(t => t === 'desktop' || t === 'phone');
            if (l.length === 1) layouts.add(l[0]); else outside = true;
        }
        if (outside || layouts.size !== 1) return devices.slice();
        const d = devices.filter(x => layouts.has(x));
        return d.length ? d : devices.slice();
    }

    // ---- Query ----
    // The query's units: each a list of alternatives { t: [terms], sim }. Synonym phrases are
    // found before stop words go ("what if", "go back"); a player word adds its Dojo word.
    function parse(index, q) {
        const ws = terms(q);
        const units = [];
        for (let i = 0; i < ws.length;) {
            let hit = null;
            for (const g of index.groups) {
                for (let gi = 0; gi < g.length; gi++) {
                    const t = g[gi].t, n = t.length;
                    if (n && (!hit || n > hit.n) && t.every((w, j) => ws[i + j] === w)) hit = { g, gi, n };
                }
            }
            if (hit) {
                const alts = [{ t: ws.slice(i, i + hit.n), sim: 1 }];
                // A player word also looks for the Dojo word, and a little for the group's other words.
                if (hit.gi > 0) hit.g.forEach((w, j) => { if (j !== hit.gi) alts.push({ t: w.t, sim: j ? 0.75 : 0.9 }); });
                units.push(alts);
                // A phrase's own words count too, at half weight ("dark mode" finds "dark").
                if (hit.n > 1) ws.slice(i, i + hit.n).forEach(w => { if (!STOP.has(w) && w.length > 1) { const u = [{ t: [w], sim: 1 }]; u.uw = 0.5; units.push(u); } });
                i += hit.n;
            } else {
                if (!STOP.has(ws[i]) && ws[i].length > 1) units.push([{ t: [ws[i]], sim: 1 }]);
                i++;
            }
        }
        return units;
    }

    // Vocabulary terms a query word stands for: itself, words it starts, words that start it, typos.
    function expand(index, w, loose) {
        const out = new Map();
        const add = (t, s) => { if (s > (out.get(t) || 0)) out.set(t, s); };
        if (index.post.has(w)) add(w, 1);
        if (w.length >= 3) {
            for (const t of index.vocab) {
                if (t !== w && t.startsWith(w)) add(t, 0.6 + 0.35 * w.length / t.length);
                else if (t.length >= 5 && w.length - t.length <= 3 && w.startsWith(t)) add(t, 0.6 + 0.25 * t.length / w.length);
            }
        }
        const fuse = loose ? index.fuseLoose : index.fuse;
        if (fuse && !out.size && w.length >= (loose ? 3 : 4)) {
            for (const r of fuse.search(w, { limit: 12 })) {
                const t = r.item;
                if (Math.abs(t.length - w.length) > Math.max(2, w.length * 0.3)) continue;
                add(t, 0.85 * (1 - r.score));
            }
        }
        return out;
    }

    function score(index, q, loose) {
        const recs = index.records, N = recs.length;
        const units = parse(index, q);
        const rel = new Float64Array(N);
        const hits = new Set(); // matched terms, for the snippet
        let wsum = 0;
        for (const alts of units) {
            const best = new Float64Array(N * 8);
            let idf = 0;
            for (const alt of alts) {
                if (alt.t.length > 1) { // a phrase
                    const s = padded(alt.t);
                    let df = 0;
                    recs.forEach((r, ri) => {
                        let any = false;
                        r.strs.forEach((str, fi) => {
                            if (str.includes(s)) { any = true; const v = alt.sim * r.weights[fi]; if (v > best[ri * 8 + fi]) best[ri * 8 + fi] = v; }
                        });
                        if (any) df++;
                    });
                    if (df) { idf = Math.max(idf, alt.sim * Math.log(1 + N / df)); alt.t.forEach(t => hits.add(t)); }
                    continue;
                }
                expand(index, alt.t[0], loose).forEach((sim, t) => {
                    const p = index.post.get(t);
                    const s0 = sim * alt.sim;
                    idf = Math.max(idf, s0 * Math.log(1 + N / p.df));
                    hits.add(t);
                    const L = p.list;
                    for (let i = 0; i < L.length; i += 3) {
                        const ri = L[i], fi = L[i + 1];
                        const tf = fi === F.text ? Math.min(1.25, 1 + 0.15 * (L[i + 2] - 1)) : 1;
                        const v = s0 * recs[ri].weights[fi] * tf;
                        if (v > best[ri * 8 + fi]) best[ri * 8 + fi] = v;
                    }
                });
            }
            if (!idf) continue; // a word the manual doesn't have: ignore it
            const w = Math.sqrt(idf) * (alts.uw || 1);
            wsum += w;
            for (let ri = 0; ri < N; ri++) {
                let max = 0, sum = 0;
                for (let fi = 0; fi < 8; fi++) { const v = best[ri * 8 + fi]; sum += v; if (v > max) max = v; }
                if (max) rel[ri] += w * (max + Math.min(0.2, 0.1 * (sum - max)));
            }
        }
        if (wsum) for (let ri = 0; ri < N; ri++) rel[ri] /= wsum;
        // The whole query as a phrase in a title or heading.
        const content = units.filter(u => u.length === 1 && u[0].t.length === 1).map(u => u[0].t[0]);
        if (content.length > 1) {
            const s = padded(content);
            recs.forEach((r, ri) => {
                if (r.strs[F.name].includes(s)) rel[ri] += 0.25;
                else if (r.strs[F.title].includes(s) || r.strs[F.alias].includes(s)) rel[ri] += 0.15;
            });
        }
        return { rel, hits };
    }

    function keyQuery(q) {
        const s = q.trim().toLowerCase();
        if (s.length === 1) return s;
        if (KEYS.has(s)) return s;
        const m = KEY_WORDS.exec(s);
        return m ? (m[1] || m[2]) : null;
    }

    function query(index, q, opts) {
        const device = (opts && opts.device) || 'desktop';
        const limit = (opts && opts.limit) || 12;
        q = String(q || '');
        if (!q.trim() || !index) return [];
        const recs = index.records;
        const key = keyQuery(q);
        const { rel, hits } = key && key.length === 1 ? { rel: new Float64Array(recs.length), hits: new Set() } : score(index, q, false);
        const keyTerm = key && stem(key.replace(/\s+.*/, ''));
        const rows = [];
        recs.forEach((r, ri) => {
            let route = 0;
            if (key && r.article === SHORTCUTS) {
                route = r.fields[F.text].includes(keyTerm) || r.fields[F.text].includes(key) ? 2 : 1;
                if (keyTerm) hits.add(keyTerm);
            }
            if (!route && rel[ri] < MIN_RELEVANCE) return;
            const other = r.devices.indexOf(device) < 0;
            rows.push({ r, route, score: 1 / (1 + 2 * rel[ri]) + (other ? DEVICE_PENALTY : 0), other });
        });
        const order = (a, b) => (b.route - a.route) ||
            (Math.abs(a.score - b.score) > 0.005 ? a.score - b.score : (b.r.lead - a.r.lead) || (a.score - b.score)) ||
            (a.r.order - b.r.order);
        rows.sort(order);
        // Variety: an article's second and later records step down, so one long article
        // doesn't fill the top of the list.
        const seen = {};
        rows.forEach(x => { const n = seen[x.r.article] = (seen[x.r.article] || 0) + 1; x.score += SAME_ARTICLE * (n - 1); });
        rows.sort(order);
        return rows.slice(0, limit).map(({ r, score, other }) => ({
            id: r.id, article: r.article, anchor: r.anchor, title: r.title, heading: r.heading,
            section: r.section, otherDevice: other, score: Math.round(score * 1000) / 1000,
            snippet: snippet(r, hits)
        }));
    }

    function suggest(index, q, opts) {
        const limit = (opts && opts.limit) || 3;
        if (!index || !String(q || '').trim()) return [];
        const out = [];
        const { rel } = score(index, String(q), true);
        [...rel.keys()].filter(i => rel[i] > 0).sort((a, b) => rel[b] - rel[a])
            .forEach(i => { const id = index.records[i].article; if (out.indexOf(id) < 0) out.push(id); });
        if (out.length < limit && index.titles) {
            index.titles.search(String(q)).forEach(r => { if (out.indexOf(r.item.id) < 0) out.push(r.item.id); });
        }
        return out.slice(0, limit);
    }

    // ---- Snippet ----
    function snippet(r, hits) {
        const cands = r.lead ? [r.summary, r.text] : [r.text, r.summary];
        let best = null;
        for (const text of cands) {
            if (!text) continue;
            const marks = [];
            const re = /[A-Za-z0-9]+(?:['’][A-Za-z]+)?/g;
            let m;
            while ((m = re.exec(text))) {
                const t = stem(m[0].toLowerCase().replace(/['’]/g, ''));
                if (hits.has(t)) marks.push({ s: m.index, e: m.index + m[0].length, t });
            }
            const c = { text, marks, n: new Set(marks.map(x => x.t)).size };
            // A lead prefers its summary, a section its own text.
            if (!best || (r.lead ? c.n > best.n : !best.n && c.n)) best = c;
        }
        if (!best) return { text: '', ranges: [] };
        const { text, marks } = best;
        if (text.length <= SNIPPET) return { text, ranges: marks.map(x => [x.s, x.e]) };
        // The window of SNIPPET chars with the most different matched words, starting a little before one.
        let start = 0, most = -1;
        for (const m of marks) {
            const s0 = Math.max(0, m.s - 24);
            const n = new Set(marks.filter(x => x.s >= s0 && x.e <= s0 + SNIPPET).map(x => x.t)).size;
            if (n > most) { most = n; start = s0; }
        }
        if (start > 0) { const sp = text.indexOf(' ', start); start = sp > 0 && sp < start + 20 ? sp + 1 : start; }
        let end = Math.min(text.length, start + SNIPPET);
        if (end < text.length) { const sp = text.lastIndexOf(' ', end); if (sp > start + SNIPPET / 2) end = sp; }
        const pre = start > 0 ? '… ' : '';
        const out = pre + text.slice(start, end).trim() + (end < text.length ? ' …' : '');
        const shift = pre.length - start;
        return { text: out, ranges: marks.filter(x => x.s >= start && x.e <= end).map(x => [x.s + shift, x.e + shift]) };
    }

    const esc = (s) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    function highlight(sn) {
        if (!sn || !sn.text) return '';
        let html = '', at = 0;
        for (const [s, e] of sn.ranges || []) {
            if (s < at) continue;
            html += esc(sn.text.slice(at, s)) + '<mark>' + esc(sn.text.slice(s, e)) + '</mark>';
            at = e;
        }
        return html + esc(sn.text.slice(at));
    }

    return { build, query, suggest, highlight, plain };
})();
