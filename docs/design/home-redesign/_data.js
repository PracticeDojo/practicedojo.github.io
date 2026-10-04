// Sample content for the proposals: the real default deck and the sessions
// this repo's tests produced, plus two example defaults from the ARCH doc.
const INK_LABEL = { amber: 'Amber', amethyst: 'Amethyst', emerald: 'Emerald', ruby: 'Ruby', sapphire: 'Sapphire', steel: 'Steel' };
const DATA = {
  myDecks: [
    { id: 'm1', name: 'Ruby/Steel · Oct 4', inks: ['ruby', 'steel'], count: 60 },
    { id: 'm2', name: 'Amethyst/Ruby · HeavenIdeas', inks: ['amethyst', 'ruby'], count: 60, notes: 'From Duels.ink replay 019ea30a' }
  ],
  defaults: [
    { title: 'Set 12', decks: [{ id: 'd1', name: 'Amethyst/Ruby', inks: ['amethyst', 'ruby'], count: 60 }] },
    { title: 'Set 10', decks: [
      { id: 'd2', name: 'Amber/Steel Songs', inks: ['amber', 'steel'], count: 60 },
      { id: 'd3', name: 'Ruby/Sapphire Tempo', inks: ['ruby', 'sapphire'], count: 60 }
    ] }
  ],
  sessions: [
    { id: 's1', title: 'HeavenIdeas vs Mia Ies (Duels.ink)', inks: [['amethyst', 'ruby'], ['amber', 'steel']], turn: 19, lore: [18, 20], nodes: 19, lines: 1, ago: '2 hours ago', when: 'Today' },
    { id: 's2', title: 'Amethyst/Ruby vs Ruby/Steel', inks: [['amethyst', 'ruby'], ['ruby', 'steel']], turn: 6, lore: [9, 7], nodes: 7, lines: 3, ago: 'yesterday', when: 'Yesterday' },
    { id: 's3', title: 'Amber/Steel vs Ruby', inks: [['amber', 'steel'], ['ruby']], turn: 3, lore: [5, 2], nodes: 0, lines: 1, ago: '4 days ago', when: 'Earlier' }
  ],
  demos: [{ id: 'x1', title: 'Amber/Steel vs Ruby/Sapphire — turn 8 study', inks: [['amber', 'steel'], ['ruby', 'sapphire']] }]
};
const FIRST = new URLSearchParams(location.search).get('state') === 'first';
if (FIRST) { DATA.myDecks = []; DATA.sessions = []; }
const allDecks = () => DATA.myDecks.concat(...DATA.defaults.map(g => g.decks));
const inkVar = (i) => `var(--${i || 'none'})`;
const pipsHtml = (inks) => `<span class="pips">${(inks || []).map(i => `<span class="pip" style="--c:${inkVar(i)}"></span>`).join('')}</span>`;
const inkText = (inks) => (inks && inks.length ? inks.map(i => INK_LABEL[i]).join(' · ') : 'Custom deck');
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function reviewBar() {
  const b = document.createElement('div');
  b.className = 'review';
  b.innerHTML = `<span>Prototype</span><a href="?" ${FIRST ? '' : 'aria-current="true"'}>Returning player</a><a href="?state=first" ${FIRST ? 'aria-current="true"' : ''}>First visit</a>`;
  document.body.appendChild(b);
}
