// DojoCloud — share links (§9) and optional accounts (§8) of
// docs/ARCH-accounts-and-library.md. The only file that knows Supabase exists.
//
// Reading a link needs no account and no library: one RPC (get_share) and,
// for a session, one public file download, both with plain fetch.
// Creating a link signs the visitor in anonymously behind the scenes (§9.3).
// Signing in (Discord / Google) keeps decks and sessions in the account.
// supabase-js is loaded only when one of those is needed, so a signed-out
// visit never pays for it. Classic script, one global, no build step.

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
                // PKCE: the OAuth redirect comes back with ?code=, which the SDK
                // exchanges for a session when it starts.
                auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce', storageKey: AUTH_KEY }
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
        if (/account_deck_limit/.test(msg)) return fail('deck_quota', msg, err);
        if (/account_session_limit/.test(msg)) return fail('session_quota', msg, err);
        if (/account_storage_full/.test(msg)) return fail('account_storage_full', msg, err);
        if (/JWT|not_signed_in|row-level security/i.test(msg)) return fail('signed_out', msg, err);
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

    // --- Accounts (§8) --------------------------------------------------------------
    // Who's signed in, read from the stored session without loading the SDK.
    function storedUser() {
        try {
            const s = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
            return (s && (s.user || (s.currentSession && s.currentSession.user))) || null;
        } catch (e) { return null; }
    }

    function userInfo(u) {
        if (!u) return null;
        const md = u.user_metadata || {};
        return {
            id: u.id,
            isAnonymous: !!u.is_anonymous,
            name: md.full_name || md.name || md.global_name || md.user_name || md.preferred_username || u.email || 'Your account',
            email: u.email || md.email || '',
            avatar: md.avatar_url || md.picture || '',
            provider: (u.app_metadata && u.app_metadata.provider) || ''
        };
    }

    // A real (Discord / Google) account in this browser, as far as we know offline.
    function isSignedIn() {
        const u = storedUser();
        return !!(u && !u.is_anonymous);
    }

    // The page was opened by an OAuth redirect (?code= / an error) that needs the SDK.
    function authRedirectParams() {
        const q = new URLSearchParams(location.search);
        const h = new URLSearchParams(location.hash.replace(/^#/, ''));
        const get = (k) => q.get(k) || h.get(k);
        if (!q.has('code') && !get('error') && !get('error_code')) return null;
        return { code: q.get('code'), error: get('error'), errorCode: get('error_code'), description: get('error_description') };
    }

    function cleanAuthParams() {
        const q = new URLSearchParams(location.search);
        ['code', 'error', 'error_code', 'error_description', 'state'].forEach(k => q.delete(k));
        const qs = q.toString();
        history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    }

    // Run at startup. Loads the SDK only when someone is (or is becoming)
    // signed in. → { user, justSignedIn, error: { code, description } | null }
    async function initAuth() {
        const redirect = authRedirectParams();
        if (!redirect && !isSignedIn()) return { user: null, justSignedIn: false, error: null };
        let sb;
        try { sb = await client(); } catch (e) { return { user: userInfo(storedUser()), justSignedIn: false, error: { code: 'offline' } }; }
        const { data } = await sb.auth.getSession();
        if (redirect) cleanAuthParams();
        const u = data && data.session ? data.session.user : null;
        const error = redirect && (redirect.error || redirect.errorCode)
            ? { code: redirect.errorCode || redirect.error, description: redirect.description || '' } : null;
        return { user: u && !u.is_anonymous ? userInfo(u) : null, justSignedIn: !!(redirect && redirect.code && u && !u.is_anonymous), error };
    }

    function redirectTo() {
        return location.origin + location.pathname;
    }

    // Sign in with 'discord' or 'google'. An anonymous identity (share links)
    // is linked, so its links become the account's (§9.3). Leaves the page.
    async function signIn(provider, { fresh = false } = {}) {
        const sb = await client();
        try { sessionStorage.setItem('practicedojo-signin', provider); } catch (e) { }
        const { data } = await sb.auth.getSession();
        const anon = data && data.session && data.session.user.is_anonymous;
        const res = (anon && !fresh)
            ? await sb.auth.linkIdentity({ provider, options: { redirectTo: redirectTo() } })
            : await sb.auth.signInWithOAuth({ provider, options: { redirectTo: redirectTo() } });
        if (res.error) throw fail('unavailable', res.error.message, res.error);
    }

    function lastSignInProvider() {
        try { return sessionStorage.getItem('practicedojo-signin'); } catch (e) { return null; }
    }

    async function signOut() {
        const sb = await client();
        await sb.auth.signOut({ scope: 'local' });
    }

    async function realUser() {
        const sb = await client();
        const { data } = await sb.auth.getSession();
        const u = data && data.session && data.session.user;
        if (!u || u.is_anonymous) throw fail('signed_out', 'Not signed in');
        return { sb, uid: u.id };
    }

    // Revision-checked write (§8.3): insert when the device has no revision;
    // otherwise update only if the account is still at that revision. A row
    // deleted from the account meanwhile is simply inserted again.
    // → new revision; throws code 'conflict' with e.current = the account's revision.
    async function revisedWrite(sb, table, id, fields, revision) {
        if (revision != null) {
            const { data, error } = await sb.from(table).update({ ...fields, revision: revision + 1 })
                .eq('id', id).eq('revision', revision).select('revision');
            if (error) throw classify(error);
            if (data && data.length) return data[0].revision;
            const cur = await sb.from(table).select('revision').eq('id', id).maybeSingle();
            if (cur.error) throw classify(cur.error);
            if (cur.data) { const e = fail('conflict', 'Changed in the account'); e.current = cur.data.revision; throw e; }
        }
        const { error } = await sb.from(table).insert({ id, ...fields, revision: 1 });
        if (!error) return 1;
        if (error.code === '23505') {
            const cur = await sb.from(table).select('revision').eq('id', id).maybeSingle();
            const e = fail('conflict', 'Already in the account'); e.current = cur.data ? cur.data.revision : null; throw e;
        }
        throw classify(error);
    }

    async function listAccountDecks() {
        const { sb } = await realUser();
        const { data, error } = await sb.from('decks').select('id, name, decklist, notes, revision, created_at, updated_at')
            .order('updated_at', { ascending: false });
        if (error) throw classify(error);
        return data || [];
    }

    async function saveAccountDeck({ id, name, decklist, notes, revision }) {
        const { sb } = await realUser();
        return revisedWrite(sb, 'decks', id, {
            name: String(name || 'Untitled deck').slice(0, 80),
            decklist: String(decklist || '').slice(0, 8000),
            notes: String(notes || '').slice(0, 4000)
        }, revision);
    }

    async function deleteAccountDeck(id) {
        const { sb } = await realUser();
        const { error } = await sb.from('decks').delete().eq('id', id);
        if (error) throw classify(error);
    }

    async function listAccountSessions() {
        const { sb } = await realUser();
        const { data, error } = await sb.from('sessions').select('id, title, summary, blob_bytes, revision, created_at, updated_at')
            .order('updated_at', { ascending: false });
        if (error) throw classify(error);
        return data || [];
    }

    // blob: the gzipped v2 file. The row is claimed first (revision check),
    // then the file is written, so a conflict never overwrites another device's file.
    async function saveAccountSession({ id, title, summary, blob, revision }) {
        if (!blob || blob.type !== 'application/gzip') throw fail('no_gzip', 'Session file is not gzipped');
        if (blob.size > MAX_BLOB) throw fail('too_big', String(blob.size));
        const { sb, uid } = await realUser();
        const rev = await revisedWrite(sb, 'sessions', id, {
            title: String(title || 'Session').slice(0, 120),
            summary: summary || {},
            blob_bytes: blob.size
        }, revision);
        const up = await sb.storage.from('sessions').upload(`${uid}/${id}.json.gz`, blob, {
            contentType: 'application/gzip', cacheControl: '0', upsert: true
        });
        if (up.error) throw classify(up.error);
        return rev;
    }

    async function downloadAccountSession(id) {
        const { sb, uid } = await realUser();
        const { data, error } = await sb.storage.from('sessions').download(`${uid}/${id}.json.gz`);
        if (error) throw fail(/not.?found/i.test(error.message || '') ? 'gone' : 'unavailable', error.message, error);
        return data.arrayBuffer();
    }

    async function deleteAccountSession(id) {
        const { sb, uid } = await realUser();
        const rm = await sb.storage.from('sessions').remove([`${uid}/${id}.json.gz`]);
        if (rm.error) throw classify(rm.error);
        const { error } = await sb.from('sessions').delete().eq('id', id);
        if (error) throw classify(error);
    }

    async function accountUsage() {
        const { sb } = await realUser();
        const [d, s] = await Promise.all([
            sb.from('decks').select('id', { count: 'exact', head: true }),
            sb.from('sessions').select('id', { count: 'exact', head: true })
        ]);
        if (d.error) throw classify(d.error);
        if (s.error) throw classify(s.error);
        return { decks: d.count || 0, sessions: s.count || 0, maxDecks: 200, maxSessions: 50 };
    }

    return {
        SLUG_RE, MAX_BLOB,
        getShare, fetchShareBlob, hasIdentity,
        createDeckShare, createSessionShare, listMyShares, deleteShare, shareUrl,
        isSignedIn, currentUser: () => userInfo(storedUser()), initAuth, signIn, signOut, lastSignInProvider,
        listAccountDecks, saveAccountDeck, deleteAccountDeck,
        listAccountSessions, saveAccountSession, downloadAccountSession, deleteAccountSession, accountUsage
    };
})();
