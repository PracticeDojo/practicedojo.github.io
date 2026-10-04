// DojoCloud — share links (docs/ARCH-accounts-and-library.md §9). The only
// file that knows Supabase exists.
//
// Reading a link needs no account and no library: one RPC (get_share) and,
// for a session, one public file download, both with plain fetch.
// Creating a link signs the visitor in anonymously behind the scenes (§9.3)
// using supabase-js, which is loaded on first use, so nobody pays for it
// at startup. Classic script, one global, no build step.

const DojoCloud = (() => {
    const URL = 'https://wztyzqxkdwtrzassykdq.supabase.co';
    // Publishable key: designed to be public; access is enforced by RLS.
    const KEY = 'sb_publishable_uovOOAc3Bw29WQLGo6hFlA_QObf0OMS';
    const SDK_SRC = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
    const SDK_SRI = 'sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok';
    const AUTH_KEY = 'practicedojo-auth';
    const SLUG_RE = /^[A-Za-z0-9]{10}$/;
    const MAX_BLOB = 10 * 1024 * 1024;

    // Errors carry a `code` the app turns into plain language.
    function fail(code, message, cause) {
        const e = new Error(message || code);
        e.code = code;
        if (cause) e.cause = cause;
        return e;
    }

    // --- Reading (no SDK, no sign-in) -------------------------------------------
    async function getShare(slug) {
        if (!SLUG_RE.test(String(slug || ''))) return null;
        let r;
        try {
            r = await fetch(`${URL}/rest/v1/rpc/get_share`, {
                method: 'POST',
                headers: { apikey: KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug })
            });
        } catch (e) { throw fail('offline', 'network', e); }
        if (!r.ok) throw fail('unavailable', `get_share HTTP ${r.status}`);
        const row = await r.json();
        return row && row.id ? row : null;
    }

    function blobUrl(row) {
        return `${URL}/storage/v1/object/public/shares/${encodeURIComponent(row.owner_id)}/${encodeURIComponent(row.id)}.json.gz`;
    }

    async function fetchShareBlob(row) {
        let r;
        try { r = await fetch(blobUrl(row)); } catch (e) { throw fail('offline', 'network', e); }
        if (r.status === 400 || r.status === 404) throw fail('gone', 'share file missing');
        if (!r.ok) throw fail('unavailable', `share file HTTP ${r.status}`);
        return r.arrayBuffer();
    }

    // --- The SDK, loaded on first write -----------------------------------------
    let clientPromise = null;
    function client() {
        if (!clientPromise) {
            clientPromise = new Promise((resolve, reject) => {
                if (window.supabase && window.supabase.createClient) { resolve(); return; }
                const s = document.createElement('script');
                s.src = SDK_SRC;
                s.integrity = SDK_SRI;
                s.crossOrigin = 'anonymous';
                s.onload = () => resolve();
                s.onerror = () => reject(fail('offline', 'Could not load the sharing library'));
                document.head.appendChild(s);
            }).then(() => window.supabase.createClient(URL, KEY, {
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_KEY }
            }));
            clientPromise.catch(() => { clientPromise = null; });
        }
        return clientPromise;
    }

    // True once this browser has an identity (anonymous or real), without
    // loading the SDK or calling Supabase.
    function hasIdentity() {
        try { return !!localStorage.getItem(AUTH_KEY); } catch (e) { return false; }
    }

    // The visitor's user id, signing in anonymously the first time (§9.3).
    async function ensureUser() {
        const sb = await client();
        const { data } = await sb.auth.getSession();
        if (data && data.session) return { sb, uid: data.session.user.id };
        const res = await sb.auth.signInAnonymously();
        if (res.error) {
            const status = res.error.status;
            throw fail(status === 429 ? 'rate_limited' : 'unavailable', res.error.message, res.error);
        }
        return { sb, uid: res.data.user.id };
    }

    function newSlug() {
        const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let out = '';
        while (out.length < 10) {
            const bytes = crypto.getRandomValues(new Uint8Array(16));
            for (const b of bytes) {
                if (b < 248 && out.length < 10) out += abc[b % 62]; // 248 = 4 × 62: no modulo bias
            }
        }
        return out;
    }

    // Turns a database / storage error into one of our codes.
    function classify(err) {
        const msg = String((err && (err.message || err.error)) || '');
        if (/share_limit_reached/.test(msg)) return fail('limit', msg, err);
        if (/share_storage_full/.test(msg)) return fail('storage_full', msg, err);
        if (/Failed to fetch|NetworkError|network/i.test(msg)) return fail('offline', msg, err);
        return fail('unavailable', msg, err);
    }

    // Inserts the row, retrying on the (astronomically unlikely) slug collision.
    async function insertRow(sb, row) {
        for (let attempt = 0; attempt < 3; attempt++) {
            const id = newSlug();
            const { error } = await sb.from('shares').insert({ ...row, id });
            if (!error) return id;
            if (error.code !== '23505') throw classify(error);
        }
        throw fail('unavailable', 'Could not pick a free link code');
    }

    function shareUrl(slug) {
        return `${location.origin}${location.pathname}?s=${slug}`;
    }

    // --- Creating ----------------------------------------------------------------
    async function createDeckShare({ title, deckText }) {
        const { sb } = await ensureUser();
        const slug = await insertRow(sb, {
            kind: 'deck',
            title: String(title || 'Deck').slice(0, 120),
            deck_text: String(deckText || '').slice(0, 8000)
        });
        return { slug, url: shareUrl(slug) };
    }

    // blob: the gzipped v2 session file (DojoLibrary.encodeBlob).
    async function createSessionShare({ title, summary, blob }) {
        if (!blob || blob.type !== 'application/gzip') throw fail('no_gzip', 'This browser cannot compress session files');
        if (blob.size > MAX_BLOB) throw fail('too_big', String(blob.size));
        const { sb, uid } = await ensureUser();
        const slug = await insertRow(sb, {
            kind: 'session',
            title: String(title || 'Session').slice(0, 120),
            summary: summary || {},
            blob_bytes: blob.size
        });
        // Shares never change, so the CDN may keep them for a day.
        const up = await sb.storage.from('shares').upload(`${uid}/${slug}.json.gz`, blob, {
            contentType: 'application/gzip', cacheControl: '86400', upsert: false
        });
        if (up.error) {
            // A row without a file would open as "no longer available"; take it back.
            await sb.from('shares').delete().eq('id', slug);
            throw classify(up.error);
        }
        return { slug, url: shareUrl(slug) };
    }

    // --- My shared links -----------------------------------------------------------
    async function listMyShares() {
        if (!hasIdentity()) return [];
        const { sb } = await ensureUser();
        const { data, error } = await sb.from('shares')
            .select('id, owner_id, kind, title, blob_bytes, created_at')
            .order('created_at', { ascending: false });
        if (error) throw classify(error);
        return (data || []).map(r => ({ ...r, url: shareUrl(r.id) }));
    }

    async function deleteShare(row) {
        const { sb, uid } = await ensureUser();
        if (row.kind === 'session') {
            const rm = await sb.storage.from('shares').remove([`${uid}/${row.id}.json.gz`]);
            if (rm.error) throw classify(rm.error);
        }
        const { error } = await sb.from('shares').delete().eq('id', row.id);
        if (error) throw classify(error);
    }

    return {
        SLUG_RE, MAX_BLOB,
        getShare, fetchShareBlob, hasIdentity,
        createDeckShare, createSessionShare, listMyShares, deleteShare, shareUrl
    };
})();
