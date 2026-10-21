// Frames from a Lorcana match video, for an agent to look at.
//
//   node frames.mjs <video file | URL> [options]
//
//   --out <dir>        Output folder (default $TMPDIR/dojo-frames). Created if missing.
//   --every 10         Seconds between frames (default 10), on multiples of it (0:10, 0:20 …).
//   --from 0:00        Start time (ss, mm:ss or hh:mm:ss). --to <time> stops there.
//   --width 1280       Width of each saved frame (default 1280).
//   --sheet 4x4        Contact sheets of the frames, each cell stamped with its time
//                      (default 4x4; --sheet 0 for none).
//   --crop w:h:x:y     Crop every frame first (ffmpeg crop, source pixels): zoom on a card,
//                      the lore counters or the client's log panel.
//   --at 12:34,12:50   Instead of a series, one full-size frame at each time (to read a card).
//
// Writes f-HH-MM-SS.jpg per frame and sheet-NNN.jpg. A web page URL (YouTube, Twitch …)
// goes through yt-dlp (`pip install yt-dlp`); a direct .mp4 / .m3u8 URL goes straight to ffmpeg.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONT = join(dirname(fileURLToPath(import.meta.url)), '../../../app/fonts/LiberationMono-Bold.woff2');

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
    console.log(readHelp());
    process.exit(args.length ? 0 : 1);
}
const opt = (k, d) => { const i = args.indexOf('--' + k); return i === -1 ? d : args[i + 1]; };
const src = args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1].startsWith('--')));
const out = opt('out', join(tmpdir(), 'dojo-frames'));
const every = Number(opt('every', 10));
const width = Number(opt('width', 1280));
const crop = opt('crop');
const sheet = opt('sheet', '4x4');
mkdirSync(out, { recursive: true });

const secs = (t) => t.split(':').reduce((a, v) => a * 60 + Number(v), 0);
const hms = (s) => new Date(Math.round(s) * 1000).toISOString().slice(11, 19);
const run = (cmd, a) => {
    const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (r.error) throw new Error(`${cmd} not found (${r.error.message})`);
    if (r.status) throw new Error(`${cmd} failed:\n${(r.stderr || '').split('\n').slice(-12).join('\n')}`);
    return r.stdout;
};

// A page URL → the media URL behind it.
let input = src;
if (/^https?:/.test(src) && !/\.(mp4|m3u8|webm|mkv|mov)(\?|$)/i.test(src)) {
    try { input = run('yt-dlp', ['-g', '-f', 'best[height<=1080][vcodec!=none]/best', src]).trim().split('\n')[0]; }
    catch (e) { console.error(e.message + (/not found/.test(e.message) ? '\nA page URL needs yt-dlp: pip install yt-dlp' : '')); process.exit(1); }
}

const cropF = crop ? `crop=${crop},` : '';
if (opt('at')) {
    for (const t of opt('at').split(',')) {
        const file = join(out, `at-${hms(secs(t)).replaceAll(':', '-')}.png`);
        run('ffmpeg', ['-v', 'error', '-y', '-ss', String(secs(t)), '-i', input, '-frames:v', '1', ...(crop ? ['-vf', `crop=${crop}`] : []), file]);
        console.log(file);
    }
    process.exit(0);
}

const from = secs(opt('from', '0'));
const range = ['-ss', String(from), ...(opt('to') ? ['-to', String(secs(opt('to')))] : []), '-copyts', '-i', input];
// One decode: frames to disk, and the same frames stamped with their time and tiled into sheets.
const tag = `drawtext=fontfile='${FONT}':text='%{pts\\:hms}':x=8:y=8:fontsize=h/9:fontcolor=white:box=1:boxcolor=black@0.7`;
const graph = sheet === '0'
    ? `[0:v]fps=1/${every}:round=up,${cropF}scale=${width}:-2[f]`
    : `[0:v]fps=1/${every}:round=up,${cropF}split[a][b];[a]scale=${width}:-2[f];[b]scale=480:-2,${tag},tile=${sheet}[s]`;
run('ffmpeg', ['-v', 'error', '-y', ...range, '-filter_complex', graph,
    '-map', '[f]', '-q:v', '3', '-fps_mode', 'passthrough', '-frame_pts', '1', join(out, 'raw-%d.jpg'),
    ...(sheet === '0' ? [] : ['-map', '[s]', '-q:v', '3', '-fps_mode', 'passthrough', join(out, 'sheet-%03d.jpg')])]);

// -frame_pts names each frame by its pts, which after fps=1/every counts in units of `every` seconds.
const frames = readdirSync(out).filter(f => /^raw-\d+\.jpg$/.test(f));
for (const f of frames) renameSync(join(out, f), join(out, `f-${hms(Number(f.slice(4, -4)) * every).replaceAll(':', '-')}.jpg`));
const sheets = readdirSync(out).filter(f => f.startsWith('sheet-')).length;
console.log(`${frames.length} frames, ${sheets} sheets in ${out}`);

function readHelp() {
    const lines = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n');
    return lines.slice(0, lines.findIndex(l => l.startsWith('import'))).map(l => l.replace(/^\/\/ ?/, '')).join('\n');
}
