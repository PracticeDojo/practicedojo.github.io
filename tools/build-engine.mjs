#!/usr/bin/env node
// Builds the Lorcana rules engine (TheCardGoat/tcg-engines, MIT) into app/vendor/lorcana-engine/
// for Feature 68 (experimental, branch feat/68-rules-engine). Repo tooling: the site never loads it.
//
//   node tools/build-engine.mjs              build at the pinned commit
//   node tools/build-engine.mjs --src DIR    build from an existing tcg-engines checkout instead
//   node tools/build-engine.mjs --dev        unminified, for profiling and debugging (don't commit it)
//
// Writes engine.worker.js (classic worker / plain script, exposes globalThis.DojoEngine),
// cards.json (every card definition, English only), VERSION and LICENSE.
// The upstream checkout and npm packages are cached in $DOJO_ENGINE_CACHE (default: <tmp>/dojo-engine-build).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const PIN = '6de59de1c203827edc1bc6faa1bc6184cd126a5f'; // public sync 2026-W41
const REPO = 'https://github.com/TheCardGoat/tcg-engines.git';
// Runtime deps of the engine, at the versions in upstream's pnpm-lock.yaml at PIN.
const DEPS = ['esbuild@0.27.7', 'mutative@1.3.0', 'nanoid@5.1.11', 'seedrandom@3.0.5', 'zod@4.4.3',
    '@logtape/logtape@2.0.7', '@logtape/pretty@2.0.7', 'unique-names-generator@4.7.1', 'object-hash@3.0.0'];
const LORCANA = 'submodules/lorcana/packages/lorcana';
const AGNOSTIC = 'submodules/agnostic-simulator/packages';
const PACKAGES = {
    'lorcana-engine': `${LORCANA}/lorcana-engine`, 'lorcana-types': `${LORCANA}/lorcana-types`,
    'lorcana-cards': `${LORCANA}/lorcana-cards`, 'bot-core': `${AGNOSTIC}/bot-core`,
    'shared': `${AGNOSTIC}/shared`, 'card-model': `${AGNOSTIC}/card-model`,
    'protocol': `${AGNOSTIC}/protocol`, 'game-page-contract': `${AGNOSTIC}/game-page-contract`
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'app/vendor/lorcana-engine');
const CACHE = process.env.DOJO_ENGINE_CACHE || join(tmpdir(), 'dojo-engine-build');
const argSrc = process.argv.indexOf('--src');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });

function checkout() {
    if (argSrc > 0) return resolve(process.argv[argSrc + 1]);
    const dir = join(CACHE, 'tcg-engines');
    if (!existsSync(join(dir, '.git'))) {
        mkdirSync(CACHE, { recursive: true });
        run('git', ['clone', '--filter=blob:none', '--no-checkout', REPO, dir]);
        // Cone mode also brings the files directly in each parent folder, so submodules/lorcana/LICENSE comes too.
        run('git', ['-C', dir, 'sparse-checkout', 'set', ...Object.values(PACKAGES)]);
    }
    try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${PIN}^{commit}`]); }
    catch { run('git', ['-C', dir, 'fetch', 'origin', PIN]); }
    run('git', ['-C', dir, 'checkout', '--quiet', '--force', PIN]);
    return dir;
}

function deps(src) {
    const dir = join(CACHE, 'deps');
    const stamp = join(dir, 'installed.txt');
    if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== DEPS.join('\n')) {
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package.json'), '{"private":true}\n');
        run('npm', ['install', '--no-audit', '--no-fund', '--prefix', dir, ...DEPS]);
        writeFileSync(stamp, DEPS.join('\n'));
    }
    // The workspace packages resolve each other as @tcg/* through this folder (esbuild nodePaths).
    const tcg = join(dir, 'node_modules/@tcg');
    rmSync(tcg, { recursive: true, force: true });
    mkdirSync(tcg, { recursive: true });
    for (const [name, path] of Object.entries(PACKAGES)) symlinkSync(join(src, path), join(tcg, name), 'dir');
    return join(dir, 'node_modules');
}

const src = checkout();
const nodeModules = deps(src);
const esbuild = await import(pathToFileURL(join(nodeModules, 'esbuild/lib/main.js')).href);
mkdirSync(OUT, { recursive: true });
// One tsconfig for every file: upstream's extend shared configs that aren't in the sparse checkout.
// Class fields use define semantics, as upstream's ES2023 target does.
const tsconfig = join(CACHE, 'tsconfig.json');
writeFileSync(tsconfig, JSON.stringify({ compilerOptions: { target: 'es2022', useDefineForClassFields: true } }));
const common = { bundle: true, nodePaths: [nodeModules], tsconfig, logLevel: 'warning', target: 'es2022', legalComments: 'none' };
const banner = `/* Lorcana engine from TheCardGoat/tcg-engines@${PIN.slice(0, 9)}, MIT licence (see LICENSE). Built by tools/build-engine.mjs; do not edit. */`;

// Edits to upstream source at build time. Each must still match, or the build fails: then upstream
// changed that code, so check whether the edit is still needed and drop or update it.
const PATCHES = [
    {
        file: 'lorcana-engine/src/testing/index.ts',
        why: 'loads Bun matchers with a top-level await, which a classic script cannot hold (the block only runs under Bun)',
        find: /\nif \("Bun" in globalThis\) \{\n[\s\S]*?\n\}\n/, replace: '\n'
    },
    {
        file: 'lorcana-engine/src/automation/planner.ts',
        why: 'the bot\'s scry fallback looks at the bottom of the deck (the top is the end of the array), so its pick is rejected and it concedes. To report upstream',
        find: 'return deckCards.slice(0, amount);', replace: 'return deckCards.slice(-amount).reverse();'
    },
    // Speed only. Both list the players by walking every card's owner through mutative proxies, once
    // per static-effect check, so a move costs O(cards²). G.lore and ctx.playerIds already hold every
    // player. Halves a busy board's move (spike log, §12). To report upstream.
    {
        file: 'lorcana-engine/src/runtime-moves/rules/static-ability-utils.ts',
        why: 'getStatePlayerIds walks the whole card index',
        find: 'for (const entry of Object.values(state._zonesPrivate?.cardIndex ?? {})) {',
        replace: 'for (const entry of [] as Record<string, unknown>[]) {'
    },
    {
        file: 'lorcana-engine/src/rules/derived-state.ts',
        why: 'getProjectionPlayerIds walks the whole card index',
        find: 'for (const entry of Object.values(state.ctx.zones?.private?.cardIndex ?? {})) {',
        replace: 'for (const entry of [] as Record<string, unknown>[]) {'
    }
];
const patchUpstream = {
    name: 'patch-upstream',
    setup(build) {
        for (const p of PATCHES) {
            const filter = new RegExp(p.file.replace(/[.]/g, '\\.').replace(/\//g, '[\\\\/]') + '$');
            build.onLoad({ filter }, ({ path }) => {
                const code = readFileSync(path, 'utf8');
                const out = code.replace(p.find, p.replace);
                if (out === code) throw new Error(`patch for ${p.file} no longer applies (${p.why})`);
                return { contents: out, loader: 'ts' };
            });
        }
    }
};

// 1. The worker: adapter + engine, one plain script.
const t0 = Date.now();
await esbuild.build({
    ...common, entryPoints: [join(ROOT, 'tools/engine-adapter/worker.ts')], outfile: join(OUT, 'engine.worker.js'),
    format: 'iife', platform: 'browser', minify: !process.argv.includes('--dev'), banner: { js: banner }, metafile: true, plugins: [patchUpstream]
}).then(r => writeFileSync(join(CACHE, 'worker-meta.json'), JSON.stringify(r.metafile)));

// 2. The card catalogue as data: bundle a tiny exporter for Node, run it, drop the translations.
const exporter = join(CACHE, 'export-cards.mjs');
const catalogData = join(src, PACKAGES['lorcana-cards'], 'src/cards/catalog-data.ts');
await esbuild.build({
    ...common, stdin: { contents: `export { allCards } from ${JSON.stringify(catalogData)};`, resolveDir: ROOT },
    outfile: exporter, format: 'esm', platform: 'node'
});
const { allCards } = await import(pathToFileURL(exporter).href + `?t=${Date.now()}`);
const cards = allCards.map(({ i18n, ...card }) => card);
writeFileSync(join(OUT, 'cards.json'), JSON.stringify(cards));

writeFileSync(join(OUT, 'VERSION'), `${PIN}\n`);
writeFileSync(join(OUT, 'LICENSE'), readFileSync(join(src, 'submodules/lorcana/LICENSE')));

const size = (f) => {
    const buf = readFileSync(join(OUT, f));
    return `${f}: ${(statSync(join(OUT, f)).size / 1024).toFixed(0)} KB, gzip ${(gzipSync(buf, { level: 9 }).length / 1024).toFixed(0)} KB, brotli ${(brotliCompressSync(buf).length / 1024).toFixed(0)} KB`;
};
console.log(`Built in ${((Date.now() - t0) / 1000).toFixed(1)} s at ${PIN.slice(0, 9)}: ${cards.length} cards`);
console.log(size('engine.worker.js'));
console.log(size('cards.json'));
