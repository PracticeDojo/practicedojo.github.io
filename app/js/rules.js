// Rules engine bridge (Feature 68, experimental, branch feat/68-rules-engine).
//
// It knows the Dojo's state but nothing about the board's DOM. The engine itself runs in a Web
// Worker (app/vendor/lorcana-engine/engine.worker.js, built by tools/build-engine.mjs):
//   boardFromState(state, snOf)   a Dojo state (full or compressed) → the worker's board shape.
//                                 snOf(cardId) gives a card's "<setCode>-<number>", or null.
//   start(workerUrl)              starts the worker; call(op, args) → Promise of its result.
window.DojoRules = (function () {
    'use strict';

    const UNKNOWN = 'unknown';

    function boardFromState(state, snOf) {
        const sn = (card) => (card && snOf(card.cardId)) || UNKNOWN;
        return {
            turn: state.turn,
            active: state.activePlayer === 1 ? 1 : 0,
            players: state.players.map(p => {
                const field = p.field || [];
                const inkwell = p.inkwell || [];
                // The Dojo counts ready ink; the engine exerts ink cards. The last ones in are the spent ones.
                const spent = Math.max(0, Math.min(inkwell.length, inkwell.length - (p.inkReady ?? inkwell.length)));
                return {
                    deck: (p.deck || []).map(sn),
                    hand: (p.hand || []).map(sn),
                    discard: (p.discard || []).map(sn),
                    field: field.map(c => {
                        const at = c.locationId ? field.findIndex(l => l.instanceId === c.locationId) : -1;
                        return {
                            sn: sn(c),
                            exerted: !!c.exerted,
                            damage: c.damage || 0,
                            drying: !!c.drying,
                            location: at >= 0 ? at : null,
                            under: (c.stackedCards || []).map(sn)
                        };
                    }),
                    inkwell: inkwell.map((c, i) => ({ sn: sn(c), exerted: i >= inkwell.length - spent })),
                    lore: p.lore || 0,
                    inkDrops: p.inkDrops || 0
                };
            })
        };
    }

    let worker = null;
    let seq = 0;
    const pending = new Map();

    function start(workerUrl) {
        if (worker) return;
        worker = new Worker(workerUrl);
        worker.onmessage = (e) => {
            const { id, ok, result, error } = e.data;
            const p = pending.get(id);
            if (!p) return;
            pending.delete(id);
            ok ? p.resolve(result) : p.reject(new Error(error));
        };
        worker.onerror = (e) => {
            for (const p of pending.values()) p.reject(new Error(e.message || 'engine worker failed'));
            pending.clear();
        };
    }

    function call(op, args) {
        return new Promise((resolve, reject) => {
            const id = ++seq;
            pending.set(id, { resolve, reject });
            worker.postMessage({ id, op, args });
        });
    }

    return { UNKNOWN, boardFromState, start, call };
})();
