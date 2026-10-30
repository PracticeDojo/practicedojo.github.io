// Score lab (Feature 68, experimental, branch feat/68-rules-engine): the weights the rules engine
// scores proposed plays with, kept as named profiles on this device. Tweaks → Rules engine → Lab.
//
//   TERMS                 the built-in terms, in the order the Score tab lists them:
//                         { key, label, side, help }; side 'yours' / 'theirs' when one weight is one side.
//   load()                → { active, draft, profiles }. A profile is { weights: { [key]: number }, off: [key],
//                         terms: [term] } (terms: your own, below).
//                         "Default" is never stored: it is the engine's own weights. `draft` is the profile
//                         in use while it has edits not saved yet (null when there are none).
//   save(store)
//   weightsFor(profile)   what to send the engine: every weight, the ones switched off as 0.
//   termsFor(profile)     your own terms that are on, as the engine takes them.
//   termOf(raw)           a term checked: only the values below, or null. describe(term): it as a sentence.
//   peeks(term)           true when it reads their hand or inkwell past how many cards are there, which you
//                         couldn't see in a real game.
//
// Your own terms are data, never code: count one side's cards in one zone that pass the filters,
// measure them (count, lore, strength, willpower left, cost), times a weight; always, or only when
// you are ahead or behind in the race to 20 (at the lore in play). The engine evaluates them.
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

    // What a term may say, as [value, words]. Effects are what the engine reads in a card's abilities.
    const SIDES = [['mine', 'my cards'], ['theirs', 'their cards']];
    const ZONES = [['play', 'in play'], ['hand', 'in hand'], ['inkwell', 'in the inkwell'], ['discard', 'in the discard']];
    const TYPES = [['character', 'characters'], ['action', 'actions'], ['item', 'items'], ['location', 'locations']];
    const KEYWORDS = ['Alert', 'Bodyguard', 'Boost', 'Challenger', 'Evasive', 'Reckless', 'Resist', 'Rush', 'Shift', 'Singer', 'Support', 'Vanish', 'Ward'].map(k => [k, k]);
    const STATES = [['ready', 'ready'], ['exerted', 'exerted'], ['damaged', 'damaged']];
    const CANS = [['quest', 'can quest'], ['challenge', 'can challenge']];
    const EFFECTS = [['draw', 'draw cards'], ['removal', 'banish, damage or bounce'], ['ramp', 'ramp ink'], ['lore', 'gain lore']];
    const MEASURES = [['count', 'how many'], ['lore', 'lore'], ['strength', 'strength'], ['willpower', 'willpower left'], ['cost', 'cost']];
    const WHENS = [['always', 'Always'], ['ahead', 'Ahead'], ['behind', 'Behind']];
    const CLASSES = ['Alien', 'Ally', 'Broom', 'Captain', 'Deity', 'Detective', 'Dinosaur', 'Dragon', 'Dreamborn', 'Fairy', 'Floodborn', 'Gargoyle', 'Ghost', 'Giant', 'Hero', 'Hyena',
        'Illusion', 'Inventor', 'King', 'Knight', 'Madrigal', 'Mentor', 'Monster', 'Musketeer', 'Pirate', 'Prince', 'Princess', 'Puppy', 'Queen', 'Racer', 'Robot', 'Seven Dwarfs',
        'Sorcerer', 'Storyborn', 'Super', 'Tigger', 'Titan', 'Toy', 'Villain'];
    const TERM_MAX = 20;
    const has = (list, v) => list.some(([k]) => k === v);
    const text = (v, n) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, n) : '');
    const NAME_MAX = 40;
    const LIMIT = 100; // largest weight either way

    const blank = () => ({ active: DEFAULT, draft: null, profiles: {} });

    function termOf(t) {
        if (!t || typeof t !== 'object') return null;
        const w = t.where && typeof t.where === 'object' ? t.where : {};
        const where = {};
        if (has(TYPES, w.type)) where.type = w.type;
        if (has(KEYWORDS, w.keyword)) where.keyword = w.keyword;
        if (text(w.classification, 30)) where.classification = text(w.classification, 30);
        if (has(STATES, w.state)) where.state = w.state;
        if (has(CANS, w.can)) where.can = w.can;
        if (has(EFFECTS, w.effect)) where.effect = w.effect;
        if (text(w.name, NAME_MAX)) where.name = text(w.name, NAME_MAX);
        for (const k of ['costMin', 'costMax']) {
            const n = Number(w[k]);
            if (w[k] !== undefined && w[k] !== null && w[k] !== '' && Number.isFinite(n)) where[k] = Math.max(0, Math.min(20, Math.round(n)));
        }
        const weight = Number(t.weight);
        return {
            name: text(t.name, NAME_MAX),
            side: has(SIDES, t.side) ? t.side : 'mine',
            zone: has(ZONES, t.zone) ? t.zone : 'play',
            where,
            measure: has(MEASURES, t.measure) ? t.measure : 'count',
            weight: Number.isFinite(weight) ? Math.max(-LIMIT, Math.min(LIMIT, weight)) : 0,
            when: has(WHENS, t.when) ? t.when : 'always',
            off: t.off === true,
        };
    }

    const words = (list, v) => (list.find(([k]) => k === v) || [])[1] || '';
    // Their hand and inkwell are hidden: how many cards is public, anything about which cards isn't.
    const peeks = (t) => t.side === 'theirs' && (t.zone === 'hand' || t.zone === 'inkwell') && (Object.keys(t.where || {}).length > 0 || t.measure !== 'count');

    // "My ready Evasive characters in play: lore × 0.3"
    function describe(t) {
        const w = t.where || {};
        const what = [w.state && words(STATES, w.state), w.classification, w.keyword].filter(Boolean).join(' ');
        const kind = w.type ? words(TYPES, w.type) : 'cards';
        const zone = words(ZONES, t.zone);
        const more = [w.can && `that ${words(CANS, w.can)}`, w.effect && `that ${words(EFFECTS, w.effect)}`,
            w.costMin != null || w.costMax != null ? `costing ${w.costMin != null && w.costMax != null ? (w.costMin === w.costMax ? w.costMin : `${w.costMin}–${w.costMax}`) : w.costMin != null ? `${w.costMin}+` : `up to ${w.costMax}`}` : '',
            w.name && `named “${w.name}”`].filter(Boolean).join(', ');
        const when = t.when === 'ahead' ? ", when you're ahead in the race" : t.when === 'behind' ? ", when you're behind in the race" : '';
        const weight = (t.weight < 0 ? '−' : '') + Math.abs(t.weight);
        return `${t.side === 'theirs' ? 'Their' : 'My'} ${what ? what + ' ' : ''}${kind} ${zone}${more ? ' ' + more : ''}: ${words(MEASURES, t.measure)} × ${weight}${when}.`;
    }

    // A profile as stored, or null: known terms only, finite weights in range, a known off list.
    function profileOf(p) {
        if (!p || typeof p !== 'object' || !p.weights || typeof p.weights !== 'object') return null;
        const weights = {};
        for (const k of KEYS) {
            const w = Number(p.weights[k]);
            if (p.weights[k] !== undefined && Number.isFinite(w)) weights[k] = Math.max(-LIMIT, Math.min(LIMIT, w));
        }
        const off = Array.isArray(p.off) ? [...new Set(p.off.filter(k => KEYS.includes(k)))] : [];
        const terms = Array.isArray(p.terms) ? p.terms.slice(0, TERM_MAX).map(termOf).filter(Boolean) : [];
        return { weights, off, terms };
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

    function termsFor(profile) {
        return (profile.terms || []).filter(t => !t.off);
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

    return {
        DEFAULT, TERMS, KEYS, NAME_MAX, TERM_MAX, SIDES, ZONES, TYPES, KEYWORDS, STATES, CANS, EFFECTS, MEASURES, WHENS, CLASSES,
        load, save, weightsFor, termsFor, termOf, describe, peeks, exportText, parse, nameOf
    };
})();
