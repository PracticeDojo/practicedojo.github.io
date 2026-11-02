// `node tools/app-checks.mjs`: checks the app's riskiest logic in the real page, headless.
// Exits 1 if any check fails. Needs Playwright, like the dojo-screenshots tool it runs through.
//
//   - Duels.ink imports: every sample log and replay still builds the same board
//     (turns, timeline nodes, cards per zone, lore, unknown cards).
//   - Challenges: the damage done is the damage the forecast showed.
//   - Untrusted files: session sanitising, the session codec, replay patches.
//   - Device library: the two-tab guard and sign-out removal.
//   - Replay openings: rebuilt from saves that predate them, and safe from hostile files.
//   - Auto-save: one node per turn, holding its start board, note and recap.
//
// An import fingerprint changed on purpose (a parser fix)? Run with --update to print the
// new ones, check them, and paste them into IMPORTS below.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const IMPORTS = {
    // "unknown" counts cards the log hides (the opponent's hand and deck) as well as unresolved names.
    'app/defaults/examples/duels-ink-log.txt': 'turns 34 · nodes 34 · P1 deck 31 hand 1 field 2 ink 11 discard 15 lore 21 · P2 deck 32 hand 1 field 3 ink 11 discard 13 lore 12 · unknown 63',
    'docs/samples/log_example_v01.md': 'turns 34 · nodes 34 · P1 deck 31 hand 1 field 2 ink 11 discard 15 lore 21 · P2 deck 32 hand 1 field 3 ink 11 discard 13 lore 12 · unknown 63',
    'docs/samples/new_log_20261004.txt': 'turns 26 · nodes 26 · P1 deck 33 hand 1 field 4 ink 10 discard 11 lore 20 · P2 deck 36 hand 0 field 5 ink 8 discard 10 lore 14 · unknown 72',
    'docs/samples/019ea30a-6bbf-7518-8736-fd4db478b072_p1.json': 'turns 19 · nodes 19 · P1 deck 39 hand 2 field 6 ink 5 discard 5 lore 20 · P2 deck 42 hand 1 field 2 ink 4 discard 9 lore 18 · unknown 43',
    'docs/samples/01a08b6d-cb54-743f-9bfd-debe26bb528a_p1.replay.gz': 'turns 26 · nodes 26 · P1 deck 33 hand 1 field 4 ink 10 discard 11 lore 20 · P2 deck 36 hand 0 field 5 ink 8 discard 10 lore 14 · unknown 38',
    // Ends turns with "end of turn" prompts: the turn passes on a later frame, not on END_TURN.
    'docs/samples/01a15b0a-313b-73d3-846f-37752210870b_p1.replay.gz': 'turns 24 · nodes 24 · P1 deck 38 hand 0 field 4 ink 5 discard 13 lore 19 · P2 deck 37 hand 0 field 8 ink 6 discard 9 lore 20 · unknown 37'
};

// --- In the page (steps module for .claude/skills/dojo-screenshots/shoot.mjs) ---------------
export default async (page) => {
    const results = await page.evaluate(async (IMPORTS) => {
        const out = [];
        const check = (name, got, want) => out.push({ name, ok: got === want, got: String(got), want: String(want) });

        // Imports: the same pipeline as Import log, without putting the game on the board.
        for (const path of Object.keys(IMPORTS)) {
            let got;
            try {
                const text = await App.decodeMaybeGzip(await (await fetch('/' + path)).arrayBuffer());
                const fmt = App.detectLogFormat(text);
                let session, turns;
                if (fmt.type === 'replay') { session = App.buildSessionFromReplay(fmt.data); turns = session._turnCount; }
                else { const parsed = App.parseDojoLog(text); session = App.buildSessionFromLog(parsed); turns = parsed.turns.length; }
                const st = App.decompressState(session.currentState);
                const zones = ['deck', 'hand', 'field', 'inkwell', 'discard'];
                let unknown = 0;
                const side = (p) => zones.map(z => { (p[z] || []).forEach(c => { if (!App.cardDB[c.cardId]) unknown++; }); return `${z === 'inkwell' ? 'ink' : z} ${(p[z] || []).length}`; }).join(' ') + ` lore ${p.lore}`;
                const sides = st.players.map((p, i) => `P${i + 1} ${side(p)}`).join(' · ');
                got = `turns ${turns} · nodes ${session.bookmarks.length} · ${sides} · unknown ${unknown}`;
                const actives = session.bookmarks.map(b => / (P[12]) Active$/.exec(b.name || '')?.[1]).filter(Boolean);
                check('turns alternate ' + path.split('/').pop(), actives.every((a, i) => i === 0 || a !== actives[i - 1]), true);
            } catch (e) { got = 'threw: ' + e.message; }
            check('import ' + path.split('/').pop(), got, IMPORTS[path]);
        }

        // Challenge: what the forecast says is what happens.
        const me = App.state.players[App.state.activePlayer], them = App.state.players[1 - App.state.activePlayer];
        const isChar = (c) => (App.cardDB[c.cardId] || {}).type === 'Character';
        const a = me.field.find(isChar), d = them.field.find(isChar);
        if (!a || !d) check('challenge: the demo has a character on each side', false, true);
        else {
            const o = App.challengeOutcome(a.instanceId, d.instanceId);
            const before = [a.damage || 0, d.damage || 0];
            App.performChallenge(a.instanceId, d.instanceId);
            const fa = App.findCard(a.instanceId).card, fd = App.findCard(d.instanceId).card;
            check('challenge: damage taken = forecast', (fa.damage - before[0]) + '/' + (fd.damage - before[1]), o.toAtt + '/' + o.toDef);
            App.undo();
        }

        // A stranger's session file: ids that could break out of markup are re-issued, CSS url() dropped.
        const evil = App.sanitizeSessionData({
            currentState: { activeBookmarkId: 'x" onmouseover="alert(1)', players: [{ name: 7 }] },
            bookmarks: [{ id: 'x" onmouseover="alert(1)', parentId: '<b>', name: 1, color: 'url(https://evil.example/x.png)', gradient: 'red;}body{display:none' }],
            history: ['ok', { not: 'a string' }]
        });
        const b = evil.bookmarks[0];
        check('sanitise: unsafe node id re-issued', /^[A-Za-z0-9_-]+$/.test(b.id) && b.id === evil.currentState.activeBookmarkId, true);
        check('sanitise: CSS url() and breakouts dropped', `${b.color}|${b.gradient}`, 'null|null');
        check('sanitise: names become strings', typeof evil.currentState.players[0].name + typeof b.name, 'stringstring');
        check('sanitise: history keeps strings only', evil.history.length, 1);

        // The session codec rejects what isn't a session, and files from a newer app.
        const rejects = (text) => { try { DojoLibrary.decodeText(text); return false; } catch (e) { return true; } };
        check('codec: rejects junk, non-sessions and newer versions',
            [rejects('nope'), rejects('{"a":1}'), rejects(JSON.stringify({ format: 'practice-dojo-session', version: 3, data: { currentState: {}, bookmarks: [] } }))].join(), 'true,true,true');

        // Replay patches can't reach Object.prototype.
        App.applyJsonPatch({}, [{ op: 'add', path: '/__proto__/dojoPolluted', value: 1 }, { op: 'add', path: '/constructor/prototype/dojoPolluted', value: 1 }]);
        check('replay patch: no prototype pollution', ({}).dojoPolluted, undefined);

        // Replay openings (Feature 64): the old Set 13 demo (no longer in the manifest, kept
        // as a fixture) predates recorded openings, so they are rebuilt. Player 1 drew 4 on
        // turn 1 and put 3 on the bottom; the rebuilt deck must start with those 4 in draw
        // order. Player 2's draw-step card goes back on top.
        const demo = { file: 'set13_example.dojo.json.gz' };
        const decks = App._openingsFromSession((await DojoLibrary.fetchDemo(demo)).data);
        const o1 = decks[0].openings[0] || {}, o2 = decks[1].openings[0] || {};
        check('openings: P1 rebuilt with turn 1 draws on top', `${o1.how} ${(o1.hand || []).length}+${(o1.deck || []).length} ${(o1.deck || []).slice(0, 4).join(',')}`, 'mull 3 7+53 2244,2726,2501,33');
        check('openings: P2 hand without its draw-step card', `${o2.how} ${(o2.hand || []).length}+${(o2.deck || []).length}`, 'kept 7+53');
        // A hostile file can't put unknown ids or markup in an opening.
        const bad = App._openingsFromSession({ bookmarks: [], currentState: { players: [], openings: { 0: { hand: [1, 2, 3, 4, 5, 6, 'x'], deck: [], how: 'kept' }, 1: { ...o1, how: '<img onerror=alert(1)>' } } } });
        check('openings: unknown ids and markup dropped', `${bad[0].openings.length} ${bad[1].openings[0] && bad[1].openings[0].how}`, '0 kept');

        // Deck search (Feature 66): words match by start, typo or letters in order; a card
        // match names the card; two inks mean that exact pair.
        const E = [{ name: 'Retro Leviathan', inks: ['ruby', 'emerald'], cards: ['The Leviathan - Guardian of Atlantis', 'Mickey Mouse - Best in Town'] },
            { name: 'Rockstar Aggro', inks: ['amber', 'steel'], cards: ['Mike Wazowski - Heroic Climber', 'Lantern - Birthday Surprise'] },
            { name: 'Mono', inks: ['amber'], cards: [] }];
        const ds = (q, inks) => DeckSearch.query(E, q, inks).map(r => r.entry.name + (r.cards[0] ? ' <' + r.cards[0].card + '>' : '')).join(' | ');
        check('deck search: a card, not a look-alike', ds('mickey'), 'Retro Leviathan <Mickey Mouse - Best in Town>');
        check('deck search: typo and letters in order', `${ds('leviatan')} / ${ds('lvthn')} / ${ds('lantrn')}`,
            'Retro Leviathan <The Leviathan - Guardian of Atlantis> / Retro Leviathan <The Leviathan - Guardian of Atlantis> / Rockstar Aggro <Lantern - Birthday Surprise>');
        check('deck search: one ink, an exact pair', `${ds('', ['amber'])} / ${ds('', ['amber', 'steel'])}`, 'Rockstar Aggro | Mono / Rockstar Aggro');
        // Sessions (Feature 67): either deck's inks pass the filter.
        const S2 = [{ name: 'A vs B', inkSets: [['amber', 'steel'], ['ruby', 'emerald']], cards: [] }, { name: 'C', inkSets: [], cards: [] }];
        check('session search: either deck passes', DeckSearch.query(S2, '', ['emerald', 'ruby']).map(r => r.entry.name).join(), 'A vs B');
        // Proposed plays (Feature 68): what an ability did folds under its move; a line reads as how
        // it differs from line 1.
        const pc = (name) => ({ name });
        const L1 = [{ by: 'me', family: 'playCard', card: pc('Milo Thatch') }, { by: 'me', family: 'resolveBag', card: pc('Milo Thatch'), ability: "Scholar's gambit" },
            { by: 'me', family: 'resolveBag', card: pc('Milo Thatch'), targets: [pc('Vixey')] }, { by: 'me', family: 'quest', card: pc('Max Goof') }];
        const diff = (acts) => (DojoRules.lineDiff(acts, L1) || []).map(([t]) => t).join('');
        check('plays: effects fold under their move', DojoRules.groupActs(L1).map(DojoRules.stepText).join(' | '), 'Play Milo Thatch → Vixey | Quest with Max Goof');
        check('plays: a line as how it differs from line 1', `${diff(L1.slice(0, 3))} / ${diff([L1[0], L1[1], { ...L1[2], targets: [pc('Tod')] }, L1[3]])}`,
            'Like line 1, but not quest with Max Goof / Like line 1, but Play Milo Thatch → Tod instead of Vixey');
        // Score lab (Feature 68): an imported profiles file keeps known terms and weights in range, and
        // each card in play's share adds up to the score's in-play parts.
        const labFile = JSON.stringify({ dojoLab: 1, profiles: { Default: { weights: { lore: 2 } }, ' Control ': { weights: { lore: 0.7, evil: 9, body: 1e9, hand: 'x' }, off: ['hand', 'nope'] } } });
        const labGot = DojoLab.parse(labFile);
        const labRefused = ['nope', '{}', JSON.stringify({ dojoLab: 1, profiles: {} })].map(t => { try { DojoLab.parse(t); return 'took'; } catch (e) { return 'refused'; } }).join();
        check('lab: an imported file keeps known terms only', `${JSON.stringify(labGot)} ${JSON.stringify(DojoLab.weightsFor(labGot.Control))} ${labRefused}`,
            '{"Control":{"weights":{"lore":0.7,"body":100},"off":["hand"],"terms":[]}} {"lore":0.7,"body":100,"hand":0} refused,refused,refused');
        const sc = await DojoRules.score(App.state, id => App.cardKey(id));
        const shares = Object.values(sc.cards).flat().reduce((n, x) => n + x.v, 0);
        check('lab: card shares add up to the in-play parts', `${Object.keys(sc.cards).length > 0} ${Math.abs(shares - (sc.parts.potential + sc.parts.body + sc.parts.exposed)) < 1e-9}`, 'true true');
        // Your own terms: only known values survive, a term reads as a sentence, and the engine counts
        // what it says (my cards in hand, 1 each, is my hand).
        const term = DojoLab.termOf({ name: ' Evasive  pressure ', side: 'mine', zone: 'play', where: { type: 'character', keyword: 'Evasive', state: 'ready', costMax: 99, effect: 'nope', evil: 1 }, measure: 'lore', weight: 0.3, when: 'never' });
        check('lab: a term keeps known values only', `${JSON.stringify(term)} ${DojoLab.describe(term)}`,
            '{"name":"Evasive pressure","side":"mine","zone":"play","where":{"type":"character","keyword":"Evasive","state":"ready","costMax":20},"measure":"lore","weight":0.3,"when":"always","off":false} My ready Evasive characters in play costing up to 20: lore × 0.3.');
        const hand = App.state.players[App.state.activePlayer].hand;
        const counted = (await DojoRules.score(App.state, id => App.cardKey(id), undefined, [{ side: 'mine', zone: 'hand', where: {}, measure: 'count', weight: 1 }])).terms[0];
        check('lab: the engine counts what a term says', `${counted.value} ${counted.hits.join() === hand.map(c => c.instanceId).join()}`, `${hand.length} true`);

        // Device library.
        const L = DojoLibrary, data = App.buildSessionData(), id = L.newId();
        const first = await L.saveSession({ id, title: 'check' }, { data });
        await new Promise(r => setTimeout(r, 5));
        await L.saveSession({ id, title: 'check' }, { data }); // another tab writes
        let stale;
        try { await L.saveSession({ id, title: 'check', updatedAt: first.updatedAt }, { data }); stale = 'not refused'; } catch (e) { stale = e.code; }
        check('library: a stale tab is refused', stale, 'stale');
        await L.deleteSession(id);
        const deck = (n, account, accountDirty) => L.saveDeck({ id: 'check-' + n, name: 'check-' + n, decklist: '1 x', account, accountDirty });
        await deck('clean', { revision: 1, uid: 'me' }, false);
        await deck('dirty', { revision: 1, uid: 'me' }, true);
        await deck('other', { revision: 1, uid: 'other' }, false);
        const removed = await L.deleteAccountCopies('me');
        const left = (await L.listDecks()).map(x => x.name).filter(n => n.startsWith('check-')).sort().join();
        check('library: sign-out keeps unsynced and other accounts\' copies', `${left} kept ${removed.kept}`, 'check-dirty,check-other kept 1');
        await Promise.all(['dirty', 'other'].map(n => L.deleteDeck('check-' + n)));

        // Auto-save: each turn's node is its start board (turn 1: before the mulligan) and,
        // once it ends, that turn's note and recap. Replaying a played turn branches beside it.
        document.getElementById('auto-save-turn').checked = true;
        const settle = () => { if (App.state.mulliganPending) { App.state.players[App.state.activePlayer].hasMulliganed = true; App._finishMulligan(); } };
        const node = (b) => `${b.name}${JSON.parse(b.state).mulliganPending ? ' (mull)' : ''}: ${b.comment.replace(/\s+/g, ' ')}`;
        App.startGame({ asked: true });
        settle();
        App.updateTurnComment(1, 0, 'P1 note');
        App.saveState(); App._trackAction('inked', App.state.players[0].hand[0].cardId);
        App.saveState(); App.undo(); // an undo keeps the turn's recap
        App.endTurn(); settle(); App.endTurn();
        check('auto-save: a node per turn, with its own recap', App.bookmarks.map(node).join(' | ').replace(/Drew:\*\* .*$/, 'Drew:** …'),
            'Turn 1 - Player 1 Active (mull): P1 note **Turn recap** - **Inked:** ' + App.cardDB[App.bookmarks[0].sections.inked[0]].name
            + ' | Turn 1 - Player 2 Active (mull): **Turn recap** - **Drew:** …');
        App.restoreTimeline(App.bookmarks[0].id, false, { quiet: true });
        const reopened = App.state.mulliganPending && App.state.turnComments['1-0'] === 'P1 note';
        settle(); App.endTurn();
        const twins = App.bookmarks.filter(b => b.name === 'Turn 1 - Player 1 Active');
        check('auto-save: turn 1 replays from the mulligan, as a branch', `${reopened} ${twins.length} ${twins[0].parentId === twins[1].parentId}`, 'true 2 true');
        // The recap names each challenge (defender with attacker); a session file's challenges keep card ids only.
        const fighters = Object.values(App.cardDB).filter(c => c && c.type === 'Character' && c.willpower >= 5).slice(0, 2);
        const [att, def] = fighters.map(c => App.makeCardInstance(c.id));
        App.state.players[App.state.activePlayer].field.push(att);
        App.state.players[1 - App.state.activePlayer].field.push(def);
        App.performChallenge(att.instanceId, def.instanceId);
        const readBack = App._readTurnActions({ challenged: [App.state.turnActions.challenged.at(-1), { id: {}, target: 1 }, 'x', null] });
        check('auto-save: the recap names each challenge', `${App._formatTurnActions().split('\n').pop()} | ${readBack.challenged.length}`, `- **Challenged:** ${fighters[1].name} with ${fighters[0].name} | 1`);
        // Bot opponent (Feature 68): it plays P2's turn on the demo's turn 4, and the engine hands the turn back.
        const botDemo = JSON.parse(await App.decodeMaybeGzip(await (await fetch('/app/defaults/demos/set14_example2.dojo.json.gz')).arrayBuffer()));
        App.state = App.decompressState(JSON.parse(botDemo.data.bookmarks.find(b => b.id === 'gwop5bnzw').state));
        App.history = [];
        const faceUp = (pi) => App.state.players[pi].inkwell.filter(c => c.faceUp).length;
        const upBefore = faceUp(0);
        App.setBotSpeed(50);
        App.setBot(1);
        await new Promise((done) => {
            const t0 = Date.now();
            const tick = () => (App.state.activePlayer === 0 || App.bot.note || App.bot.over || Date.now() - t0 > 90000 ? done() : setTimeout(tick, 100));
            tick();
        });
        const said = App.state.log.map(l => (l && (l.msg || l.text)) || String(l));
        check('bot: plays its turn, the engine hands it back', `${App.state.turn} ${App.state.activePlayer} ${said.some(t => /^Bot: /.test(t))} ${said.includes('Ready and draw steps (rules engine)')} ${upBefore} ${faceUp(0)} ${App.bot.note || 'ok'}`, '5 0 true true 1 0 ok');
        // Undo with the bot on pauses it; ending your turn hands the next one back to it, playing.
        const botBack = (turn) => new Promise((done) => {
            const t0 = Date.now();
            const tick = () => ((App.state.activePlayer === 0 && App.state.turn === turn && !App.bot.busy) || App.bot.note || Date.now() - t0 > 90000 ? done() : setTimeout(tick, 100));
            tick();
        });
        App.endTurn();
        await botBack(6);
        while (App.history.length && !(App.state.activePlayer === 0 && App.state.turn === 5)) App.undo();
        const pausedAfterUndo = App.bot.paused;
        App.endTurn();
        await botBack(6);
        check('bot: after Undo, ending your turn lets it play', `${pausedAfterUndo} ${App.state.turn} ${App.state.activePlayer} ${App.bot.paused} ${App.bot.note || 'ok'}`, 'true 6 0 false ok');
        // A loaded game (library, file, demo, Duels.ink import) and a new game start with the bot off.
        App._applySessionData(botDemo.data);
        const offAfterLoad = App.bot.seat;
        App.setBot(1);
        App.startGame({ asked: true });
        check('bot: a loaded or new game starts with it off', `${offAfterLoad} ${App.bot.seat} ${document.body.classList.contains('bot-on')}`, 'null null false');
        // What-if (Feature 68): a replay's import keeps both players' real moves on each turn's node, and the
        // engine replays them. The sample is a lost game: from turn 23 the real game ends as it did (19-20 on
        // turn 24), and line 2 from turn 19 (quest with Vixey instead of challenging) wins 21-9 on turn 21 (their
        // Angela, alive in this line, quests after their real moves).
        const wiReplay = JSON.parse(await App.decodeMaybeGzip(await (await fetch('/docs/samples/01a15b0a-313b-73d3-846f-37752210870b_p1.replay.gz')).arrayBuffer()));
        const wiDec = s => App.decompressState(s), wiNodes = App.buildSessionFromReplay(wiReplay).bookmarks;
        const wiTurns = DojoWhatIf.lineOf(wiNodes, wiDec).turns;
        check('what-if: the import keeps each turn\'s real moves', wiTurns.map(t => t.real.moves.length).join(' '), '2 2 3 2 3 3 4 4 4 2 2 4 3 4 3 2 4 3 4 3 4 5 4 8');
        // A text log keeps them too (each challenge once), and who won; the same game's replay (01a08b6d) the same
        // moves: without the play taken back on turn 13, or DARK DANCE's free plays on turns 13 and 17 (made by
        // the other player inside the ability, so not moves of the turn), with the boosts on turns 14, 16 and 24.
        const wiText = DojoWhatIf.lineOf(App.buildSessionFromLog(App.parseDojoLog(await (await fetch('/docs/samples/new_log_20261004.txt')).text())).bookmarks, wiDec);
        const wiDance = DojoWhatIf.lineOf(App.buildSessionFromReplay(JSON.parse(await App.decodeMaybeGzip(await (await fetch('/docs/samples/01a08b6d-cb54-743f-9bfd-debe26bb528a_p1.replay.gz')).arrayBuffer()))).bookmarks, wiDec);
        const wiCounts = (l) => l.turns.map(t => t.real.moves.length).join(' ');
        check('what-if: a text log keeps each turn\'s moves, and who won', `${wiText.winner} ${wiCounts(wiText)} | replay ${wiCounts(wiDance) === wiCounts(wiText) ? 'the same' : wiCounts(wiDance)}`,
            '0 1 2 2 2 2 3 2 4 3 5 2 7 2 4 2 5 2 4 2 3 4 5 4 6 3 1 | replay the same');
        // Replayed, turn 13's DARK DANCE has P1 (whose Dumbo it shuffles away) play Cheshire Cat from the discard.
        const wiK13 = wiDance.turns.findIndex(t => t.turn === 13);
        const wiT13 = (await DojoRules.whatIf(DojoWhatIf.filled(wiDance.turns, wiK13, id => !!App.cardDB[id]), id => App.cardKey(id),
            { me: 1, real: Object.fromEntries(wiDance.turns.map(t => [t.turn, t.real])), first: 'real', exact: true, horizon: 13, nodes: 300, laterNodes: 120, margin: 1 })).turns[0];
        // Boost puts the top card of the deck under a character: replayed from turn 15, turn 16's boost (Ursula) leaves
        // the deck and the lore as the real turn 17 has them (it was a lore short, the deck a card behind).
        const wiK15 = wiDance.turns.findIndex(t => t.turn === 15), wiReal17 = wiDance.turns.find(t => t.turn === 17).state;
        const wiT16 = (await DojoRules.whatIf(DojoWhatIf.filled(wiDance.turns, wiK15, id => !!App.cardDB[id]), id => App.cardKey(id),
            { me: 0, real: Object.fromEntries(wiDance.turns.map(t => [t.turn, t.real])), first: 'real', exact: true, horizon: 16, nodes: 300, laterNodes: 120, margin: 1 })).turns.at(-1).state;
        const wiTop = (st) => st.players[0].deck.slice(0, 3).map(c => App.cardDB[c.cardId].name).join(', ');
        check('what-if: a boost is replayed', `${wiT16.players.map(p => p.lore).join('-')} ${wiTop(wiT16)} | real ${wiReal17.players.map(p => p.lore).join('-')} ${wiTop(wiReal17)}`, '6-7 Gaston, Dumbo, Hades | real 6-7 Gaston, Dumbo, Hades');
        // After a shuffle (turn 17's DARK DANCE shuffles the owner's Ursula into their deck), the real draws: replayed
        // from turn 15 it ends as the real game did, 20-14 (with the engine's own shuffle, 9-14 and 15 moves missed).
        const wiZone = (z) => Object.fromEntries(wiDance.turns.map(t => [t.turn, t.state.players.map(p => p[z].map(c => App.cardKey(c.cardId) || '?'))]));
        const wiShuffled = await DojoRules.whatIf(DojoWhatIf.filled(wiDance.turns, wiK15, id => !!App.cardDB[id]), id => App.cardKey(id),
            { me: 0, real: Object.fromEntries(wiDance.turns.map(t => [t.turn, t.real])), decks: wiZone('deck'), hands: wiZone('hand'), first: 'real', exact: true, horizon: 26, nodes: 300, laterNodes: 120, margin: 1 });
        check('what-if: after a shuffle, the real draws', `${wiShuffled.winner} ${wiShuffled.lore.join('-')} | missed ${wiShuffled.turns.reduce((n, t) => n + (t.missed || []).length, 0)}`, '0 20-14 | missed 1');
        // A text log's choices, from its lines: an option ("chose "Play a character""), a card sent back to a deck, a card
        // played inside the other's ability, an unnamed "exerts a character" taken as the next challenge's target.
        const wiSay = (turn) => wiText.turns.find(t => t.turn === turn).real.choices.map(c => (c.name ? c.name.split(' - ')[0] : `"${c.option}"`) + (c.by != null ? `@${c.by}` : '')).join(', ');
        check('what-if: a text log\'s choices', `T6 ${wiSay(6)} | T13 ${wiSay(13)} | T22 ${wiSay(22)}`, 'T6 Mickey Mouse@0 | T13 "Playacharacter", Dumbo@1, Cheshire Cat@0 | T22 "Putonbottom", Mickey Mouse & Minnie Mouse@0');
        // With them (and the real draws after both DARK DANCEs), the text log replays from turn 13 as its replay does.
        const wiTextZone = (z) => Object.fromEntries(wiText.turns.map(t => [t.turn, t.state.players.map(p => p[z].map(c => App.cardKey(c.cardId) || '?'))]));
        const wiK13t = wiText.turns.findIndex(t => t.turn === 13);
        const wiFromText = await DojoRules.whatIf(DojoWhatIf.filled(wiText.turns, wiK13t, id => !!App.cardDB[id]), id => App.cardKey(id),
            { me: 1, real: Object.fromEntries(wiText.turns.map(t => [t.turn, t.real])), decks: wiTextZone('deck'), hands: wiTextZone('hand'), first: 'real', exact: true, horizon: 26, nodes: 300, laterNodes: 120, margin: 1 });
        check('what-if: a text log replays through DARK DANCE', `${wiFromText.winner} ${wiFromText.lore.join('-')} | missed ${wiFromText.turns.reduce((n, t) => n + (t.missed || []).length, 0)}`, '0 20-14 | missed 1');
        check('what-if: a free play inside the other\'s ability is the ability\'s', `${wiT13.state.players[0].field.map(c => App.cardDB[c.cardId].name).join(', ')} | missed ${wiT13.missed.length}`, 'Hamm, Cheshire Cat | missed 0');
        // The game's line: the replay alone (lost, one line; What-if's own branches don't count), cut short
        // (unfinished), with a turn played again by hand that wins (forked: no line until one is picked), that
        // branch picked, and a turn before the fork picked (the line played first). turns · winner · forked · picked
        const wiTwin = { ...wiNodes[19], id: 'wi-twin', real: undefined };
        const wiTree = [...wiNodes, wiTwin, { id: 'wi-won', parentId: 'wi-twin', name: 'Game Over - P1 Wins!', isVictory: true, playerIdx: 0, state: wiNodes[19].state }];
        const wiOurs = { ...wiNodes[5], id: 'wi-ours', parentId: wiNodes[4].id, name: 'Turn 6 – P2 Active (What-if from turn 5, line 1)' };
        const wiLineOf = (nodes, pick) => { const l = DojoWhatIf.lineOf(nodes, wiDec, pick); return `${l.turns.length} ${l.winner} ${l.branched} ${l.at}`; };
        check('what-if: the game\'s line, where it forks, and how it ends', [wiLineOf([...wiNodes, wiOurs]), wiLineOf(wiNodes.slice(0, 18)), wiLineOf(wiTree), wiLineOf(wiTree, 'wi-twin'), wiLineOf(wiTree, wiNodes[3].id)].join(' | '),
            '24 1 false 23 | 18 null false 17 | 0 null true -1 | 20 0 true 19 | 24 1 true 3');
        // A game played here counts rounds (both players' turn 1); the engine counts each player's turn. The
        // demo's line to its first win: its first turns, its end, and the number two turns past it.
        const wiDemoNodes = botDemo.data.bookmarks, wiLeaf = wiDemoNodes.find(b => b.isVictory && !wiDemoNodes.some(c => c.parentId === b.id));
        const wiDemo = DojoWhatIf.lineOf(wiDemoNodes, wiDec, wiLeaf.id), wiEnd = wiDemo.turns[wiDemo.turns.length - 1];
        check('what-if: a game played here counts rounds, the engine each turn', `${wiDemo.turns.slice(0, 4).map(t => `${t.label}=${t.turn}`).join(' ')} … ${wiEnd.label}=${wiEnd.turn} w${wiDemo.winner} +2: ${wiDemo.label(wiEnd.turn + 2)}`, '1=1 1=2 2=3 2=4 … 11=21 w0 +2: 12');
        // Without a record of the moves, the search plays their turns, and nothing is "beyond the real game".
        const wiK = wiDemo.turns.length - 4, wiFree = await DojoRules.whatIf(DojoWhatIf.filled(wiDemo.turns, wiK, id => !!App.cardDB[id]), id => App.cardKey(id),
            { me: wiDemo.turns[wiK].active, real: {}, first: 0, horizon: wiDemo.turns[wiK].turn + 3, nodes: 300, laterNodes: 120, margin: 1 });
        check('what-if: without a record, the search plays their turns', `${wiFree.turns.map(t => t.how).join(' ')} ${wiFree.turns.some(t => (t.acts || []).some(a => a.extra))} ${wiFree.lore.join('-')}`, 'line search search search false 18-19');
        const wiReal = Object.fromEntries(wiTurns.map(t => [t.turn, t.real]));
        const wiAt = (turn) => DojoWhatIf.filled(wiTurns, wiTurns.findIndex(t => t.turn === turn), id => !!App.cardDB[id]);
        const wiOpts = { me: 0, real: wiReal, nodes: 300, laterNodes: 120, margin: 1 };
        const wiExact = await DojoRules.whatIf(wiAt(23), id => App.cardKey(id), { ...wiOpts, first: 'real', exact: true, horizon: 24 });
        // On turn 13 a quest and a discard were taken back (FREE_UNDO, CHOICE_UNDO): replayed, they made it 13-20.
        const wiUndo = await DojoRules.whatIf(wiAt(13), id => App.cardKey(id), { ...wiOpts, first: 'real', exact: true, horizon: 24 });
        check('what-if: a move taken back isn\'t replayed', `${wiUndo.winner} ${wiUndo.lore.join('-')} ${wiUndo.turns.reduce((n, t) => n + (t.missed || []).length, 0)}`, '1 19-20 0');
        const wiLine = await DojoRules.whatIf(wiAt(19), id => App.cardKey(id), { ...wiOpts, first: 1, horizon: 28 });
        // The control: the real move, then the search, with their real turns finished by the search. It must
        // carry on to the end (once, a search that added nothing left the engine on a position it had looked at).
        const wiControl = await DojoRules.whatIf(wiAt(21), id => App.cardKey(id), { ...wiOpts, first: 'real', horizon: 28 });
        check('what-if: your real move, then the search, loses as the game did', `${wiControl.winner} ${wiControl.lore.join('-')} t${wiControl.turns[wiControl.turns.length - 1].turn}`, '1 19-20 t24');
        check('what-if: the real game replays, and a line from turn 19 wins', `${wiExact.winner} ${wiExact.lore.join('-')} | ${wiLine.winner} ${wiLine.lore.join('-')} t${wiLine.turns[wiLine.turns.length - 1].turn}`, '1 19-20 | 0 21-9 t21');
        // Its ink turns face down when its turn begins, and stays so through its moves: on your turn 4, only
        // what it inked on its turn 3 is face up, none of the ink it had before.
        settle();
        App.setBot(1);
        let oldInk = [];
        const t0 = Date.now();
        while (!(App.state.turn === 4 && App.state.activePlayer === 0 && !App.bot.busy) && !App.bot.note && Date.now() - t0 < 90000) {
            if (App.state.activePlayer === 0 && !App.bot.busy && !App.state.mulliganPending) {
                if (App.state.turn === 3) oldInk = App.state.players[1].inkwell.map(c => c.instanceId);
                App.endTurn();
            }
            await new Promise(r => setTimeout(r, 50));
        }
        const backUp = App.state.players[1].inkwell.filter(c => c.faceUp && oldInk.includes(c.instanceId)).length;
        check('bot: its ink turns face down too', `${App.state.turn} ${oldInk.length > 0} ${backUp} ${App.bot.note || 'ok'}`, '4 true 0 ok');
        App.setBot(null);
        return out;
    }, IMPORTS);
    writeFileSync(process.env.APP_CHECKS_OUT, JSON.stringify(results));
};

// --- From the command line ------------------------------------------------------------------
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
    const dir = mkdtempSync(join(tmpdir(), 'app-checks-'));
    const out = join(dir, 'results.json');
    const r = spawnSync(process.execPath, [
        join(ROOT, '.claude/skills/dojo-screenshots/shoot.mjs'),
        '--demo', '--widths', '1440', '--themes', 'day', '--steps', fileURLToPath(import.meta.url), '--out', dir
    ], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, APP_CHECKS_OUT: out } });
    let rows;
    try { rows = JSON.parse(readFileSync(out, 'utf8')); } catch (e) {
        console.error(r.stdout || '', r.stderr || '', '\napp-checks: the headless run gave no results (see above).');
        process.exit(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
    if (process.argv.includes('--update')) {
        rows.filter(x => x.name.startsWith('import ')).forEach(x => console.log(`${x.name.slice(7)}: '${x.got}'`));
        process.exit(0);
    }
    for (const x of rows) console.log(`${x.ok ? 'pass' : 'FAIL'}  ${x.name}${x.ok ? '' : `\n      got:  ${x.got}\n      want: ${x.want}`}`);
    const fails = rows.filter(x => !x.ok).length;
    console.log(`\n${rows.length - fails} pass, ${fails} fail.`);
    process.exit(fails ? 1 : 0);
}
