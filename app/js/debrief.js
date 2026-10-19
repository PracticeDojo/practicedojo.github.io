// Debrief and matchups (Feature 66): after a game, which side you were, the
// result, the turn it was decided, what went wrong and one lesson. Then every
// debriefed session on this device, grouped by matchup, weakest first.
//
// It knows nothing about the board. App (app/index.html) hands it plain values
// and shows what it builds in its own dialog:
//   clean(raw) -> debrief | null            (untrusted: files, share links, the account)
//   form(debrief, names) -> element         (App.dialog's `content`)
//   read(element) -> debrief
//   matchups(rows, inkLabel) -> [matchup]   (rows: library session rows, each with a summary)
window.DojoDebrief = (function () {
    'use strict';

    // Decisions, not verdicts on the player: feedback about the task helps,
    // feedback about the self tends to hurt (Kluger & DeNisi 1996).
    const TAGS = ['Mulligan', 'Inking', 'Curve / tempo', 'Quest vs challenge',
        'Played into an answer', 'Misread their deck', 'Lore race maths', 'Sequencing'];
    const FEW = 5; // under this many games a win rate is mostly noise

    // { me: 0 | 1, won: true | false | null, turn: 1–99 | null, tags: [TAGS], lesson, at }
    function clean(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const turn = Number(raw.turn);
        return {
            me: raw.me === 1 ? 1 : 0,
            won: typeof raw.won === 'boolean' ? raw.won : null,
            turn: Number.isInteger(turn) && turn > 0 && turn < 100 ? turn : null,
            tags: Array.isArray(raw.tags) ? TAGS.filter(t => raw.tags.includes(t)) : [],
            lesson: String(raw.lesson == null ? '' : raw.lesson).slice(0, 280),
            at: Number(raw.at) || null
        };
    }

    function form(debrief, names) {
        const d = clean(debrief) || clean({});
        const el = document.createElement('div');
        el.className = 'db-form';
        el.innerHTML = `
            <div class="db-field"><span class="db-label" id="db-me-l">You played</span>
                <div class="seg" role="group" aria-labelledby="db-me-l" data-key="me">
                    <button type="button" data-v="0"></button><button type="button" data-v="1"></button></div></div>
            <div class="db-field"><span class="db-label" id="db-won-l">Result</span>
                <div class="seg" role="group" aria-labelledby="db-won-l" data-key="won">
                    <button type="button" data-v="true">Won</button><button type="button" data-v="false">Lost</button></div></div>
            <label class="db-field"><span class="db-label">Decided on turn</span>
                <input class="input db-turn" type="number" min="1" max="99" inputmode="numeric" placeholder="If one turn decided it"></label>
            <div class="db-field"><span class="db-label">What went wrong</span>
                <div class="db-tags">${TAGS.map(t => `<label class="db-tag"><input type="checkbox" value="${t}"><span>${t}</span></label>`).join('')}</div></div>
            <label class="db-field"><span class="db-label">One lesson</span>
                <input class="input db-lesson" type="text" maxlength="280" placeholder="Next time against this deck, I'll…"></label>`;
        const pick = (seg, v) => seg.querySelectorAll('button')
            .forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
        el.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (b) pick(seg, b.dataset.v);
        }));
        const [meSeg, wonSeg] = el.querySelectorAll('.seg');
        meSeg.querySelectorAll('button').forEach((b, i) => { b.textContent = names[i] || `Player ${i + 1}`; });
        pick(meSeg, d.me);
        pick(wonSeg, d.won);
        el.querySelector('.db-turn').value = d.turn || '';
        el.querySelectorAll('.db-tag input').forEach(c => { c.checked = d.tags.includes(c.value); });
        el.querySelector('.db-lesson').value = d.lesson;
        return el;
    }

    function read(el) {
        const val = (key) => {
            const b = el.querySelector(`.seg[data-key="${key}"] [aria-pressed="true"]`);
            return b ? b.dataset.v : null;
        };
        const won = val('won');
        return clean({
            me: Number(val('me')),
            won: won === null ? null : won === 'true',
            turn: el.querySelector('.db-turn').value,
            tags: [...el.querySelectorAll('.db-tag input:checked')].map(c => c.value),
            lesson: el.querySelector('.db-lesson').value.trim(),
            at: Date.now()
        });
    }

    // Groups debriefed games by "my inks vs their inks" (inkLabel names a side's
    // inks). Games without a result don't count. Lowest win rate first, then most games.
    function matchups(rows, inkLabel) {
        const groups = new Map();
        (rows || []).forEach(r => {
            const s = (r && r.summary) || {};
            const d = clean(s.debrief);
            if (!d || d.won === null) return;
            const inks = Array.isArray(s.inks) ? s.inks : [];
            const myInks = Array.isArray(inks[d.me]) ? inks[d.me] : [];
            const theirInks = Array.isArray(inks[1 - d.me]) ? inks[1 - d.me] : [];
            const mine = inkLabel(myInks), theirs = inkLabel(theirInks);
            const key = mine + '\n' + theirs;
            const g = groups.get(key) || { mine, theirs, myInks, theirInks, games: 0, wins: 0, counts: {}, lesson: '', lessonAt: -1 };
            g.games++;
            if (d.won) g.wins++;
            d.tags.forEach(t => { g.counts[t] = (g.counts[t] || 0) + 1; });
            if (d.lesson && (d.at || 0) > g.lessonAt) { g.lesson = d.lesson; g.lessonAt = d.at || 0; }
            groups.set(key, g);
        });
        return [...groups.values()].map(g => {
            const top = Object.entries(g.counts).sort((a, b) => b[1] - a[1])[0];
            return {
                mine: g.mine, theirs: g.theirs, myInks: g.myInks, theirInks: g.theirInks,
                games: g.games, wins: g.wins, losses: g.games - g.wins, rate: g.wins / g.games,
                few: g.games < FEW, topTag: top ? top[0] : '', topCount: top ? top[1] : 0, lesson: g.lesson
            };
        }).sort((a, b) => a.rate - b.rate || b.games - a.games);
    }

    return { TAGS, clean, form, read, matchups };
})();
