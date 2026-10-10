// Builds the in-app manual (app/help/manual.json) from its sources, and checks them.
// See docs/ARCH-help-and-tour.md §5 (content), §7.1 (targets) and §10 (this tool).
//
//   node tools/help.mjs           validate the sources and write app/help/manual.json
//   node tools/help.mjs --check   validate, and exit 1 if anything is broken or manual.json is stale
//   node tools/help.mjs --test    run the golden search queries (tools/help-golden.json) against
//                                 the manual built from the current sources; exit 1 if any fails
//       --manual <dir|file.json>  build from another help folder, or test a built manual.json
//       --verbose                 print every query, not only the failures
//
//   node tools/help.mjs --live    open the app headless (1440 and 390) and check every target in
//                                 app/help/targets.json shows on its devices (tools/help-live.mjs)
//
// Coming later (§12): shots (the manual's screenshots, M3).
//
// Sources, all under app/help/:
//   sections.json             section ids, titles and folders, in order
//   articles/<dir>/<id>.md    one article per file: front matter, then Markdown
//   targets.json              named UI targets -> selectors per device
//   synonyms.json             player words -> Dojo words
//   tours/<id>.json           guided tours (M6)
// plus tools/help-golden.json (checked here, run by --test).
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { runInThisContext } from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const test = args.includes('--test');
const manualArg = args.includes('--manual') ? args[args.indexOf('--manual') + 1] : null;
if (args.includes('--manual') && !manualArg) { console.error('--manual needs a help folder or a manual.json'); process.exit(2); }
const manualIsDir = manualArg && statSync(manualArg).isDirectory();
const HELP = manualIsDir ? resolve(manualArg) : join(ROOT, 'app/help');
const OUT = join(HELP, 'manual.json');
if (test && manualArg && !manualIsDir) {
    await runTests(JSON.parse(readFileSync(manualArg, 'utf8')));
}

// --live (M4): every target visible in the running app. Lives in tools/help-live.mjs.
if (args.includes('--live')) {
    const { runLive } = await import('./help-live.mjs');
    process.exit(runLive(ROOT));
}

const later = { shots: 'M3 (content)' };
for (const [flag, ms] of Object.entries(later)) {
    if (args.includes(flag)) {
        console.error(`${flag} isn't built yet: it arrives with ${ms}. See docs/ARCH-help-and-tour.md §10 and §12.`);
        process.exit(2);
    }
}

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const rel = (p) => relative(ROOT, p);
const readJSON = (p) => {
    try { return JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { err(rel(p), `can't read it as JSON (${e.message})`); return null; }
};

const DEVICES = ['desktop', 'phone'];
const BLOCK_TAGS = ['desktop', 'phone', 'mouse', 'touch'];
const GESTURES = ['tap', 'double-tap', 'long-press', 'swipe', 'drag', 'pinch'];
const SCREENS = ['board', 'home', 'library', 'multiverse', 'mulligan', 'tweaks', 'drawer', 'challenge', 'shared'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION_RE = /^v(\d+)\.(\d+)\.(\d+)$/;

// The heading slug. The viewer and the search use the slugs in the bundle, so
// this is the only place the rule lives.
const slugify = (text) => text.toLowerCase()
    .replace(/[`*_]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-');

// ---- App: version and the element ids targets may point at ----
const appHtml = readFileSync(join(ROOT, 'app/index.html'), 'utf8');
const vm = /const APP_VERSION = "(v\d+\.\d+\.\d+)"/.exec(appHtml);
if (!vm) throw new Error('APP_VERSION not found in app/index.html');
const APP_VERSION = vm[1];
const appIds = new Set([...appHtml.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

// ---- Front matter: a small YAML subset (strings and inline lists) ----
function parseFront(text, where) {
    const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
    if (!m) { err(where, 'no front matter (--- … --- at the top)'); return { fm: {}, body: text }; }
    const fm = {};
    m[1].split('\n').forEach((line, i) => {
        if (!line.trim() || line.trim().startsWith('#')) return;
        const kv = /^([a-z]+):\s*(.*?)\s*(#.*)?$/.exec(line);
        if (!kv) { err(where, `front matter line ${i + 2} isn't "key: value": ${line}`); return; }
        let v = kv[2];
        if (v.startsWith('[') && v.endsWith(']')) {
            v = v.slice(1, -1).split(',').map(s => unquote(s.trim())).filter(Boolean);
        } else v = unquote(v);
        if (kv[1] in fm) err(where, `"${kv[1]}" is set twice`);
        fm[kv[1]] = v;
    });
    return { fm, body: text.slice(m[0].length) };
}
function unquote(s) {
    if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) return s.slice(1, -1);
    return s;
}

// ---- Sections ----
const sectionsSrc = readJSON(join(HELP, 'sections.json'));
const sections = (sectionsSrc && sectionsSrc.sections) || [];
const sectionByDir = {};
sections.forEach((s, i) => {
    const where = `app/help/sections.json #${i + 1}`;
    if (!s.id || !ID_RE.test(s.id)) err(where, `bad section id "${s.id}"`);
    if (!s.title) err(where, 'no title');
    if (!s.dir || !existsSync(join(HELP, 'articles', s.dir))) err(where, `folder app/help/articles/${s.dir} doesn't exist`);
    sectionByDir[s.dir] = s;
});

// ---- Targets ----
const targetsSrc = readJSON(join(HELP, 'targets.json'));
const targets = (targetsSrc && targetsSrc.targets) || {};
for (const [name, t] of Object.entries(targets)) {
    const where = `app/help/targets.json "${name}"`;
    if (!ID_RE.test(name)) err(where, 'target names are lowercase-with-hyphens');
    for (const k of Object.keys(t)) if (!['label', 'screen', 'any', ...DEVICES].includes(k)) err(where, `unknown key "${k}"`);
    if (!t.label) err(where, 'no label (what the callout calls it, e.g. "End turn")');
    if (!SCREENS.includes(t.screen)) err(where, `screen must be one of ${SCREENS.join(', ')}`);
    const sels = ['any', ...DEVICES].filter(k => t[k]);
    if (!sels.length) err(where, 'needs a selector: any, desktop or phone');
    for (const k of sels) {
        const ids = [...String(t[k]).matchAll(/#([A-Za-z][\w-]*)/g)].map(m => m[1]);
        if (!ids.length) warn(where, `${k} selector "${t[k]}" has no #id; only --live can check it`);
        for (const id of ids) if (!appIds.has(id)) err(where, `${k} selector points at #${id}, which isn't in app/index.html`);
    }
}

// ---- Synonyms ----
const synSrc = readJSON(join(HELP, 'synonyms.json'));
const synonyms = (synSrc && synSrc.groups) || [];
const synSeen = {};
synonyms.forEach((g, i) => {
    const where = `app/help/synonyms.json group ${i + 1}`;
    if (!Array.isArray(g) || g.length < 2) { err(where, 'a group is a list of at least two words, the Dojo word first'); return; }
    g.forEach(w => {
        if (typeof w !== 'string' || !w.trim() || w !== w.toLowerCase()) err(where, `"${w}" must be a lowercase word or phrase`);
        if (synSeen[w] != null) warn(where, `"${w}" is also in group ${synSeen[w] + 1}`);
        synSeen[w] = i;
    });
});

// ---- Articles ----
const articles = [];
const byId = {};
for (const s of sections) {
    const dir = join(HELP, 'articles', s.dir);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
        const file = join(dir, f);
        const where = rel(file);
        const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
        const { fm, body } = parseFront(text, where);
        const id = f.slice(0, -3);
        if (fm.id !== id) err(where, `id "${fm.id}" must match the file name "${id}"`);
        if (!ID_RE.test(id)) err(where, 'ids are lowercase-with-hyphens');
        if (byId[id]) err(where, `id "${id}" is also used by ${byId[id].file}`);
        for (const k of Object.keys(fm)) {
            if (!['id', 'title', 'summary', 'devices', 'aliases', 'targets', 'related', 'verified', 'order'].includes(k)) err(where, `unknown front matter key "${k}"`);
        }
        const list = (k) => (fm[k] == null ? [] : Array.isArray(fm[k]) ? fm[k] : (err(where, `${k} must be a list: [a, b]`), []));
        const todo = /^TODO\b/.test(body.trim());
        const a = {
            id, section: s.id, title: fm.title || '', summary: fm.summary || '',
            devices: fm.devices == null ? DEVICES.slice() : list('devices'),
            aliases: list('aliases'), targets: list('targets'), related: list('related'),
            order: fm.order == null ? null : Number(fm.order),
            verified: fm.verified || '', todo, headings: [], body: body.trim() + '\n', file: where
        };
        if (!a.title) err(where, 'no title');
        if (!a.summary) err(where, 'no summary');
        if (a.order != null && !Number.isFinite(a.order)) err(where, 'order must be a number');
        a.devices.forEach(d => { if (!DEVICES.includes(d)) err(where, `devices: "${d}" isn't desktop or phone`); });
        if (!a.devices.length) err(where, 'devices is empty');
        a.targets.forEach(t => { if (!targets[t]) err(where, `targets: "${t}" isn't in app/help/targets.json`); });
        if (!todo) {
            const v = VERSION_RE.exec(a.verified);
            if (!v) err(where, `verified must be the app version you checked it against, like ${APP_VERSION}`);
            else {
                const [, M, m] = v.map(Number); const [, AM, Am] = VERSION_RE.exec(APP_VERSION).map(Number);
                if (M < AM || (M === AM && m < Am)) warn(where, `verified ${a.verified}, the app is ${APP_VERSION}: check it still holds`);
            }
        }
        // Headings and their slugs (## and ###), for deep links and search records.
        const slugs = new Set();
        let inFence = false;
        for (const line of a.body.split('\n')) {
            if (/^```/.test(line)) inFence = !inFence;
            const h = !inFence && /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
            if (!h) continue;
            let slug = slugify(h[2]);
            for (let n = 2; slugs.has(slug); n++) slug = `${slugify(h[2])}-${n}`;
            slugs.add(slug);
            a.headings.push({ level: h[1].length, text: h[2], slug });
        }
        if (/^#\s/m.test(a.body)) err(where, 'no # headings in the body: the title comes from the front matter; start at ##');
        articles.push(a);
        byId[id] = a;
    }
}

// Body checks that need every article: device blocks, extensions, links.
for (const a of articles) {
    const where = a.file;
    let open = null;
    a.body.split('\n').forEach((line, i) => {
        const b = /^:::\s*(.*)$/.exec(line.trim());
        if (!b) return;
        const tags = b[1].trim().split(/\s+/).filter(Boolean);
        if (!tags.length) {
            if (!open) err(where, `body line ${i + 1}: ::: closes a block that isn't open`);
            open = null;
            return;
        }
        if (open) err(where, `body line ${i + 1}: blocks don't nest (the block from line ${open} is still open)`);
        tags.forEach(t => { if (!BLOCK_TAGS.includes(t)) err(where, `body line ${i + 1}: unknown block tag "${t}" (use ${BLOCK_TAGS.join(', ')})`); });
        open = i + 1;
    });
    if (open) err(where, `the block opened on body line ${open} is never closed with :::`);
    for (const m of a.body.matchAll(/\{gesture:([^}]*)\}/g)) {
        if (!GESTURES.includes(m[1])) err(where, `{gesture:${m[1]}}: use one of ${GESTURES.join(', ')}`);
    }
    for (const m of a.body.matchAll(/\]\((show|help):([^)\s]*)\)/g)) {
        if (m[1] === 'show') { if (!targets[m[2]]) err(where, `show:${m[2]}: no such target in app/help/targets.json`); continue; }
        const [id, slug] = m[2].split('#');
        const to = byId[id];
        if (!to) err(where, `help:${m[2]}: no article "${id}"`);
        else if (slug && !to.headings.some(h => h.slug === slug)) err(where, `help:${m[2]}: "${id}" has no heading with the slug "${slug}"`);
    }
    a.related.forEach(r => { if (!byId[r]) err(where, `related: no article "${r}"`); else if (r === a.id) err(where, 'related lists itself'); });
}

// ---- Tours ----
const tours = [];
const tourDir = join(HELP, 'tours');
if (existsSync(tourDir)) {
    for (const f of readdirSync(tourDir).filter(f => f.endsWith('.json')).sort()) {
        const file = join(tourDir, f);
        const where = rel(file);
        const t = readJSON(file);
        if (!t) continue;
        const id = f.slice(0, -5);
        if (t.id !== id) err(where, `id "${t.id}" must match the file name "${id}"`);
        if (!t.title) err(where, 'no title');
        if (!Number.isFinite(t.minutes)) err(where, 'minutes must be a number');
        if (t.start && t.start.scenario && !existsSync(join(tourDir, t.start.scenario))) err(where, `start.scenario ${t.start.scenario} isn't in app/help/tours/`);
        if (!Array.isArray(t.steps) || !t.steps.length) { err(where, 'no steps'); continue; }
        const seen = new Set();
        t.steps.forEach((s, i) => {
            const sw = `${where} step ${i + 1}${s.id ? ` "${s.id}"` : ''}`;
            if (!s.id) err(sw, 'no id'); else if (seen.has(s.id)) err(sw, 'id used twice'); else seen.add(s.id);
            const texts = typeof s.text === 'string' ? [s.text] : s.text && typeof s.text === 'object' ? Object.values(s.text) : [];
            if (!texts.length) err(sw, 'no text');
            if (s.text && typeof s.text === 'object') Object.keys(s.text).forEach(k => { if (!DEVICES.includes(k)) err(sw, `text.${k}: use desktop or phone`); });
            // target: a name, or { desktop, phone }; also: [names], or { desktop: [...], phone: [...] }
            const names = (v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v).flat() : []);
            for (const k of ['target', 'also']) {
                if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) Object.keys(s[k]).forEach(d => { if (!DEVICES.includes(d)) err(sw, `${k}.${d}: use desktop or phone`); });
                names(s[k]).forEach(n => { if (!targets[n]) err(sw, `${k} "${n}" isn't in app/help/targets.json`); });
            }
            if (s.learn && !byId[s.learn]) err(sw, `learn: no article "${s.learn}"`);
            if (s.device && !DEVICES.includes(s.device)) err(sw, 'device must be desktop or phone');
            if (s.until != null && typeof s.until !== 'string') err(sw, 'until is the name of a predicate in tour.js');
        });
        tours.push({ id, title: t.title, minutes: t.minutes, order: Number.isFinite(t.order) ? t.order : 999, start: t.start || null, steps: t.steps });
    }
    // Help lists the tours in their `order` (then by file name).
    tours.sort((a, b) => a.order - b.order);
}

// ---- Golden queries (run by --test once search exists) ----
const golden = readJSON(join(ROOT, 'tools/help-golden.json'));
((golden && golden.queries) || []).forEach((g, i) => {
    const where = `tools/help-golden.json #${i + 1} "${g.q}"`;
    if (!g.q) err(where, 'no q');
    if (!byId[g.article]) err(where, `no article "${g.article}"`);
    if (g.device && !DEVICES.includes(g.device)) err(where, 'device must be desktop or phone');
});

// ---- The bundle ----
const order = (x, y) => ((x.order ?? 1e9) - (y.order ?? 1e9)) || x.id.localeCompare(y.id);
const bundle = {
    format: 'practice-dojo-manual',
    version: 1,
    sections: sections.map(s => ({ id: s.id, title: s.title, articles: articles.filter(a => a.section === s.id).sort(order).map(a => a.id) })),
    articles: sections.flatMap(s => articles.filter(a => a.section === s.id).sort(order))
        .map(({ file, order, ...a }) => a),
    targets,
    synonyms,
    tours
};
const json = JSON.stringify(bundle, null, 1) + '\n';

// ---- Report ----
warnings.forEach(w => console.warn(`warning  ${w}`));
errors.forEach(e => console.error(`error    ${e}`));
const todo = articles.filter(a => a.todo).length;
const summary = `${articles.length} articles in ${sections.length} sections (${todo} still TODO), ` +
    `${Object.keys(targets).length} targets, ${synonyms.length} synonym groups, ${tours.length} tours`;
if (errors.length) {
    console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'}; app/help/manual.json not ${check ? 'checked' : 'written'}.`);
    process.exit(1);
}
if (test) await runTests(bundle);
const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
if (check) {
    if (current !== json) {
        console.error('app/help/manual.json is out of date: run node tools/help.mjs and commit it.');
        process.exit(1);
    }
    console.log(`app/help/manual.json is current: ${summary}.`);
} else if (current === json) {
    console.log(`app/help/manual.json: already current. ${summary}.`);
} else {
    writeFileSync(OUT, json);
    console.log(`app/help/manual.json written: ${summary}.`);
}

// ---- --test: the golden search queries (§10) ----
// Fuse 6.6.2 is fetched once into tools/.cache/ (git-ignored): no package.json, no node_modules.
async function loadFuse() {
    const file = join(ROOT, 'tools/.cache/fuse-6.6.2.js');
    const url = 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.js';
    if (!existsSync(file)) {
        mkdirSync(dirname(file), { recursive: true });
        let src = null;
        try {
            const r = await fetch(url, { signal: AbortSignal.timeout(15000) });
            if (r.ok) src = await r.text();
        } catch { /* behind a proxy Node's fetch may fail; curl uses HTTPS_PROXY */ }
        if (!src) {
            try { src = execFileSync('curl', ['-sSfL', '--max-time', '30', url], { encoding: 'utf8' }); }
            catch (e) { console.error(`Couldn't download ${url} (${e.message.split('\n')[0]}). Save it as ${relative(ROOT, file)} and run again.`); process.exit(2); }
        }
        if (!src.includes('Fuse.js v6.6.2')) { console.error(`${url} didn't look like Fuse 6.6.2.`); process.exit(2); }
        writeFileSync(file, src);
    }
    const m = { exports: {} };
    runInThisContext(`(function (module, exports) {${readFileSync(file, 'utf8')}\n})`, { filename: file })(m, m.exports);
    return m.exports;
}

async function runTests(manual) {
    const Fuse = await loadFuse();
    const file = join(ROOT, 'app/js/help-search.js');
    const win = {};
    runInThisContext(`(function (window) {${readFileSync(file, 'utf8')}\n})`, { filename: file })(win);
    const S = win.DojoHelpSearch;
    let t = performance.now();
    const index = S.build(manual, { Fuse });
    const buildMs = performance.now() - t;
    const golden = JSON.parse(readFileSync(join(ROOT, 'tools/help-golden.json'), 'utf8')).queries;
    const verbose = args.includes('--verbose');
    const known = new Set(manual.articles.map(a => a.id));
    let pass = 0, max = 0, total = 0, runs = 0;
    const lines = [];
    for (const g of golden) {
        const device = g.device || 'desktop';
        const res = S.query(index, g.q, { device, limit: 12 });
        t = performance.now();
        for (let i = 0; i < 20; i++) S.query(index, g.q, { device, limit: 12 });
        const ms = (performance.now() - t) / 20;
        total += ms; runs++; max = Math.max(max, ms);
        const rank = res.findIndex(r => r.article === g.article) + 1;
        const ok = rank >= 1 && rank <= 3;
        if (ok) pass++;
        if (!ok || verbose) {
            const top = res.slice(0, 3).map(r => `${r.id} ${r.score.toFixed(2)}`).join(' | ') || '(no results)';
            lines.push(`${ok ? 'pass' : 'FAIL'}  ${JSON.stringify(g.q).padEnd(30)} ${(device === 'phone' ? '[phone] ' : '') + g.article.padEnd(22)} rank ${rank || '-'}`.padEnd(84) +
                `  top 3: ${top}${!ok && !known.has(g.article) ? '  (no such article)' : ''}`);
        }
    }
    lines.forEach(l => console.log(l));
    const todo = manual.articles.filter(a => a.todo).length;
    console.log(`\n${pass}/${golden.length} golden queries find their article in the top 3 ` +
        `(${manual.articles.length} articles, ${todo} still TODO, ${index.records.length} records).`);
    console.log(`Timing: build ${buildMs.toFixed(1)} ms; query ${(total / runs).toFixed(2)} ms average, ${max.toFixed(2)} ms slowest.`);
    process.exit(pass === golden.length ? 0 : 1);
}
