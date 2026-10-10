// Builds app/help/tours/referee.dojo.json.gz, the practice board of the "You're the referee"
// tour (Feature 59). Edit the zones below and re-run to change the board:
//   node tools/referee-board.mjs [allCards.json]
// Without a path it fetches the card database the app uses. The deck order is seeded, so a
// re-run gives the same board.
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const CARD_DB_URL = 'https://cdn.jsdelivr.net/gh/heavenideas/similcana@main/database/allCards.json';
const outPath = fileURLToPath(new URL('../app/help/tours/referee.dojo.json.gz', import.meta.url));
const appVersion = (readFileSync(fileURLToPath(new URL('../app/index.html', import.meta.url)), 'utf8').match(/APP_VERSION = "([^"]+)"/) || [])[1] || '';
const cardsPath = process.argv[2];
const dbText = cardsPath ? readFileSync(cardsPath, 'utf8') : await (await fetch(CARD_DB_URL)).text();
const db = JSON.parse(dbText).cards.filter(c => !/enchanted|promo|special/i.test(c.rarity || ''));
const byName = {};
for (const c of db) if (!byName[c.fullName]) byName[c.fullName] = c;
const id = (n) => { const c = byName[n]; if (!c) throw new Error('no card ' + n); return c.id; };
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const iid = () => Array.from({ length: 9 }, () => '0123456789abcdefghijklmnopqrstuvwxyz'[Math.floor(rnd() * 36)]).join('');
const card = (n, o = {}) => ({ instanceId: iid(), cardId: id(n), exerted: false, damage: 0, faceUp: false, locationId: null, drying: false, stackedCards: [], ...o });
const list = (s) => s.trim().split('\n').flatMap(l => { const m = l.trim().match(/^(\d+) (.+)$/); return Array(+m[1]).fill(m[2]); });

const deck1 = `4 Dash Parr - Dodgeball Dynamo
4 Luisa Madrigal - Pushing Through
1 Peter Pan - Vine Duelist
1 Rafiki - Mystical Fighter
3 Jebidiah Farnsworth - Cookie
4 Junior Woodchuck Guidebook
4 Randall Boggs - Envious Coworker
4 Scrooge McDuck - Ghostly Ebenezer
4 Cheshire Cat - Inexplicable
3 Vixey - Expert Fisher
4 Dumbo - Ninth Wonder of the Universe
4 Isis Vanderchill - Ice Queen of St. Canard
3 Red Alert
1 Sven - Leaping Reindeer
2 Dash Parr - Super Fast
3 Hades - Looking for a Deal
2 Luisa Madrigal - Confident Climber
1 Mrs. Incredible - Super Stretchy
1 Ursula - Whisper of Vanessa
4 Demona - Scourge of the Wyvern Clan
3 Peter Pan & Tinker Bell - Fast Friends`;
const deck2 = `4 Aurora - Holding Court
4 Bobby Zimuruski - Spray Cheese Kid
4 Pluto - Friendly Pooch
3 The Queen - Regal Monarch
4 Thomas - Wide-Eyed Recruit
4 David - Protective Snowboarder
4 Grandmother Willow - Ancient Advisor
4 Mike Wazowski - Heroic Climber
2 Mowgli - Man Cub
4 Pocahontas - Guiding the Tribe
4 Ursula - Deceiver
4 Nani - Stage Manager
4 Dale - Ready for His Shot
4 Elinor - Renowned Diplomat
2 Rapunzel - Tower Defender
1 The Queen - Devious Disguise
4 Pocahontas - Peacekeeper`;

// Takes named cards out of a pool (a 60-card list), so the zones add up to the deck.
function take(pool, names) { return names.map(n => { const i = pool.indexOf(n); if (i < 0) throw new Error('pool has no ' + n); pool.splice(i, 1); return n; }); }

// ---- Player 1 (the player): the deck lists are the two built-in Set 13 decks, plus the tour's actions ----
const pool1 = list(deck1);
pool1.push('The Horseman Strikes!', 'Magical Maneuvers');   // the tour's two actions, added for the lesson
const p1Field = [card(take(pool1, ['Peter Pan - Vine Duelist'])[0]), card(take(pool1, ['Luisa Madrigal - Pushing Through'])[0])];
const p1Hand = take(pool1, ['The Horseman Strikes!', 'Magical Maneuvers', 'Peter Pan & Tinker Bell - Fast Friends']).map(n => card(n));
const p1Ink = take(pool1, ['Dash Parr - Dodgeball Dynamo', 'Jebidiah Farnsworth - Cookie', 'Randall Boggs - Envious Coworker', 'Scrooge McDuck - Ghostly Ebenezer',
    'Luisa Madrigal - Pushing Through', 'Red Alert', 'Dumbo - Ninth Wonder of the Universe', 'Isis Vanderchill - Ice Queen of St. Canard', 'Hades - Looking for a Deal'])
    .map(n => card(n));
const p1Discard = take(pool1, ['Junior Woodchuck Guidebook', 'Dash Parr - Super Fast', 'Cheshire Cat - Inexplicable', 'Demona - Scourge of the Wyvern Clan']).map(n => card(n));
// The draw: a known top card, the rest in a fixed shuffled order.
const top1 = take(pool1, ['Luisa Madrigal - Confident Climber']);
pool1.sort(() => rnd() - 0.5);
const p1Deck = top1.concat(pool1.slice(0, 30)).map(n => card(n));   // past turns used the rest

// ---- Player 2 (the other side) ----
const pool2 = list(deck2);
pool2.push('Vixey - Forest Friend');   // the Evasive target, added for the lesson
const p2Field = take(pool2, ['Elinor - Renowned Diplomat', 'Vixey - Forest Friend', 'Nani - Stage Manager']).map(n => card(n));
const p2Hand = take(pool2, ['Pocahontas - Peacekeeper', 'Dale - Ready for His Shot', 'Ursula - Deceiver', 'Aurora - Holding Court']).map(n => card(n));
const p2Ink = take(pool2, ['Aurora - Holding Court', 'Thomas - Wide-Eyed Recruit', 'Pluto - Friendly Pooch', 'Mike Wazowski - Heroic Climber',
    'Grandmother Willow - Ancient Advisor', 'Pocahontas - Guiding the Tribe', 'Nani - Stage Manager', 'Bobby Zimuruski - Spray Cheese Kid'])
    .map(n => card(n, { exerted: false }));
const p2Discard = take(pool2, ['David - Protective Snowboarder', 'Mowgli - Man Cub', 'The Queen - Regal Monarch', 'Rapunzel - Tower Defender']).map(n => card(n));
pool2.sort(() => rnd() - 0.5);
const p2Deck = pool2.slice(0, 31).map(n => card(n));

const state = {
    activeBookmarkId: null,
    turn: 9,
    activePlayer: 0,
    inactivePlayer: 1,
    opponentHandRevealed: false,
    activeTimelineColor: null,
    turnComments: {},
    turnStartHand: { player: 0, cards: p1Hand.map(c => ({ id: c.cardId, iid: c.instanceId })) },
    cardsPlayedThisTurn: [],
    turnActions: { drawn: [], inked: [], played: [], shifted: [], discarded: [], banished: [], quested: [] },
    players: [
        { id: 0, name: 'Player 1', lore: 12, inkTotal: 9, inkReady: 9, hasMulliganed: true, deck: p1Deck, hand: p1Hand, field: p1Field, inkwell: p1Ink, discard: p1Discard },
        { id: 1, name: 'Player 2', lore: 13, inkTotal: 8, inkReady: 8, hasMulliganed: true, deck: p2Deck, hand: p2Hand, field: p2Field, inkwell: p2Ink, discard: p2Discard }
    ],
    log: [{ text: '--- Turn 9 Begins ---', isSystem: true, player: 0 }]
};
const file = {
    format: 'practice-dojo-session', version: 2, app: appVersion, id: 'tour-referee', title: 'Practice board',
    savedAt: 1791700000000,
    summary: { savedAt: 1791700000000, turn: 9, lore: [12, 13], nodes: 0, lines: 0, inks: [['amethyst', 'ruby'], ['amber', 'emerald']] },
    data: { version: 1, currentState: state, bookmarks: [], autoSaves: [], history: [], deck1: deck1 + '\n1 The Horseman Strikes!\n1 Magical Maneuvers', deck2: deck2 + '\n1 Vixey - Forest Friend' }
};
writeFileSync(outPath, gzipSync(JSON.stringify(file)));
console.log('wrote', outPath);
