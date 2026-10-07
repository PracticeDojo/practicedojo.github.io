// Sample library for the three proposals, plus the helpers they share.
// URL state: ?acct=in|out  &tab=sessions|decks|links  &theme=day|night
//            &drawer=0 (home only)  &menu=<row id>  &filter=<place>  &shot
const Q = new URLSearchParams(location.search);
const STATE = {
    acct: Q.get('acct') === 'out' ? 'out' : 'in',
    tab: ['sessions', 'decks', 'links'].includes(Q.get('tab')) ? Q.get('tab') : 'sessions',
    theme: Q.get('theme') === 'night' ? 'night' : 'day',
    drawer: Q.get('drawer') !== '0',
    menu: Q.get('menu'),
    filter: Q.get('filter') || 'all',
    shot: Q.has('shot')
};
const SIGNED = STATE.acct === 'in';
document.documentElement.dataset.theme = STATE.theme;
const USER = { name: 'nessdj', provider: 'Discord', usage: { sessions: 4, maxSessions: 50, decks: 1, maxDecks: 200 } };

const INK = { amber: '#E0A23A', amethyst: '#7A5CFF', emerald: '#1F9D6A', ruby: '#D64545', sapphire: '#3C7DFF', steel: '#8E8C88' };
const INK_LABEL = { amber: 'Amber', amethyst: 'Amethyst', emerald: 'Emerald', ruby: 'Ruby', sapphire: 'Sapphire', steel: 'Steel' };

// place: device (only here) · synced (here + account) · ahead (here, account is behind)
//        behind (here, account has a newer copy) · account (only in the account)
const SESSIONS_IN = [
    { id: 's-a', title: 'Set 13 · Princess vs Control, T9', inks: [['amber', 'emerald'], ['amber', 'amethyst']], turn: 9, lore: [14, 11], nodes: 12, lines: 3, ago: '12 min ago', place: 'ahead', last: true },
    { id: 's-b', title: 'Mirror practice', inks: [['amber', 'ruby'], ['amber', 'ruby']], turn: 6, lore: [8, 9], nodes: 5, ago: '6 hours ago', place: 'synced' },
    { id: 's-c', title: 'Tournament R3 replay', inks: [['amethyst', 'ruby'], ['sapphire', 'steel']], turn: 12, lore: [20, 17], nodes: 18, lines: 2, ago: '1 day ago', place: 'behind' },
    { id: 's-d', title: 'Duels.ink game · 4 Oct', inks: [['amber', 'amethyst'], ['amethyst', 'ruby']], turn: 16, lore: [10, 11], nodes: 27, ago: '2 days ago', place: 'device' },
    { id: 's-e', title: 'Untitled session', inks: [['emerald', 'steel'], ['ruby', 'sapphire']], turn: 3, lore: [2, 1], nodes: 2, ago: '4 days ago', place: 'device' },
    { id: 's-x', title: 'Laptop: Steel lines vs Evasive', inks: [['sapphire', 'steel'], ['amber', 'ruby']], turn: 7, lore: [10, 12], nodes: 9, ago: '1 day ago', place: 'account' }
];
const SESSIONS = SIGNED ? SESSIONS_IN : SESSIONS_IN.filter(s => s.place !== 'account').map(s => ({ ...s, place: 'device' }));
const DECKS = [
    { id: 'd-1', name: 'My Amber/Ruby list', inks: ['amber', 'ruby'], count: 60, place: SIGNED ? 'synced' : 'device' },
    { id: 'd-2', name: 'Locals Steel brew', inks: ['sapphire', 'steel'], count: 60, place: 'device' }
];
const BUILTIN = [
    { title: 'Set 13', decks: [
        { id: 'b-1', name: 'S13 - GY - Princess Aggro', inks: ['amber', 'emerald'], count: 60 },
        { id: 'b-2', name: 'S13 - PY - Control', inks: ['amber', 'amethyst'], count: 60 },
        { id: 'b-3', name: 'S13 - AR - Evasive Tempo', inks: ['amethyst', 'ruby'], count: 60 }
    ] },
    { title: 'Set 12', decks: [{ id: 'b-4', name: 'S12 - AR - Control', inks: ['amethyst', 'ruby'], count: 60 }] }
];
const DEMOS = [{ id: 'x-1', title: 'Set 13 example · Amber/Amethyst vs Amethyst/Ruby, turn 16' }];
const LINKS = [
    { id: 'k3J9xQ2mPa', kind: 'Session', title: 'Set 13 · Princess vs Control, T9', ago: '20 hours ago', size: '207 KB' },
    { id: 'ap0nYnZBWW', kind: 'Deck', title: 'My Amber/Ruby list', ago: '3 days ago' }
];

// Plain-language status for each place, used by all three proposals.
const SAY = {
    device: SIGNED ? 'Only on this device' : 'On this device',
    synced: 'On this device and in your account',
    ahead: 'Changed here since your last Save',
    behind: 'Your account has a newer copy',
    account: 'Only in your account',
    deckSynced: 'Follows your account',
    builtin: 'Comes with the Dojo',
    link: 'Anyone with the link can open it'
};
const has = (p, side) => (side === 'device' ? p !== 'account' : ['synced', 'ahead', 'behind', 'account'].includes(p));

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const SEP = '<span class="cc-sep">·</span>';
const pips = (inks) => `<span class="cc-pips">${inks.map(i => `<span class="cc-pip" style="--pip:${INK[i]}"></span>`).join('')}</span>`;
const side = (inks) => `<span>${pips(inks)} ${inks.map(i => INK_LABEL[i]).join(' · ')}</span>`;
function sessionMeta(s, { ago = true } = {}) {
    const bits = [`${side(s.inks[0])} <span class="dim">vs</span> ${side(s.inks[1])}`, `Turn ${s.turn}`, `lore ${s.lore[0]}–${s.lore[1]}`, `${s.nodes} nodes`];
    if (s.lines > 1) bits.push(`${s.lines} lines`);
    if (ago) bits.push(s.ago);
    return bits.join(SEP);
}
const deckMeta = (d) => [side(d.inks), `${d.count} cards`].join(SEP);

// The ⋯ menu: everything a row can do besides Open and its place action.
function moreMenu(kind, id) {
    const items = kind === 'session'
        ? [['fa-solid fa-pen', 'Rename'], ['fa-solid fa-share-nodes', 'Share a link'], ['fa-regular fa-copy', 'Duplicate'], ['fa-solid fa-file-export', 'Export file (.dojo.json.gz)']]
        : kind === 'deck' ? [['fa-solid fa-pen', 'Edit'], ['fa-solid fa-share-nodes', 'Share a link']]
            : kind === 'builtin' ? [['fa-regular fa-copy', 'Copy to my decks and edit'], ['fa-solid fa-share-nodes', 'Share a link']]
                : [['fa-solid fa-arrow-up-right-from-square', 'Open in a new tab']];
    const del = kind === 'builtin' ? '' : `<hr><button class="is-danger"><i class="fa-solid fa-trash"></i>${kind === 'link' ? 'Delete link' : 'Delete…'}</button>`;
    const open = STATE.menu === id;
    return `<span class="row-more"><button class="icon-btn ghost" aria-label="More" aria-expanded="${open}"><i class="fa-solid fa-ellipsis"></i></button>${open
        ? `<span class="more-menu" role="menu">${items.map(([i, l]) => `<button><i class="${i}"></i>${l}</button>`).join('')}${del}</span>` : ''}</span>`;
}

// The action that moves a row between places, as words (one at most per row).
function placeAction(p, kind = 'session') {
    if (!SIGNED) return '';
    if (p === 'device' || p === 'ahead') return `<button class="btn place-act to-account"><i class="fa-solid fa-arrow-up"></i> Save to account</button>`;
    if (p === 'behind') return `<button class="btn place-act from-account"><i class="fa-solid fa-arrow-down"></i> Get newer copy</button>`;
    return '';
}

// Header controls as today (theme, account, Library); a proposal may pass its own Library button.
function homeHeader({ library } = {}) {
    const acct = SIGNED
        ? `<button class="btn btn-ghost acct-btn is-signed-in" id="btn-account"><span class="acct-avatar" aria-hidden="true">N</span><span id="acct-label">${USER.name}</span></button>`
        : `<button class="btn btn-ghost acct-btn" id="btn-account"><span class="acct-avatar" aria-hidden="true"><i class="fa-regular fa-user"></i></span><span id="acct-label">Sign in</span></button>`;
    return `<div class="seg" id="home-theme" role="group" aria-label="Theme">
        <button type="button" aria-pressed="false">Auto</button><button type="button" aria-pressed="${STATE.theme === 'day'}">Day</button><button type="button" aria-pressed="${STATE.theme === 'night'}">Night</button>
    </div>${acct}${library || `<button class="btn btn-ghost" id="btn-open-library"><i class="fa-solid fa-book-bookmark"></i> Library <span class="ht-count">${SESSIONS.filter(s => s.place !== 'account').length}</span></button>`}`;
}

// Tabs (Shared is renamed Links in every proposal: "shared" also reads as
// "on all my devices", the very thing this is about).
function tabs(counts = {}) {
    const t = [['sessions', 'fa-solid fa-folder-open', 'Sessions'], ['decks', 'fa-solid fa-layer-group', 'Decks'], ['links', 'fa-solid fa-link', 'Links']];
    return `<div class="home-tabs" role="tablist">${t.map(([k, i, l]) => `<button type="button" class="home-tab${STATE.tab === k ? ' is-active' : ''}" role="tab" aria-selected="${STATE.tab === k}"><i class="${i}"></i> ${l}${counts[k] != null ? ` <span class="ht-count">${counts[k]}</span>` : ''}</button>`).join('')}</div>`;
}

function reviewBar(name) {
    const link = (patch, label) => {
        const p = new URLSearchParams(location.search);
        Object.entries(patch).forEach(([k, v]) => (v == null ? p.delete(k) : p.set(k, v)));
        const cur = Object.entries(patch).every(([k, v]) => (Q.get(k) || null) === v || (v == null && !Q.has(k)) || (k === 'acct' && v === STATE.acct) || (k === 'tab' && v === STATE.tab) || (k === 'theme' && v === STATE.theme));
        return `<a href="?${p}"${cur ? ' aria-current="true"' : ''}>${label}</a>`;
    };
    const b = document.createElement('div');
    b.className = 'review';
    b.innerHTML = `<b>${name}</b>${link({ acct: 'in' }, 'Signed in')}${link({ acct: 'out' }, 'Signed out')} · ${link({ tab: 'sessions' }, 'Sessions')}${link({ tab: 'decks' }, 'Decks')}${link({ tab: 'links' }, 'Links')} · ${link({ theme: 'day' }, 'Day')}${link({ theme: 'night' }, 'Night')} · ${link({ drawer: STATE.drawer ? '0' : null }, STATE.drawer ? 'Home only' : 'Open Library')}`;
    document.body.appendChild(b);
}

// Renders the page: the real home behind, the proposal's drawer on top.
function mount({ name, drawer, recentTitle, recent, library }) {
    if (STATE.shot) document.body.classList.add('is-shot');
    const root = document.getElementById('root');
    const call = (v) => (typeof v === 'function' ? v() : v);
    root.innerHTML = homeHtml({ hd: homeHeader({ library: call(library) }), recentTitle: call(recentTitle), recent: call(recent) }) +
        (STATE.drawer ? `<div class="lib-scrim"></div><aside class="lib-drawer" role="dialog" aria-label="Library">${drawer()}</aside>` : '');
    reviewBar(name);
}
