// Score lab (Feature 68, experimental, branch feat/68-rules-engine): the weights the rules engine
// scores proposed plays with, kept as named profiles on this device. Tweaks → Rules engine → Lab.
//
//   TERMS                 the built-in terms, in the order the Score tab lists them:
//                         { key, label, side, help }; side 'yours' / 'theirs' when one weight is one side.
//   load()                → { active, draft, profiles }. A profile is { weights: { [key]: number }, off: [key] }.
//                         "Default" is never stored: it is the engine's own weights. `draft` is the profile
//                         in use while it has edits not saved yet (null when there are none).
//   save(store)
//   weightsFor(profile)   what to send the engine: every weight, the ones switched off as 0.
//   exportText(store)     the saved profiles as a file.
//   parse(text)           an imported file → { [name]: profile }. Throws a sentence when it isn't one.
window.DojoLab = (function () {
    'use strict';

    const KEY = 'lorcana_dojo_lab';
    const DEFAULT = 'Default';
    const TERMS = [
        { key: 'lore', label: 'lore', help: 'Lore now, yours minus theirs.' },
        { key: 'potential', label: 'lore on board', side: 'yours', help: 'Lore your characters in play (and locations) can bring next turn.' },
        { key: 'threat', label: 'lore on board', side: 'theirs', help: 'Lore their characters in play (and locations) can bring next turn. Counts against you.' },
        { key: 'body', label: 'board', help: 'Strength, willpower left and Resist of the characters in play, yours minus theirs.' },
        { key: 'exposed', label: 'exposed', help: 'Your exerted characters one of theirs could banish in a challenge next turn: their lore, body and 1 for the card.' },
        { key: 'hand', label: 'hand', help: 'Cards in your hand.' },
        { key: 'ink', label: 'ink', help: 'Cards in your inkwell.' },
        { key: 'race', label: 'race to 20', help: 'Turns each side needs to reach 20 at the lore in play, theirs minus yours.' },
        { key: 'reply', label: 'their turn', help: 'Proposed plays only: the engine plays their next turn with the cards they have in play, and ranks the best lines by the score after it. On or off.' },
    ];
    const KEYS = TERMS.map(t => t.key);
    const NAME_MAX = 40;
    const LIMIT = 100; // largest weight either way

    const blank = () => ({ active: DEFAULT, draft: null, profiles: {} });

    // A profile as stored, or null: known terms only, finite weights in range, a known off list.
    function profileOf(p) {
        if (!p || typeof p !== 'object' || !p.weights || typeof p.weights !== 'object') return null;
        const weights = {};
        for (const k of KEYS) {
            const w = Number(p.weights[k]);
            if (p.weights[k] !== undefined && Number.isFinite(w)) weights[k] = Math.max(-LIMIT, Math.min(LIMIT, w));
        }
        const off = Array.isArray(p.off) ? [...new Set(p.off.filter(k => KEYS.includes(k)))] : [];
        return { weights, off };
    }
    const nameOf = (n) => (typeof n === 'string' ? n.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) : '');

    function profilesOf(obj) {
        const out = {};
        if (!obj || typeof obj !== 'object') return out;
        for (const [n, p] of Object.entries(obj).slice(0, 50)) {
            const name = nameOf(n), prof = profileOf(p);
            if (name && name !== DEFAULT && prof) out[name] = prof;
        }
        return out;
    }

    function load() {
        let s = null;
        try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
        if (!s || typeof s !== 'object') return blank();
        const profiles = profilesOf(s.profiles);
        const active = profiles[s.active] ? s.active : DEFAULT;
        return { active, draft: profileOf(s.draft), profiles };
    }

    function save(store) {
        try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { console.warn('Score lab: profiles not saved', e); }
    }

    function weightsFor(profile) {
        const w = Object.assign({}, profile.weights);
        (profile.off || []).forEach(k => { w[k] = 0; });
        return w;
    }

    function exportText(store) {
        return JSON.stringify({ dojoLab: 1, profiles: store.profiles }, null, 1);
    }

    function parse(text) {
        let obj;
        try { obj = JSON.parse(text); } catch (e) { throw new Error("That file isn't a score lab file."); }
        if (!obj || obj.dojoLab !== 1) throw new Error("That file isn't a score lab file.");
        const profiles = profilesOf(obj.profiles);
        if (!Object.keys(profiles).length) throw new Error('That file has no profiles in it.');
        return profiles;
    }

    return { DEFAULT, TERMS, KEYS, NAME_MAX, load, save, weightsFor, exportText, parse, nameOf };
})();
