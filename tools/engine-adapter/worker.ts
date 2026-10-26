// The Dojo's side of the Lorcana engine (Feature 68, Phase 0 spike). Bundled with the engine by
// tools/build-engine.mjs into app/vendor/lorcana-engine/engine.worker.js.
//
// Runs as a classic Web Worker (messages {id, op, args} → {id, ok, result | error}) and, in Node or
// on a page, as a plain script that sets globalThis.DojoEngine to the same ops.
//
// Board shape the ops take and return (Dojo-shaped, cards named by "<setCode>-<number>"):
//   { turn, active: 0|1, players: [{ deck, hand, discard: Sn[], field: FieldCard[],
//     inkwell: { sn, exerted }[], lore, inkDrops }] }   deck[0] is the top card, as in the Dojo.
//   FieldCard = { sn, exerted, damage, drying, location: index into field | null, under: Sn[] }
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

type Def = { id: string; name: string; version?: string; printings?: { setCode: string; collectorNumber: string }[] } & Record<string, unknown>;
type FieldCard = { sn: string; exerted?: boolean; damage?: number; drying?: boolean; location?: number | null; under?: string[] };
type BoardPlayer = { deck: string[]; hand: string[]; discard: string[]; field: FieldCard[]; inkwell: { sn: string; exerted?: boolean }[]; lore: number; inkDrops?: number };
type Board = { turn: number; active: 0 | 1; players: [BoardPlayer, BoardPlayer] };

const PIDS = [CANONICAL_PLAYER_ONE, CANONICAL_PLAYER_TWO] as const;
const now = () => performance.now();

let defsBySn = new Map<string, Def>();
let snByDefId = new Map<string, string>();
let defsByName = new Map<string, Def>();

const norm = (s: string) => s.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();
const snOf = (setCode: string, number: string) => `${setCode.replace(/^set/, "")}-${number}`;

function init(cards: Def[]) {
  const t = now();
  defsBySn = new Map();
  snByDefId = new Map();
  defsByName = new Map();
  for (const card of cards) {
    for (const p of card.printings ?? []) {
      const sn = snOf(p.setCode, p.collectorNumber);
      if (!defsBySn.has(sn)) defsBySn.set(sn, card);
      if (!snByDefId.has(card.id)) snByDefId.set(card.id, sn);
    }
    const full = norm(card.version ? `${card.name} - ${card.version}` : card.name);
    if (!defsByName.has(full)) defsByName.set(full, card);
  }
  return { cards: cards.length, printings: defsBySn.size, ms: now() - t };
}

// "4 Higgins - Undercover Officer" → 4 × that definition. shortcut: exact "Name - Version" only;
// the real bridge goes through the Dojo's card DB and set-number ids instead.
function resolveDeck(text: string) {
  const cards: Def[] = [];
  const missing: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^(\d+)\s+(.+?)(?:\s+\([\w-]+\))?$/);
    if (!m) continue;
    const def = defsByName.get(norm(m[2]));
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
// can be computed up front, which is how locations are pointed at.
function hydrate(board: Board, seed = "dojo-hydrate") {
  const t0 = now();
  const unknown: string[] = [];
  const def = (sn: string) => {
    const d = defsBySn.get(sn);
    if (!d) unknown.push(sn);
    return d ?? { id: `unknown:${sn}`, name: `Unknown ${sn}`, cardType: "item", cost: 0, inkable: true };
  };
  let seq = 1;
  const next = () => `t${String(seq++).padStart(6, "0")}`;
  const states = board.players.map((p) => {
    const deck = [...p.deck].reverse().map((sn) => (next(), def(sn)));
    const hand = p.hand.map((sn) => (next(), def(sn)));
    const fieldIds: string[] = [];
    const play = p.field.map((c) => {
      fieldIds.push(next());
      const under = (c.under ?? []).map((sn) => (next(), def(sn)));
      return { card: def(c.sn), exerted: !!c.exerted, damage: c.damage ?? 0, isDrying: !!c.drying, cardsUnder: under, _loc: c.location };
    });
    for (const entry of play) {
      if (entry._loc != null) (entry as Record<string, unknown>).atLocation = fieldIds[entry._loc];
      delete (entry as Record<string, unknown>)._loc;
    }
    const inkwell = p.inkwell.map((c) => (next(), { card: def(c.sn), exerted: !!c.exerted }));
    const discard = p.discard.map((sn) => (next(), def(sn)));
    return { deck, hand, play, inkwell, discard, lore: p.lore, inkDrops: p.inkDrops ?? 0 };
  });
  const match = LorcanaMultiplayerTestEngine.createWithFixture(states[0], states[1], fixtureOptions(seed, true));
  // Whose turn it is: the fixture always starts player one on turn 1.
  const server = engineOf(match);
  const state = structuredClone(server.getState()) as unknown as {
    ctx: { status: Record<string, unknown>; priority: { holder: string } };
  };
  state.ctx.status.turn = board.turn;
  state.ctx.status.turnOwnerId = PIDS[board.active];
  state.ctx.priority.holder = PIDS[board.active];
  match.loadState(state as never);
  return { match, ms: now() - t0, unknown };
}

// Engine → Dojo board (the same shape hydrate takes).
function project(match: LorcanaMultiplayerTestEngine): Board {
  const state = match.asServer().getState() as unknown as {
    ctx: { status: { turn: number; turnOwnerId?: string }; priority: { holder: string }; zones: { private: { zoneCards: Record<string, string[]>; cardMeta: Record<string, Record<string, unknown>> } } };
    G: { lore: Record<string, number>; inkDrops: Record<string, number> };
  };
  const { zoneCards, cardMeta } = state.ctx.zones.private;
  const snOfInstance = (id: string) => {
    const defId = match.getCardDefinitionId(id) ?? "";
    return snByDefId.get(defId) ?? defId.replace(/^unknown:/, "");
  };
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
  const defs: Record<string, unknown> = {};
  for (const id of Object.keys(cardsMaps.cardInstances)) {
    const def = match.getCardDefinition(id);
    defs[(def as Def).id] = def;
  }
  const t0 = now();
  const bare = loadLorcanaServerAuthoritativeState(
    structuredClone(snapshot) as never,
    cardsMaps,
    createRecordCardCatalog("dojo", defs as never),
  );
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

const ops: Record<string, (args: never) => unknown> = { init, botGame, roundTrip, searchCost };
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
