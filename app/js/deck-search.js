// Deck search (Feature 66): find a deck by its name or by a card in it, as you type.
// Pure: no DOM. App (app/index.html) hands it plain entries and draws the result.
//
//   DeckSearch.words(q)               -> ['leviatan', …]  (the query's words, lower case)
//   DeckSearch.match(qs, text)        -> { score, spans: [[start, end], …] } | null
//       Every query word must hit one word of text: its start (0), inside it (0.1),
//       a typo (0.3: 1 edit, 2 from 7 letters) or its letters in order, same first
//       letter (0.5: "lvthn" finds Leviathan). spans: [start, end) of each hit in text.
//   DeckSearch.query(entries, q, inks) -> [{ entry, score, name, cards }]
//       entries: [{ name, inks: [ink], cards: [cardName] }]. inks: picked inks; a deck
//       must have all of them, and two picked means that exact pair.
//       name: the name's match or null; cards: [{ card, spans }], best first.
//       No words: every entry that passes the ink filter, in order, with no matches.
window.DeckSearch = (function () {
    'use strict';

    function words(q) {
        return String(q || '').toLowerCase().split(/[^a-z0-9']+/).map(w => w.replace(/'/g, '')).filter(Boolean);
    }

    function edit(a, b) {
        let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
        for (let i = 1; i <= a.length; i++) {
            const cur = [i];
            for (let j = 1; j <= b.length; j++) {
                cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            }
            prev = cur;
        }
        return prev[b.length];
    }

    function inOrder(q, w) {
        let i = 0;
        for (const c of w) if (c === q[i]) i++;
        return i === q.length;
    }

    // [score, start, end] of q in one word w, or null.
    function hit(q, w) {
        if (w.startsWith(q)) return [0, 0, q.length];
        const at = w.indexOf(q);
        if (at > 0) return [0.1, at, at + q.length];
        if (q.length >= 4) {
            const k = q.length >= 7 ? 2 : 1;
            if (edit(q, w.slice(0, q.length)) <= k || edit(q, w) <= k) return [0.3, 0, w.length];
        }
        if (q.length >= 3 && q[0] === w[0] && inOrder(q, w)) return [0.5, 0, w.length];
        return null;
    }

    function match(qs, text) {
        if (!qs.length) return null;
        const ws = [];
        String(text || '').toLowerCase().replace(/[a-z0-9']+/g, (m, i) => { ws.push([m.replace(/'/g, ''), i, m]); return m; });
        let score = 0;
        const spans = [];
        for (const q of qs) {
            let best = null;
            for (const [w, i, raw] of ws) {
                const h = hit(q, w);
                if (!h || (best && h[0] >= best[0])) continue;
                // An apostrophe dropped from the word shifts the end; a whole-word hit covers the raw word.
                best = [h[0], i + h[1], h[2] >= w.length ? i + raw.length : i + h[2]];
            }
            if (!best) return null;
            score += best[0];
            spans.push([best[1], best[2]]);
        }
        return { score: score / qs.length, spans };
    }

    function query(entries, q, inks) {
        const want = [...(inks || [])];
        const pass = (e) => want.every(i => e.inks.includes(i)) && (want.length < 2 || e.inks.length === want.length);
        const qs = words(q);
        const list = entries.filter(pass);
        if (!qs.length) return list.map(entry => ({ entry, score: 0, name: null, cards: [] }));
        const out = [];
        list.forEach(entry => {
            const name = match(qs, entry.name);
            const cards = [];
            new Set(entry.cards).forEach(card => { const m = match(qs, card); if (m) cards.push({ card, spans: m.spans, score: m.score }); });
            if (!name && !cards.length) return;
            cards.sort((a, b) => a.score - b.score);
            // A name hit ranks above a card hit of the same quality.
            const score = Math.min(name ? name.score : 9, cards.length ? cards[0].score + 0.2 : 9);
            out.push({ entry, score, name, cards });
        });
        return out.sort((a, b) => a.score - b.score);
    }

    return { words, match, query };
})();
