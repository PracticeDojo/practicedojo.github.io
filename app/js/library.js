// DojoLibrary — the device library (docs/ARCH-accounts-and-library.md §4–§6).
//
// Owns everything the Dojo keeps on this device, plus the read-only defaults
// that ship in the repo:
//   - IndexedDB `practice_dojo`: decks, sessions (metadata), session_blobs, kv
//   - the session file codec: format v2, gzipped, reading v1/v2 plain or gzipped
//   - the defaults loader: app/defaults/decks and app/defaults/demos
//   - the one-time migration of the old localStorage "Continue" slot
//
// It knows nothing about the board. The app hands it a v1 payload (`data`)
// and gets the same payload back. Classic script, one global, no build step.

const DojoLibrary = (() => {
    const DB_NAME = 'practice_dojo';
    const DB_VERSION = 1;
    const FORMAT = 'practice-dojo-session';
    const LEGACY_SLOT = 'lorcana_dojo_session';
    const DEFAULTS_DIR = 'defaults/';

    // --- IndexedDB ------------------------------------------------------------
    let dbPromise = null;

    function open() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB is not available')); return; }
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains('decks')) db.createObjectStore('decks', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('sessions')) db.createObjectStore('sessions', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('session_blobs')) db.createObjectStore('session_blobs');
                    if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
                req.onblocked = () => reject(new Error('The device library is open in an older tab. Close other Dojo tabs and reload.'));
            });
            // A failed open shouldn't poison every later call.
            dbPromise.catch(() => { dbPromise = null; });
        }
        return dbPromise;
    }

    function reqP(req) {
        return new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    // Runs fn(stores) inside one transaction and resolves once it commits.
    async function tx(storeNames, mode, fn) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const t = db.transaction(storeNames, mode);
            const stores = {};
            [].concat(storeNames).forEach(n => { stores[n] = t.objectStore(n); });
            let result;
            Promise.resolve(fn(stores)).then(r => { result = r; }, err => { try { t.abort(); } catch (e) { } reject(err); });
            t.oncomplete = () => resolve(result);
            t.onerror = () => reject(t.error);
            t.onabort = () => reject(t.error || new Error('Transaction aborted'));
        });
    }

    const get = (store, key) => tx(store, 'readonly', s => reqP(s[store].get(key)));
    const getAll = (store) => tx(store, 'readonly', s => reqP(s[store].getAll()));

    function newId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        // RFC 4122 v4 from getRandomValues (older Safari has no randomUUID)
        const b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
        const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }

    // --- Codec ------------------------------------------------------------------
    const canGzip = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

    // Text → gzipped bytes (ArrayBuffer). Without CompressionStream the text is
    // stored as-is; readText() accepts both.
    async function gzipText(text) {
        if (!canGzip) return text;
        const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
        return await new Response(stream).arrayBuffer();
    }

    // String, ArrayBuffer, typed array or Blob/File, gzipped or not → text.
    async function readText(src) {
        if (typeof src === 'string') return src;
        let bytes;
        if (src instanceof Blob) bytes = new Uint8Array(await src.arrayBuffer());
        else if (src instanceof ArrayBuffer) bytes = new Uint8Array(src);
        else if (ArrayBuffer.isView(src)) bytes = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
        else throw new Error('Unreadable session data');
        const isGzip = bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
        if (!isGzip) return new TextDecoder().decode(bytes);
        if (typeof DecompressionStream === 'undefined') {
            throw new Error("This browser can't open .gz files. Decompress it first, or use a newer browser.");
        }
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        return await new Response(stream).text();
    }

    // Wraps a v1 payload as a v2 session file (§6).
    function encodeFile({ id, title, summary, data, appVersion }) {
        return {
            format: FORMAT,
            version: 2,
            app: appVersion || '',
            id,
            title: title || 'Untitled session',
            savedAt: Date.now(),
            summary: summary || {},
            data
        };
    }

    // Text of a v1 or v2 file → { id, title, summary, savedAt, data }.
    // Throws a readable error for anything that isn't a Dojo session.
    function decodeText(text) {
        let obj;
        try { obj = JSON.parse(text); } catch (e) { throw new Error("That file isn't valid JSON."); }
        if (!obj || typeof obj !== 'object') throw new Error("That file isn't a Dojo session.");
        let out;
        if (obj.format === FORMAT) {
            if (typeof obj.version === 'number' && obj.version > 2) {
                throw new Error('This session was saved by a newer version of the Dojo. Reload the page to update.');
            }
            out = {
                id: typeof obj.id === 'string' ? obj.id : null,
                title: typeof obj.title === 'string' ? obj.title : null,
                summary: obj.summary && typeof obj.summary === 'object' ? obj.summary : null,
                savedAt: typeof obj.savedAt === 'number' ? obj.savedAt : null,
                data: obj.data
            };
        } else {
            // v1: the payload itself (export, the old Continue slot, old cloud rows)
            out = { id: null, title: null, summary: obj.summary || null, savedAt: null, data: obj };
        }
        const d = out.data;
        if (!d || typeof d !== 'object' || !d.currentState || !Array.isArray(d.bookmarks)) {
            throw new Error('This file is missing the session data the Dojo expects. Export a session from the Dojo and try again.');
        }
        return out;
    }

    async function decode(src) { return decodeText(await readText(src)); }

    // A v2 file, gzipped when the browser can, ready for download or storage.
    async function encodeBlob(fileObj) {
        const packed = await gzipText(JSON.stringify(fileObj));
        return typeof packed === 'string'
            ? new Blob([packed], { type: 'application/json' })
            : new Blob([packed], { type: 'application/gzip' });
    }

    // --- Sessions ---------------------------------------------------------------
    // meta: { id, title, summary, createdAt, updatedAt, lastOpenedAt,
    //         account?: { revision }, accountDirty? }
    // blob: the gzipped v2 file (ArrayBuffer; plain text if gzip is unavailable)
    // `account` marks a device copy that is also in the signed-in account, at
    // that revision; `accountDirty` means it changed here since (§8.1).

    async function listSessions() {
        const all = await getAll('sessions');
        return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    const getSession = (id) => get('sessions', id);

    // Writes the meta row and the file together, so the list never points at a
    // missing or stale file. `file` = { data, summary, appVersion }.
    async function saveSession(meta, file) {
        const now = Date.now();
        const row = {
            id: meta.id,
            title: meta.title || 'Untitled session',
            summary: file.summary || meta.summary || {},
            createdAt: meta.createdAt || now,
            updatedAt: now,
            lastOpenedAt: meta.lastOpenedAt || now
        };
        const packed = await gzipText(JSON.stringify(encodeFile({ ...row, data: file.data, appVersion: file.appVersion })));
        return tx(['sessions', 'session_blobs'], 'readwrite', async s => {
            // Keep the account link; a save after it means the account copy is behind.
            const prev = await reqP(s.sessions.get(row.id));
            const account = meta.account !== undefined ? meta.account : (prev && prev.account);
            if (account) {
                row.account = account;
                row.accountDirty = meta.accountDirty !== undefined ? !!meta.accountDirty : true;
            }
            s.sessions.put(row);
            s.session_blobs.put(packed, row.id);
            return row;
        });
    }

    // The stored file as-is (gzipped bytes), for uploading to the account.
    const getSessionBlob = (id) => get('session_blobs', id);

    // Writes a meta row and an already-packed file (a download from the account).
    function putSessionRaw(meta, packed) {
        return tx(['sessions', 'session_blobs'], 'readwrite', s => {
            s.sessions.put(meta);
            s.session_blobs.put(packed, meta.id);
        });
    }

    async function loadSession(id) {
        const [meta, packed] = await Promise.all([get('sessions', id), get('session_blobs', id)]);
        if (!meta || packed == null) throw new Error('That session is no longer on this device.');
        const file = await decode(packed);
        return { meta, data: file.data };
    }

    // Meta-only edits: the title lives in the meta row; the file picks it up on
    // its next save or export.
    async function updateSessionMeta(id, patch) {
        return tx('sessions', 'readwrite', async s => {
            const row = await reqP(s.sessions.get(id));
            if (!row) throw new Error('That session is no longer on this device.');
            const next = { ...row, ...patch };
            s.sessions.put(next);
            return next;
        });
    }

    async function duplicateSession(id, title) {
        const [meta, packed] = await Promise.all([get('sessions', id), get('session_blobs', id)]);
        if (!meta || packed == null) throw new Error('That session is no longer on this device.');
        const now = Date.now();
        const copy = { ...meta, id: newId(), title, createdAt: now, updatedAt: now, lastOpenedAt: now };
        delete copy.account;      // a copy starts life on this device only
        delete copy.accountDirty;
        await tx(['sessions', 'session_blobs'], 'readwrite', s => {
            s.sessions.put(copy);
            s.session_blobs.put(packed, copy.id);
        });
        return copy;
    }

    function deleteSession(id) {
        return tx(['sessions', 'session_blobs'], 'readwrite', s => {
            s.sessions.delete(id);
            s.session_blobs.delete(id);
        });
    }

    // --- Decks ------------------------------------------------------------------
    // { id, name, decklist, notes, createdAt, updatedAt }

    async function listDecks() {
        const all = await getAll('decks');
        return all.sort((a, b) => String(a.name).localeCompare(String(b.name), undefined, { sensitivity: 'base' }));
    }

    const getDeck = (id) => get('decks', id);

    // deck.account / deck.accountDirty as for sessions.
    async function saveDeck(deck) {
        const now = Date.now();
        const row = {
            id: deck.id || newId(),
            name: String(deck.name || 'Untitled deck').slice(0, 80),
            decklist: String(deck.decklist || ''),
            notes: String(deck.notes || ''),
            createdAt: deck.createdAt || now,
            updatedAt: deck.updatedAt || now
        };
        return tx('decks', 'readwrite', async s => {
            const prev = await reqP(s.decks.get(row.id));
            const account = deck.account !== undefined ? deck.account : (prev && prev.account);
            if (account) {
                row.account = account;
                row.accountDirty = deck.accountDirty !== undefined ? !!deck.accountDirty : true;
            }
            s.decks.put(row);
            return row;
        });
    }

    const deleteDeck = (id) => tx('decks', 'readwrite', s => { s.decks.delete(id); });

    // Sign out on a shared computer: drop every device copy that came from or
    // went to the account. Returns how many sessions and decks were removed.
    async function deleteAccountCopies() {
        const [sessions, decks] = await Promise.all([getAll('sessions'), getAll('decks')]);
        const ss = sessions.filter(r => r.account);
        const ds = decks.filter(r => r.account);
        await tx(['sessions', 'session_blobs', 'decks'], 'readwrite', s => {
            ss.forEach(r => { s.sessions.delete(r.id); s.session_blobs.delete(r.id); });
            ds.forEach(r => s.decks.delete(r.id));
        });
        return { sessions: ss.length, decks: ds.length };
    }

    // --- Prefs (kv) -------------------------------------------------------------
    async function getPref(key) {
        try { return await get('kv', key); } catch (e) { return undefined; }
    }

    function setPref(key, value) {
        return tx('kv', 'readwrite', s => { s.kv.put(value, key); }).catch(e => console.warn('Pref write failed', e));
    }

    // --- Storage persistence (§5) ---------------------------------------------
    let persistAsked = false;
    function persist() {
        if (persistAsked) return;
        persistAsked = true;
        try {
            if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
        } catch (e) { /* not supported — eviction is just a bit more likely */ }
    }

    // --- One-time migration of the old localStorage slot -----------------------
    // Returns the new session id, or null when there was nothing to migrate.
    // `titleFor(summary)` lets the app name it; summary may be null for old slots.
    async function migrateLegacySlot(appVersion, titleFor) {
        let raw = null;
        try { raw = localStorage.getItem(LEGACY_SLOT); } catch (e) { return null; }
        if (!raw) return null;
        let file;
        try {
            file = decodeText(raw);
        } catch (e) {
            console.warn('Old Continue slot was unreadable; leaving it in place', e);
            return null;
        }
        const s = file.summary || {};
        const ts = s.savedAt || Date.now();
        let title = null;
        try { title = titleFor ? titleFor(file.summary) : null; } catch (e) { }
        const row = await saveSession(
            { id: newId(), title: title || 'My last session', createdAt: ts, lastOpenedAt: ts },
            { data: file.data, summary: file.summary, appVersion }
        );
        await setPref('lastSessionId', row.id);
        try { localStorage.removeItem(LEGACY_SLOT); } catch (e) { }
        return row.id;
    }

    // --- Defaults (read-only, from the repo) -----------------------------------
    async function fetchJson(path) {
        const r = await fetch(DEFAULTS_DIR + path, { cache: 'no-cache' });
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
    }

    let defaultDecksPromise = null;
    // → [{ title, decks: [{ id, name, notes, decklist }] }]. Deck files are tiny,
    // so they're all fetched up front; a file that fails to load is dropped.
    function loadDefaultDecks() {
        if (!defaultDecksPromise) {
            defaultDecksPromise = (async () => {
                const manifest = await fetchJson('decks/manifest.json');
                const groups = Array.isArray(manifest.groups) ? manifest.groups : [];
                return Promise.all(groups.map(async g => ({
                    title: String(g.title || ''),
                    decks: (await Promise.all((g.decks || []).map(async d => {
                        try {
                            const r = await fetch(DEFAULTS_DIR + 'decks/' + d.file, { cache: 'no-cache' });
                            if (!r.ok) throw new Error(`HTTP ${r.status}`);
                            return { id: String(d.id), name: String(d.name || d.id), notes: String(d.notes || ''), decklist: await r.text() };
                        } catch (e) {
                            console.warn('Default deck failed to load', d.file, e);
                            return null;
                        }
                    }))).filter(Boolean)
                })));
            })();
            defaultDecksPromise.catch(() => { defaultDecksPromise = null; });
        }
        return defaultDecksPromise;
    }

    let demoManifestPromise = null;
    // → [{ id, title, file }]
    function loadDemoManifest() {
        if (!demoManifestPromise) {
            demoManifestPromise = fetchJson('demos/manifest.json')
                .then(m => (Array.isArray(m.demos) ? m.demos : []).map(d => ({
                    id: String(d.id), title: String(d.title || d.id), file: String(d.file)
                })));
            demoManifestPromise.catch(() => { demoManifestPromise = null; });
        }
        return demoManifestPromise;
    }

    async function fetchDemo(demo) {
        const r = await fetch(DEFAULTS_DIR + 'demos/' + demo.file, { cache: 'no-cache' });
        if (!r.ok) throw new Error(`Couldn't download that demo (HTTP ${r.status}).`);
        return decode(await r.arrayBuffer());
    }

    return {
        canGzip, newId,
        readText, decode, decodeText, encodeFile, encodeBlob,
        listSessions, getSession, saveSession, loadSession, updateSessionMeta, duplicateSession, deleteSession,
        getSessionBlob, putSessionRaw,
        listDecks, getDeck, saveDeck, deleteDeck, deleteAccountCopies,
        getPref, setPref, persist, migrateLegacySlot,
        loadDefaultDecks, loadDemoManifest, fetchDemo
    };
})();
