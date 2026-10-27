// The Dojo's side of the Lorcana engine (Feature 68, Phase 0 spike). Bundled with the engine by
// tools/build-engine.mjs into app/vendor/lorcana-engine/engine.worker.js.
//
// Runs as a classic Web Worker (messages {id, op, args} → {id, ok, result | error}) and, in Node or
// on a page, as a plain script that sets globalThis.DojoEngine to the same ops.
//
// Board shape the ops take and return (Dojo-shaped, cards named by their key, "<setCode>-<number>|<full name>"):
//   { turn, active: 0|1, players: [{ deck, hand, discard: Sn[], field: FieldCard[],
//     inkwell: { sn, exerted }[], lore, inkDrops }] }   deck[0] is the top card, as in the Dojo.
//   FieldCard = { sn, exerted, damage, drying, location: index into field | null, under: Sn[], mods }
//   mods: the Dojo's card modifiers (Feature 61), { stat, value, until: 'turn' | 'next' | 'always' }.
//   inkedThisTurn (optional): how many cards the player whose turn it is has inked this turn.
import {
  createRecordCardCatalog,
  getAutomatedActionStrategyOption,
  getLorcanaServerAuthoritativeSnapshot,
  loadLorcanaServerAuthoritativeState,
} from "@tcg/lorcana-engine";
import {
  CANONICAL_PLAYER_ONE,
  CANONICAL_PLAYER_TWO,
  LorcanaMultiplayerTestEngine,
} from "@tcg/lorcana-engine/testing";

type Def = { id: string; name: string; version?: string; printings?: { setCode: string; collectorNumber: string; rarity?: string }[] } & Record<string, unknown>;
type Mod = { stat: "strength" | "willpower" | "lore" | "challenger" | "resist"; value: number; until: "turn" | "next" | "always" };
type FieldCard = { sn: string; exerted?: boolean; damage?: number; drying?: boolean; location?: number | null; under?: string[]; mods?: Mod[] };
type BoardPlayer = { deck: string[]; hand: string[]; discard: string[]; field: FieldCard[]; inkwell: { sn: string; exerted?: boolean }[]; lore: number; inkDrops?: number };
type Board = { turn: number; active: 0 | 1; inkedThisTurn?: number; players: [BoardPlayer, BoardPlayer] };

const PIDS = [CANONICAL_PLAYER_ONE, CANONICAL_PLAYER_TWO] as const;
const now = () => performance.now();

// A card is named by a key, "<setCode>-<number>|<full name>" (the Dojo builds it from LorcanaJSON).
// The name decides: in the engine's data, promo, special and challenge printings reuse main-set
// numbers ("13-12" is Pocahontas, a special Mushu and a promo Tigger), so a number alone can name
// another card. The number only picks among entries with that name, and is the fallback, among
// regular printings, when the name doesn't match.
const REGULAR = new Set(["common", "uncommon", "rare", "super_rare", "legendary", "epic", "enchanted", "iconic"]);
let defsBySn = new Map<string, Def>(); // regular printings only
let defsByName = new Map<string, Def[]>();
const keysOf = new WeakMap<LorcanaMultiplayerTestEngine, Map<string, string>>(); // engine id → the key it was hydrated from

const norm = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
const snOf = (setCode: string, number: string) => `${setCode.replace(/^set/, "")}-${number}`;
const regular = (d: Def, sn?: string) => (d.printings ?? []).some((p) => REGULAR.has(p.rarity ?? "") && (!sn || snOf(p.setCode, p.collectorNumber) === sn));

function init(cards: Def[]) {
  const t = now();
  defsBySn = new Map();
  defsByName = new Map();
  for (const card of cards) {
    for (const p of card.printings ?? []) {
      const sn = snOf(p.setCode, p.collectorNumber);
      if (REGULAR.has(p.rarity ?? "") && !defsBySn.has(sn)) defsBySn.set(sn, card);
    }
    const full = norm(card.version ? `${card.name} - ${card.version}` : card.name);
    const list = defsByName.get(full);
    if (list) list.push(card);
    else defsByName.set(full, [card]);
  }
  return { cards: cards.length, printings: defsBySn.size, ms: now() - t };
}

function byName(name: string, sn?: string): Def | undefined {
  const named = defsByName.get(norm(name));
  if (!named) return undefined;
  return named.find((d) => regular(d, sn)) ?? named.find((d) => regular(d)) ?? named[0];
}

function defOf(key: string): Def | undefined {
  const bar = key.indexOf("|");
  const sn = bar < 0 ? key : key.slice(0, bar);
  return (bar < 0 ? undefined : byName(key.slice(bar + 1), sn)) ?? defsBySn.get(sn);
}

// Which engine card each key resolves to (for checks): full names, or null.
function names(keys: string[]) {
  return keys.map((k) => {
    const d = defOf(k);
    return d ? (d.version ? `${d.name} - ${d.version}` : d.name) : null;
  });
}

// "4 Higgins - Undercover Officer" → 4 × that definition. shortcut: exact "Name - Version" only;
// the real bridge goes through the Dojo's card DB and set-number ids instead.
function resolveDeck(text: string) {
  const cards: Def[] = [];
  const missing: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^(\d+)\s+(.+?)(?:\s+\([\w-]+\))?$/);
    if (!m) continue;
    const def = byName(m[2]);
    if (!def) missing.push(m[2]);
    else for (let i = 0; i < Number(m[1]); i++) cards.push(def);
  }
  return { cards, missing };
}

const fixtureOptions = (seed: string, skipPreGame: boolean) => ({
  seed,
  skipPreGame,
  capturePatches: false,
  includeSpectator: false,
  validateSync: false,
  timeControl: { mode: "none" as const },
});

const engineOf = (match: LorcanaMultiplayerTestEngine) => match.asServer();
// The planner's executor is protected upstream; search needs to apply one chosen candidate.
const applyCandidate = (server: unknown, actorId: string, candidate: unknown) =>
  (server as { executeAutomatedActionCandidate(a: string, c: unknown, o: object): { success: boolean } })
    .executeAutomatedActionCandidate(actorId, candidate, { autoBagDrainResolverScope: "acting-player" });

function stats(times: number[]) {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  return { n: times.length, total: sum, mean: times.length ? sum / times.length : 0, p50: at(0.5), p95: at(0.95), max: at(1) };
}

// A whole bot-vs-bot game from two decklists.
function botGame(args: { deck1: string; deck2: string; seed?: string; strategy?: string; maxActions?: number }) {
  const t0 = now();
  const d1 = resolveDeck(args.deck1);
  const d2 = resolveDeck(args.deck2);
  if (d1.missing.length || d2.missing.length) return { error: "unresolved", missing: [...d1.missing, ...d2.missing] };
  const match = LorcanaMultiplayerTestEngine.createWithFixture(
    { deck: d1.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    { deck: d2.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    fixtureOptions(args.seed ?? "dojo-spike", false),
  );
  const setupMs = now() - t0;
  const server = engineOf(match);
  const strategy = args.strategy ? getAutomatedActionStrategyOption(args.strategy)?.strategy : undefined;
  const times: number[] = [];
  const turnTimes: number[] = [];
  let failures = 0;
  const fallbacks: Record<string, number> = {};
  const families: Record<string, number> = {};
  const blocked: unknown[] = [];
  let turn = server.getTurnNumber();
  let turnStart = now();
  const max = args.maxActions ?? 2000;
  while (!server.isGameOver() && times.length < max) {
    const t = now();
    const r = server.takeAutomatedActionForCurrentActor(strategy ? { strategy } : {});
    times.push(now() - t);
    if (!r.finalResult.success) failures++;
    if (r.fallbackTaken) {
      const key = `${r.fallbackTaken}${r.blocked ? `:${r.blocked.reason}` : ""}`;
      fallbacks[key] = (fallbacks[key] ?? 0) + 1;
      if (r.fallbackTaken === "concede") {
        blocked.push({
          turn: server.getTurnNumber(),
          blocked: r.blocked,
          skips: r.unsupportedSkips.slice(0, 4),
          rejects: r.validationSkips.slice(0, 4),
          diagnostics: r.diagnostics.slice(0, 6),
          bag: server.getBagEffects().map((b) => {
            const src = (b as { sourceId?: string }).sourceId;
            const def = src ? match.getCardDefinition(src) : undefined;
            return { source: def ? `${def.name} - ${(def as Def).version ?? ""}` : src, bag: JSON.stringify(b).slice(0, 400) };
          }),
        });
      }
    }
    if (r.selectedCandidate) families[r.selectedCandidate.family] = (families[r.selectedCandidate.family] ?? 0) + 1;
    if (server.getTurnNumber() !== turn) {
      turnTimes.push(now() - turnStart);
      turn = server.getTurnNumber();
      turnStart = now();
    }
  }
  const status = (server.getState() as unknown as { ctx: { status: { reason?: string } } }).ctx.status;
  return {
    setupMs,
    winner: server.getWinner() ?? null,
    reason: status.reason ?? null,
    lore: PIDS.map((p) => server.getLore(p)),
    turns: server.getTurnNumber(),
    gameOver: server.isGameOver(),
    failures,
    fallbacks,
    families,
    blocked,
    action: stats(times),
    turn: stats(turnTimes),
    totalMs: now() - t0,
  };
}

// Dojo board → engine. Engine instance ids are the fixture's t000001… in ingestion order
// (deck, hand, play + each card's cardsUnder, inkwell, discard; player one then two), so they
// can be computed up front: that's how locations are pointed at, and how `pos` maps each engine
// card back to its Dojo place ("<player>:<zone>:<index>"). Cards the engine doesn't know become
// cost-0 placeholders; their ids are in `unknownIds`.
function hydrate(board: Board, seed = "dojo-hydrate") {
  const t0 = now();
  const unknown: string[] = [];
  const unknownIds = new Set<string>();
  const pos = new Map<string, string>();
  const keys = new Map<string, string>();
  let seq = 1;
  const at = (place: string, sn: string) => {
    const id = `t${String(seq++).padStart(6, "0")}`;
    const d = defOf(sn);
    pos.set(id, place);
    keys.set(id, sn);
    if (!d) {
      unknown.push(sn);
      unknownIds.add(id);
    }
    return { id, def: d ?? { id: `unknown:${sn}`, name: `Unknown ${sn}`, cardType: "item", cost: 0, inkable: true } };
  };
  const inkIds: string[][] = [];
  const modded: [string, Mod[]][] = [];
  const states = board.players.map((p, pi) => {
    // The engine's deck top is the end of its array; the Dojo's is index 0.
    const deck = p.deck.map((sn, i) => [sn, i] as const).reverse().map(([sn, i]) => at(`${pi}:deck:${i}`, sn).def);
    const hand = p.hand.map((sn, i) => at(`${pi}:hand:${i}`, sn).def);
    const fieldIds: string[] = [];
    const play = p.field.map((c, i) => {
      const self = at(`${pi}:field:${i}`, c.sn);
      fieldIds.push(self.id);
      if (c.mods?.length) modded.push([self.id, c.mods]);
      const under = (c.under ?? []).map((sn, j) => at(`${pi}:field:${i}:under:${j}`, sn).def);
      return { card: self.def, exerted: !!c.exerted, damage: c.damage ?? 0, isDrying: !!c.drying, cardsUnder: under, _loc: c.location };
    });
    for (const entry of play) {
      if (entry._loc != null) (entry as Record<string, unknown>).atLocation = fieldIds[entry._loc];
      delete (entry as Record<string, unknown>)._loc;
    }
    inkIds[pi] = [];
    const inkwell = p.inkwell.map((c, i) => {
      const ink = at(`${pi}:inkwell:${i}`, c.sn);
      inkIds[pi].push(ink.id);
      return { card: ink.def, exerted: !!c.exerted };
    });
    const discard = p.discard.map((sn, i) => at(`${pi}:discard:${i}`, sn).def);
    return { deck, hand, play, inkwell, discard, lore: p.lore, inkDrops: p.inkDrops ?? 0 };
  });
  const match = LorcanaMultiplayerTestEngine.createWithFixture(states[0], states[1], fixtureOptions(seed, true));
  keysOf.set(match, keys);
  // Whose turn it is (the fixture always starts player one on turn 1), and what they've done in it.
  const server = engineOf(match);
  const state = structuredClone(server.getState()) as unknown as {
    ctx: { status: Record<string, unknown>; priority: { holder: string }; zones: { private: { cardMeta: Record<string, Record<string, Record<string, number> | undefined>> } } };
    G: { turnMetadata: { inkedThisTurn: string[] }; continuousEffects: { nextSeq: number; instances: unknown[]; byTarget: Record<string, unknown[]> } };
  };
  state.ctx.status.turn = board.turn;
  state.ctx.status.turnOwnerId = PIDS[board.active];
  state.ctx.priority.holder = PIDS[board.active];
  // The Dojo knows how many cards were inked this turn, not which: the newest ink cards.
  const inked = Math.min(board.inkedThisTurn ?? 0, inkIds[board.active].length);
  state.G.turnMetadata.inkedThisTurn = inked ? inkIds[board.active].slice(-inked) : [];
  // The Dojo's modifiers, as the engine's own: stat modifiers for strength, willpower and lore,
  // temporary keywords for Challenger and Resist. "Until my next turn" lasts through the next turn.
  const lastTurn = (until: Mod["until"]) => (until === "turn" ? board.turn : until === "next" ? board.turn + 1 : 1_000_000);
  const ce = state.G.continuousEffects;
  for (const [id, mods] of modded) {
    for (const m of mods) {
      if (!Number.isFinite(m.value) || !m.value) continue;
      if (m.stat === "strength" || m.stat === "willpower" || m.stat === "lore") {
        const effect = {
          id: `ce_${ce.nextSeq++}`,
          kind: "stat-modifier",
          sourceId: id,
          targetId: id,
          stat: m.stat,
          modifier: m.value,
          duration: m.until === "turn" ? "this-turn" : "until-start-of-next-turn",
          createdAtTurn: board.turn,
          expiresAtTurn: lastTurn(m.until),
        };
        ce.instances.push(effect);
        (ce.byTarget[id] ??= []).push(effect);
      } else if (m.stat === "challenger" || m.stat === "resist") {
        const kw = m.stat === "challenger" ? "Challenger" : "Resist";
        const meta = (state.ctx.zones.private.cardMeta[id] ??= {});
        meta.temporaryKeywords = { ...meta.temporaryKeywords, [kw]: lastTurn(m.until) };
        meta.temporaryKeywordStarts = { ...meta.temporaryKeywordStarts, [kw]: 1 };
        meta.temporaryKeywordValues = { ...meta.temporaryKeywordValues, [kw]: (meta.temporaryKeywordValues?.[kw] ?? 0) + m.value };
      }
    }
  }
  match.loadState(state as never);
  return { match, pos, unknownIds, ms: now() - t0, unknown };
}

const PLAYS = new Set(["playCard", "singCard", "shiftCard"]);
const WITH_TARGETS = new Set(["challenge", "shiftCard", "singCard", "moveCharacterToLocation"]);

// What the player whose turn it is may do on this board, card by card, keyed by Dojo place:
//   { cards: { "0:hand:2": { moves: ["playCard", "putCardIntoInkwell"], targets?: { challenge: [...] },
//     why?: <the engine's PlayCardDisabledReason> } }, moves: ["passTurn", ...] (no card needed) }
function analyze(args: { board: Board }) {
  const t0 = now();
  const { match, pos: allPos, unknownIds, unknown } = hydrate(args.board);
  const pos = new Map([...allPos].filter(([id]) => !unknownIds.has(id)));
  const hydrateMs = now() - t0;
  const client = match.asLorcanaPlayer(PIDS[args.board.active]);
  type CardView = { moves: string[]; targets?: Record<string, string[]>; why?: unknown };
  const cards: Record<string, CardView> = {};
  const view = (place: string) => (cards[place] ??= { moves: [] });
  const free: string[] = [];
  for (const m of client.getAvailableMoves()) {
    if (!m.selectableCardIds.length) free.push(m.moveId);
    for (const id of m.selectableCardIds) {
      const place = pos.get(id);
      if (!place) continue;
      const v = view(place);
      v.moves.push(m.moveId);
      if (!WITH_TARGETS.has(m.moveId)) continue;
      const targets = client.getMoveOptions(m.moveId, id)
        .flatMap((o) => (o.kind === "card" ? [pos.get(o.cardId)] : o.kind === "singTogether" ? o.singers.map((s) => pos.get(s.cardId)) : []))
        .filter((x): x is string => !!x);
      (v.targets ??= {})[m.moveId] = targets;
    }
  }
  // Why each card in hand can't be played.
  const hand = `${args.board.active}:hand:`;
  for (const [id, place] of pos) {
    if (!place.startsWith(hand) || cards[place]?.moves.some((m) => PLAYS.has(m))) continue;
    const why = client.getPlayCardDisabledReason(id);
    if (why) view(place).why = why;
  }
  return { ms: now() - t0, hydrateMs, unknown, cards, moves: free };
}

// Engine → Dojo board (the same shape hydrate takes).
function project(match: LorcanaMultiplayerTestEngine): Board {
  const state = match.asServer().getState() as unknown as {
    ctx: { status: { turn: number; turnOwnerId?: string }; priority: { holder: string }; zones: { private: { zoneCards: Record<string, string[]>; cardMeta: Record<string, Record<string, unknown>> } } };
    G: { lore: Record<string, number>; inkDrops: Record<string, number> };
  };
  const { zoneCards, cardMeta } = state.ctx.zones.private;
  const keys = keysOf.get(match);
  const snOfInstance = (id: string) => keys?.get(id) ?? match.getCardDefinitionId(id) ?? "";
  const players = PIDS.map((pid) => {
    const zone = (z: string) => zoneCards[`${z}:${pid}`] ?? [];
    const playIds = zone("play");
    return {
      deck: [...zone("deck")].reverse().map(snOfInstance),
      hand: zone("hand").map(snOfInstance),
      discard: zone("discard").map(snOfInstance),
      field: playIds.map((id) => {
        const m = cardMeta[id] ?? {};
        const loc = m.atLocationId ? playIds.indexOf(String(m.atLocationId)) : -1;
        return {
          sn: snOfInstance(id),
          exerted: m.state === "exerted",
          damage: Number(m.damage ?? 0),
          drying: !!m.isDrying,
          location: loc >= 0 ? loc : null,
          under: ((m.cardsUnder as string[] | undefined) ?? []).map(snOfInstance),
        };
      }),
      inkwell: zone("inkwell").map((id) => ({ sn: snOfInstance(id), exerted: cardMeta[id]?.state === "exerted" })),
      lore: state.G.lore[pid] ?? 0,
      inkDrops: state.G.inkDrops?.[pid] ?? 0,
    };
  }) as [BoardPlayer, BoardPlayer];
  const owner = state.ctx.status.turnOwnerId ?? state.ctx.priority.holder;
  return { turn: state.ctx.status.turn, active: owner === PIDS[1] ? 1 : 0, players };
}

// Hydrate a board, list the active player's legal moves, project it back and compare.
function roundTrip(args: { board: Board }) {
  const { match, ms, unknown } = hydrate(args.board);
  const t = now();
  const active = PIDS[args.board.active];
  const moves = match.asLorcanaPlayer(active).getAvailableMoves();
  const movesMs = now() - t;
  const t2 = now();
  const back = project(match);
  const projectMs = now() - t2;
  const diffs: string[] = [];
  const cmp = (path: string, a: unknown, b: unknown) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(`${path}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`);
  };
  cmp("turn", args.board.turn, back.turn);
  cmp("active", args.board.active, back.active);
  args.board.players.forEach((p, i) => {
    const q = back.players[i];
    cmp(`p${i}.deck`, p.deck, q.deck);
    cmp(`p${i}.hand`, p.hand, q.hand);
    cmp(`p${i}.discard`, p.discard, q.discard);
    cmp(`p${i}.lore`, p.lore, q.lore);
    cmp(`p${i}.inkDrops`, p.inkDrops ?? 0, q.inkDrops);
    cmp(`p${i}.inkwell`, p.inkwell.map((c) => [c.sn, !!c.exerted]), q.inkwell.map((c) => [c.sn, c.exerted]));
    cmp(`p${i}.field`, p.field.map((c) => [c.sn, !!c.exerted, c.damage ?? 0, !!c.drying, c.location ?? null, c.under ?? []]),
      q.field.map((c) => [c.sn, c.exerted, c.damage, c.drying, c.location, c.under]));
  });
  return {
    hydrateMs: ms,
    movesMs,
    projectMs,
    unknown,
    moves: moves.map((m) => ({ moveId: m.moveId, cards: m.selectableCardIds.length })),
    lossless: diffs.length === 0,
    diffs,
  };
}

// ---------------------------------------------------------------------------------------------
// Proposed plays (Feature 68, docs/RSC-lorcana-engine.md §8). Searches the rest of this turn for the
// player whose turn it is: a beam over the bot's legal candidates in its strategy's order, positions
// reached twice merged, the opponent's choices mid-turn made by the bot. Every position that could
// end the turn is scored by `evaluate`; the best few lines that differ (inking aside) come back.
// An idea generator, not a solver: no hidden information, a greedy opponent, hand-set weights.

type Server = ReturnType<typeof bareServer>;
type RawState = {
  ctx: {
    status: { turnOwnerId?: string };
    zones: { private: { zoneCards: Record<string, string[]>; cardIndex: Record<string, { zoneKey: string }>; cardMeta: Record<string, Record<string, unknown>> } };
  };
  G: { lore: Record<string, number>; inkDrops?: Record<string, number>; loreToWin?: Record<string, number>; turnMetadata?: { inkedThisTurn?: unknown[] }; continuousEffects?: { instances?: unknown[] } };
};
type ActCard = { id: string; name: string; version?: string };
type Act = { by: "me" | "opp"; family: string; card?: ActCard; target?: ActCard; via?: string; with?: ActCard[]; targets?: ActCard[]; ability?: string; skipped?: boolean };

// Score = sum of these, from the side of the player whose turn it is. Tuned by tools/engine-tune.mjs
// (spike log, §12); `lore` sets the scale and `win` just has to dwarf the rest.
const WEIGHTS: Weights = {
  lore: 1, // lore difference now
  potential: 0.6, // lore the characters (and locations) in play can bring next turn, mine minus theirs
  body: 0.08, // strength + willpower left (+ Resist), mine minus theirs
  exposed: 0.6, // worth of my exerted characters an opposing character could banish next turn
  hand: 0.25, // cards in my hand
  ink: 0.35, // cards in my inkwell
  win: 1000, // reaching the lore to win
};
type Weights = { lore: number; potential: number; body: number; exposed: number; hand: number; ink: number; win: number };

type Projected = {
  cardType?: string;
  strength?: number;
  willpower?: number;
  lore?: number;
  damage?: number;
  exerted?: boolean;
  keywords?: string[];
  keywordValues?: Record<string, number | undefined>;
  hasEvasive?: boolean;
  hasReckless?: boolean;
  hasQuestRestriction?: boolean;
  hasChallengeRestriction?: boolean;
};

// What the score needs from a card in play, with modifiers and granted keywords (the engine's
// projection already counts both).
function unitOf(server: Server, id: string) {
  const c = server.getCardByInstance(id) as unknown as Projected;
  const kw = new Set(c.keywords ?? []);
  // keywordValues is keyed in lower case ("resist", "challenger").
  const value = (k: string) => Number(c.keywordValues?.[k] ?? 0) || 0;
  const resist = value("resist");
  return {
    char: c.cardType === "character",
    location: c.cardType === "location",
    str: c.strength ?? 0,
    left: Math.max(0, (c.willpower ?? 0) - (c.damage ?? 0)),
    lore: c.lore ?? 0,
    exerted: !!c.exerted,
    evasive: !!c.hasEvasive || kw.has("Evasive"),
    alert: kw.has("Alert"), // may challenge Evasive characters
    bodyguard: kw.has("Bodyguard"),
    challenger: value("challenger"),
    resist,
    // Reckless characters can't quest; some cards can't quest or can't challenge at all.
    quests: !c.hasReckless && !c.hasQuestRestriction,
    challenges: !c.hasChallengeRestriction,
  };
}

function evaluate(server: Server, me: string, opp: string, W: Weights = WEIGHTS) {
  const st = server.getState() as unknown as RawState;
  const { zoneCards } = st.ctx.zones.private;
  const mine = (zoneCards[`play:${me}`] ?? []).map((id) => unitOf(server, id));
  const theirs = (zoneCards[`play:${opp}`] ?? []).map((id) => unitOf(server, id));
  type Unit = (typeof mine)[number];
  const potential = (us: Unit[]) => us.filter((u) => (u.char && u.quests) || u.location).reduce((n, u) => n + u.lore, 0);
  const body = (us: Unit[]) => us.filter((u) => u.char).reduce((n, u) => n + u.str + u.left + u.resist, 0);
  // Next turn their characters may challenge my exerted ones: Evasive ones only by Evasive or Alert
  // attackers, Resist takes off damage, Challenger adds to it. An exerted Bodyguard of mine draws
  // challenges, so the rest count half.
  const attackers = theirs.filter((u) => u.char && u.challenges);
  const guarded = mine.some((u) => u.char && u.exerted && u.bodyguard);
  const worth = (u: Unit) => W.potential * (u.quests ? u.lore : 0) + W.body * (u.str + u.left) + 1;
  let exposed = 0;
  for (const d of mine) {
    if (!d.char || !d.exerted) continue;
    const banished = attackers.some((a) => (!d.evasive || a.evasive || a.alert) && a.str + a.challenger - d.resist >= d.left);
    if (banished) exposed += worth(d) * (guarded && !d.bodyguard ? 0.5 : 1);
  }
  const lore = st.G.lore;
  const parts = {
    lore: W.lore * ((lore[me] ?? 0) - (lore[opp] ?? 0)),
    potential: W.potential * (potential(mine) - potential(theirs)),
    body: W.body * (body(mine) - body(theirs)),
    exposed: -W.exposed * exposed,
    hand: W.hand * (zoneCards[`hand:${me}`]?.length ?? 0),
    ink: W.ink * (zoneCards[`inkwell:${me}`]?.length ?? 0),
    win: (lore[me] ?? 0) >= (st.G.loreToWin?.[me] ?? 20) ? W.win : 0,
  };
  return { score: Object.values(parts).reduce((a, b) => a + b, 0), parts };
}

// The same board reached by two orders of play is one position (decks aside: only their sizes).
function positionKey(server: Server) {
  const st = server.getState() as unknown as RawState;
  const { cardIndex, cardMeta, zoneCards } = st.ctx.zones.private;
  const cards: string[] = [];
  for (const id of Object.keys(cardIndex).sort()) {
    const zone = cardIndex[id].zoneKey;
    if (zone.startsWith("deck:")) continue;
    const m = cardMeta[id] ?? {};
    cards.push(`${id}@${zone}:${m.state ?? ""}:${m.damage ?? 0}:${m.isDrying ? 1 : 0}:${m.atLocationId ?? ""}`);
  }
  const decks = PIDS.map((p) => zoneCards[`deck:${p}`]?.length ?? 0);
  const extra = [st.G.lore, st.G.inkDrops, st.G.turnMetadata?.inkedThisTurn?.length, st.G.continuousEffects?.instances?.length, server.getBagCount(), server.getPendingEffects().length, decks];
  return JSON.stringify(extra) + cards.join("|");
}

function describe(server: Server, c: Record<string, unknown>, by: Act["by"]): Act {
  const card = (id: unknown): ActCard => {
    const d = server.getCardDefinitionByInstanceId(id as never) as { name?: string; version?: string } | undefined;
    return { id: String(id), name: d?.name ?? "?", version: d?.version };
  };
  const cardsOf = (ids: unknown) => (Array.isArray(ids) ? ids.filter((x) => /^t\d+$/.test(String(x))).map(card) : []);
  const family = String(c.family);
  switch (family) {
    case "playCard": {
      const cost = c.cost as string | { cost: string; shiftTarget?: string; singer?: string; singers?: string[] };
      const via = typeof cost === "object" ? cost.cost : cost;
      const with_ = via === "shift" && typeof cost === "object" ? [card(cost.shiftTarget)] : via === "sing" && typeof cost === "object" ? [card(cost.singer)] : via === "singTogether" && typeof cost === "object" ? (cost.singers ?? []).map(card) : undefined;
      return { by, family, card: card(c.cardId), via, with: with_, targets: cardsOf(c.targets) };
    }
    case "quest":
    case "putCardIntoInkwell":
      return { by, family, card: card(c.cardId) };
    case "challenge":
      return { by, family, card: card(c.attackerId), target: card(c.defenderId) };
    case "moveCharacterToLocation":
      return { by, family, card: card(c.characterId), target: card(c.locationId) };
    case "activateAbility":
      return { by, family, card: card(c.cardId), targets: cardsOf(c.targets) };
    default: {
      // resolveBag / resolveEffect: name the ability and the card it comes from.
      const id = c.bagId ?? c.effectId;
      const item = [...server.getBagEffects(), ...server.getPendingEffects()].find((b) => (b as { id?: unknown }).id === id) as
        | { sourceId?: string; payload?: { abilityName?: string } }
        | undefined;
      return { by, family, card: item?.sourceId ? card(item.sourceId) : undefined, ability: item?.payload?.abilityName, targets: cardsOf(c.targets), skipped: c.resolveOptional === false };
    }
  }
}

// While the opponent has to choose something during my turn, the bot chooses for them.
function settle(server: Server, me: string): Act[] | null {
  const acts: Act[] = [];
  for (let i = 0; i < 12 && !server.isGameOver(); i++) {
    const owner = (server.getState() as unknown as RawState).ctx.status.turnOwnerId;
    const actor = server.getCurrentActorId();
    if (owner !== me || !actor || actor === me) break;
    // The bot's first choice, as takeAutomatedAction would make it. None, or refused: drop the line.
    const pick = server.enumerateAutomatedActionsForCurrentActor().candidates[0];
    if (!pick) return null;
    const act = describe(server, pick as never, "opp");
    if (!applyCandidate(server, actor, pick).success) return null;
    acts.push(act);
  }
  return acts;
}

// Where every card ends a line: engine ids per zone (decks top last), and the state of the cards in
// play and in the inkwell.
function endOf(st: RawState) {
  const { zoneCards, cardMeta } = st.ctx.zones.private;
  const zones = PIDS.map((p) => Object.fromEntries(["deck", "hand", "play", "inkwell", "discard"].map((z) => [z, zoneCards[`${z}:${p}`] ?? []])));
  const meta: Record<string, unknown> = {};
  for (const z of zones) for (const id of [...z.play, ...z.inkwell]) {
    const m = cardMeta[id] ?? {};
    meta[id] = { exerted: m.state === "exerted", damage: Number(m.damage ?? 0), drying: !!m.isDrying, at: m.atLocationId ?? null, under: (m.cardsUnder as string[] | undefined) ?? [], faceUp: m.publicFaceState === "faceUp" };
  }
  return { lore: PIDS.map((p) => st.G.lore[p] ?? 0), inkDrops: PIDS.map((p) => st.G.inkDrops?.[p] ?? 0), zones, meta };
}

type SearchOpts = { beam?: number; perNode?: number; depth?: number; timeMs?: number; lines?: number; weights?: Partial<Weights>; finish?: boolean };
type Line = { state: unknown; acts: Act[]; score: number; parts: Record<string, number>; quiet: boolean };

// The search itself, from the position `server` is on, for `me` (whose turn it is).
function search(server: Server, me: string, opp: string, opts: SearchOpts) {
  const t0 = now();
  const W = { ...WEIGHTS, ...opts.weights };
  const beamWidth = opts.beam ?? 6;
  const perNode = opts.perNode ?? 8;
  const budget = opts.timeMs ?? 2500;
  const load = (st: unknown) => server.loadState(structuredClone(st) as never);
  const owner = () => (server.getState() as unknown as RawState).ctx.status.turnOwnerId;
  // A turn can only end with nothing left to resolve.
  const line = (acts: Act[]): Line => {
    const e = evaluate(server, me, opp, W);
    return { state: structuredClone(server.getState()), acts, score: e.score, parts: e.parts, quiet: !server.getBagCount() && !server.getPendingEffects().length };
  };

  const root = line(settle(server, me) ?? []);
  const seen = new Set([positionKey(server)]);
  const ends: Line[] = root.quiet ? [root] : [];
  let beam = [root];
  let nodes = 0;
  let outOfTime = false;
  for (let depth = 0; depth < (opts.depth ?? 12) && beam.length && !outOfTime; depth++) {
    const next: Line[] = [];
    for (const from of beam) {
      load(from.state);
      if (server.isGameOver() || owner() !== me) continue;
      const en = server.enumerateAutomatedActionsForCurrentActor();
      if (en.actorId !== me) continue;
      // Inking one card or another rarely changes the plan: the strategy's two favourites will do.
      let inks = 0;
      const picks = en.candidates.filter((c) => c.family !== "putCardIntoInkwell" || ++inks <= 2).slice(0, perNode);
      for (const c of picks) {
        if (now() - t0 > budget) {
          outOfTime = true;
          break;
        }
        load(from.state);
        const act = describe(server, c as never, "me");
        nodes++;
        if (!applyCandidate(server, me, c).success) continue;
        const after = settle(server, me);
        if (!after) continue;
        const key = positionKey(server);
        if (seen.has(key)) continue;
        seen.add(key);
        const l = line([...from.acts, act, ...after]);
        next.push(l);
        if (l.quiet) ends.push(l);
      }
      if (outOfTime) break;
    }
    beam = next.sort((a, b) => b.score - a.score).slice(0, beamWidth);
  }

  // The bot finishes the best few lines, and plays the whole turn from the start: a line cut short by
  // the beam or the clock still gets the ink and the quests the bot would add. Both the short and the
  // finished line stay in, and the score picks.
  if (opts.finish !== false) {
    const top = [...ends].sort((a, b) => b.score - a.score).slice(0, 4);
    for (const from of [root, ...top.filter((l) => l !== root)]) {
      load(from.state);
      const acts = [...from.acts];
      for (let i = 0; i < 12 && !server.isGameOver() && owner() === me; i++) {
        const en = server.enumerateAutomatedActionsForCurrentActor();
        const c = en.actorId === me ? en.candidates[0] : undefined;
        if (!c) break; // the bot would pass
        const act = describe(server, c as never, "me");
        nodes++;
        if (!applyCandidate(server, me, c).success) break;
        const after = settle(server, me);
        if (!after) break;
        acts.push(act, ...after);
      }
      if (acts.length === from.acts.length) continue;
      const key = positionKey(server);
      if (seen.has(key)) continue;
      seen.add(key);
      const l = line(acts);
      if (l.quiet) ends.push(l);
    }
  }

  // The best few, each a different plan: the same moves in another order, or another card inked, are one.
  // Cards by name, so two copies of a card make one plan.
  const plan = (l: Line) =>
    l.acts
      .filter((a) => a.family !== "putCardIntoInkwell")
      .map((a) => JSON.stringify(a, (k, v) => (k === "id" ? undefined : v)))
      .sort()
      .join("|");
  const plans = new Set<string>();
  const best: Line[] = [];
  for (const l of ends.sort((a, b) => b.score - a.score)) {
    if (best.length >= (opts.lines ?? 3)) break;
    const p = plan(l);
    if (plans.has(p)) continue;
    plans.add(p);
    best.push(l);
  }
  return { root, best, nodes, positions: seen.size, outOfTime, ms: now() - t0 };
}

function explore(args: SearchOpts & { board: Board }) {
  const t0 = now();
  const { match, pos } = hydrate(args.board);
  const r = search(bareServer(match), PIDS[args.board.active], PIDS[1 - args.board.active], args);
  return {
    ms: now() - t0,
    nodes: r.nodes,
    positions: r.positions,
    outOfTime: r.outOfTime,
    base: { score: r.root.score, parts: r.root.parts },
    ids: Object.fromEntries(pos),
    lines: r.best.map((l) => ({ score: l.score, parts: l.parts, acts: l.acts, end: endOf(l.state as RawState) })),
  };
}

// One game for tools/engine-tune.mjs: on its own turns, player `explorer` plays the best line the
// search finds with `weights`; every other choice (both mulligans, the other player's whole game,
// answers to prompts) is the engine's default bot.
function selfPlay(args: SearchOpts & { deck1: string; deck2: string; seed: string; explorer: 0 | 1; maxActions?: number; trace?: boolean }) {
  const t0 = now();
  const d1 = resolveDeck(args.deck1);
  const d2 = resolveDeck(args.deck2);
  if (d1.missing.length || d2.missing.length) return { error: "unresolved", missing: [...d1.missing, ...d2.missing] };
  const match = LorcanaMultiplayerTestEngine.createWithFixture(
    { deck: d1.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    { deck: d2.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    fixtureOptions(args.seed, false),
  );
  const server = engineOf(match);
  const me = PIDS[args.explorer];
  const opp = PIDS[1 - args.explorer];
  let searched = -1;
  const trace: unknown[] = [];
  let searches = 0;
  let searchMs = 0;
  for (let i = 0; i < (args.maxActions ?? 1500) && !server.isGameOver(); i++) {
    const st = server.getState() as unknown as RawState;
    const myTurn = server.getGameSegment() === "mainGame" && st.ctx.status.turnOwnerId === me && server.getCurrentActorId() === me;
    if (myTurn && searched !== server.getTurnNumber()) {
      searched = server.getTurnNumber();
      const r = search(bareServer(match), me, opp, args);
      searches++;
      searchMs += r.ms;
      const pick = r.best[0];
      if (args.trace) trace.push({ turn: searched, lore: [server.getLore(me), server.getLore(opp)], positions: r.positions, outOfTime: r.outOfTime, score: pick?.score, acts: pick?.acts.map((a) => `${a.by === "opp" ? "opp:" : ""}${a.family}:${a.card?.name ?? a.ability ?? ""}${a.target ? ">" + a.target.name : ""}`) });
      if (pick) match.loadState(pick.state as never);
      continue;
    }
    if (myTurn && !server.getBagCount() && !server.getPendingEffects().length && server.passTurn(me).success) continue;
    server.takeAutomatedActionForCurrentActor();
  }
  const status = (server.getState() as unknown as { ctx: { status: { reason?: string } } }).ctx.status;
  return {
    winner: server.getWinner() ?? null,
    explorerWon: server.getWinner() === me,
    reason: status.reason ?? null,
    lore: [server.getLore(me), server.getLore(opp)],
    turns: server.getTurnNumber(),
    searches,
    searchMs,
    ms: now() - t0,
    ...(args.trace ? { trace } : {}),
  };
}

// A LorcanaServer on the harness's current state, without the two mirroring clients: what search uses.
function bareServer(match: LorcanaMultiplayerTestEngine) {
  const cardsMaps = match.getCardsMaps();
  const defs: Record<string, unknown> = {};
  for (const id of Object.keys(cardsMaps.cardInstances)) {
    const def = match.getCardDefinition(id);
    defs[(def as Def).id] = def;
  }
  return loadLorcanaServerAuthoritativeState(
    structuredClone(match.asServer().getState()) as never,
    cardsMaps,
    createRecordCardCatalog("dojo", defs as never),
  );
}

// What one search node costs: restore a snapshot, apply one candidate, list the next candidates,
// serialise the result. Bot-plays to `turn` first, until the actor has a few candidates. Measured on
// the test harness (which mirrors every move to two clients) and on a bare server built from it.
function searchCost(args: { deck1: string; deck2: string; seed?: string; turn?: number; samples?: number }) {
  const d1 = resolveDeck(args.deck1);
  const d2 = resolveDeck(args.deck2);
  const match = LorcanaMultiplayerTestEngine.createWithFixture(
    { deck: d1.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    { deck: d2.cards, hand: 0, inkwell: 0, play: [], discard: [], lore: 0 },
    fixtureOptions(args.seed ?? "dojo-search", false),
  );
  const harness = engineOf(match);
  let root = harness.enumerateAutomatedActionsForCurrentActor();
  for (let i = 0; i < 400 && !harness.isGameOver(); i++) {
    if (harness.getTurnNumber() >= (args.turn ?? 5) && root.candidates.length >= 3) break;
    harness.takeAutomatedActionForCurrentActor();
    root = harness.enumerateAutomatedActionsForCurrentActor();
  }
  const snapshot = structuredClone(harness.getState());
  const cardsMaps = match.getCardsMaps();
  const t0 = now();
  const bare = bareServer(match);
  const bareMs = now() - t0;

  const measure = (server: typeof harness) => {
    const t1 = now();
    const first = server.enumerateAutomatedActionsForCurrentActor();
    const enumerateMs = now() - t1;
    const restore: number[] = [], apply: number[] = [], enumerate: number[] = [], serialise: number[] = [];
    const samples = Math.min(args.samples ?? 40, first.candidates.length);
    for (let i = 0; i < samples; i++) {
      let t = now();
      server.loadState(structuredClone(snapshot) as never);
      restore.push(now() - t);
      t = now();
      applyCandidate(server, first.actorId as string, first.candidates[i]);
      apply.push(now() - t);
      t = now();
      server.enumerateAutomatedActionsForCurrentActor();
      enumerate.push(now() - t);
      t = now();
      JSON.stringify(server.getState());
      serialise.push(now() - t);
    }
    const node = restore.map((r, i) => r + apply[i] + enumerate[i] + serialise[i]);
    return { candidates: first.candidates.length, enumerateMs, restore: stats(restore), apply: stats(apply), enumerate: stats(enumerate), serialise: stats(serialise), node: stats(node) };
  };

  return {
    turn: harness.getTurnNumber(),
    families: root.candidates.map((c) => c.family),
    stateKb: JSON.stringify(snapshot).length / 1024,
    fullSnapshotKb: JSON.stringify(getLorcanaServerAuthoritativeSnapshot(harness, cardsMaps)).length / 1024,
    bareMs,
    harness: measure(harness),
    bare: measure(bare),
  };
}

const ops: Record<string, (args: never) => unknown> = { init, names, analyze, explore, selfPlay, botGame, roundTrip, searchCost };
(globalThis as Record<string, unknown>).DojoEngine = ops;

const scope = globalThis as unknown as { WorkerGlobalScope?: unknown; onmessage: unknown; postMessage(m: unknown): void };
if (typeof scope.WorkerGlobalScope !== "undefined") {
  scope.onmessage = async (e: MessageEvent<{ id: number; op: string; args: unknown }>) => {
    const { id, op, args } = e.data;
    try {
      // init can take a URL: the worker fetches and parses the catalogue itself.
      if (op === "init" && typeof args === "string") {
        const t = now();
        const cards = await (await fetch(args)).json();
        const fetchMs = now() - t;
        scope.postMessage({ id, ok: true, result: { fetchMs, ...init(cards) } });
        return;
      }
      scope.postMessage({ id, ok: true, result: ops[op](args as never) });
    } catch (err) {
      scope.postMessage({ id, ok: false, error: String((err as Error)?.stack ?? err) });
    }
  };
}
