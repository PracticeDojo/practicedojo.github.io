import { GitBranch } from 'lucide-react'
// Direct imports, not the kit's index: the host bundle carries only these parts
import { Stage } from '../../kit/stage'
import { Bar } from '../../kit/window'
import { Count } from '../../kit/motion/Count'
import { Follow } from '../../kit/motion/Follow'
import { Roll } from '../../kit/motion/Roll'
import { inset } from '../../kit/measure'
import type { Act } from '../../kit/act'
import './dojo.css'

// Practice Dojo's hero: rewind a lost match to turn 8, write the plan, and
// the what-if line plays out to a win. Figures are the Set 14 demo's own:
// the line played ends 3-21, the branch from turn 8 ends 27-18.
//
// Beats: the played line is selected at its Game over; the cursor clicks
// turn 8 (rewind, lore rolls back); a note is typed on that turn; a branch
// grows a turn at a time while the lore climbs; it lands on its own Game
// over. Reset: clicking the played ending again takes the selection back and
// the branch leaves as one thing.
//
// Real strings: the panel title, the turn rewound to, its note, the two
// endings, the lore. The older line under them is placeholder.

type At = 'd1' | 'b' | 'd2'
type S = { at: At; lore: [number, number]; note: string; typing: boolean; fade: boolean; pushed: boolean; grow: number }

const NOTE = "don't give him any lore"
// Lore on the branch, a few turns apart, ending on the demo's real result
const CLIMB: [number, number][] = [[0, 16], [6, 17], [13, 18], [20, 18], [27, 18]]
const initial: S = { at: 'd1', lore: [3, 21], note: '', typing: false, fade: false, pushed: false, grow: 0 }
const POSTER: S = { at: 'd2', lore: [27, 18], note: NOTE, typing: false, fade: false, pushed: true, grow: 5 }
const LABEL: Record<At, string> = { d1: 'The line played', b: 'Rewound to turn 8', d2: 'What if' }

// One geometry per layout, in stage pixels. Cards sit on two columns; the
// turns between them are dots on the edge, as the Dojo's mini multiverse
// draws them.
const GEO = {
  wide: { w: 660, b: { x: 32, y: 118, w: 196, h: 124 }, d: { x: 432, w: 196, h: 64 }, row1: 180, row2: 318, dots1: [262, 296, 330, 364, 398], dots2: [296, 330, 364, 398], f: { h: 96, rest: 312, pushed: 398 } },
  compact: { w: 358, b: { x: 16, y: 116, w: 164, h: 124 }, d: { x: 222, w: 120, h: 64 }, row1: 178, row2: 318, dots1: [194, 208], dots2: [208], f: { h: 96, rest: 328, pushed: 398 } },
}

async function script(a: Act<S>) {
  await a.wait(1000)
  a.mark('rewind')
  await a.click({ at: 'b', x: 0.88, y: 0.14 })
  a.put({ at: 'b', lore: [0, 16] })
  await a.wait(900)
  a.mark('note')
  await a.click({ at: 'note', x: 0.08, y: 0.5 })
  a.put({ typing: true })
  await a.type('note', NOTE)
  await a.wait(350)
  a.put({ typing: false })
  // The what-if line plays out: room opens, then a turn at a time
  a.mark('branch')
  a.move('rest')
  a.put({ pushed: true })
  await a.wait(300)
  for (let i = 1; i <= 4; i++) {
    a.put({ grow: i, lore: CLIMB[i - 1 + (i > 1 ? 0 : 0)] })
    await a.wait(480)
  }
  a.mark('win')
  a.put({ grow: 5, at: 'd2', lore: CLIMB[4] })
  await a.wait(2800)
  // Back to the line played: the branch leaves as one thing
  a.mark('reset')
  await a.click({ at: 'd1', x: 0.88, y: 0.3 })
  a.put({ at: 'd1', lore: [3, 21], grow: 0, pushed: false, fade: true })
  await a.wait(700)
  await a.snap({ note: '', fade: false })
  a.move('rest')
  await a.wait(500)
}

export default function DojoBranch() {
  return (
    <Stage<S> width={660} height={440} compact={{ below: 600, width: 358, height: 440 }} theme="dark" initial={initial} poster={POSTER} script={script} cursor={{ at: 'rest' }} className="dj">
      {(s, rect, layout) => {
        const g = GEO[layout]
        const { b, d } = g
        const bx = b.x + b.w
        const [c1, c2] = [g.row1, g.row2]
        const first = g.dots2[0]
        const sel = rect(s.at)
        const main = s.at === 'd1'
        // The straight run of the branch draws on a turn at a time
        const run = d.x - first
        const reach = s.grow >= 5 ? run : s.grow >= 1 ? g.dots2[Math.min(s.grow, g.dots2.length) - 1] - first : 0
        const fy = s.pushed ? g.f.pushed : g.f.rest
        return (
          <>
            <div className="dj-grid" />
            <header className="dj-head">
              <div>
                <div className="dj-title"><GitBranch size={14} strokeWidth={2.25} />Multiverse</div>
                <div className="dj-label"><Roll>{LABEL[s.at]}</Roll></div>
              </div>
              <div className="dj-lore">
                {(['P1', 'P2'] as const).map((p, i) => (
                  <div key={p} className="dj-lorebox">
                    <div className="dj-label">{p} lore</div>
                    <Count className="dj-num" value={s.lore[i]} duration={500} />
                  </div>
                ))}
              </div>
            </header>

            <svg className="dj-edges" width={g.w} height={440} aria-hidden>
              <path className="dj-edge" data-live d={`M0 ${c1}H${b.x}`} />
              <path className="dj-edge" data-live={main || undefined} d={`M${bx} ${c1}H${d.x}`} />
              <path className="dj-edge dj-edge--draw" data-live data-on={s.grow >= 1 || undefined} pathLength={1} d={`M${bx} ${c1}C${bx + (first - bx) * 0.6} ${c1} ${first - (first - bx) * 0.6} ${c2} ${first} ${c2}`} />
              <path className="dj-edge dj-edge--run" data-live d={`M${first} ${c2}H${d.x}`} style={{ strokeDasharray: run, strokeDashoffset: run - reach }} />
              {g.dots1.map((x) => <circle key={x} className="dj-dot" data-live={main || undefined} cx={x} cy={c1} r={3.5} />)}
              {g.dots2.map((x, i) => <circle key={x} className="dj-dot dj-dot--new" data-live data-on={s.grow > i || undefined} style={{ transitionDelay: s.grow === 0 ? `${(g.dots2.length - 1 - i) * 50}ms` : i === 0 ? '380ms' : '0ms' }} cx={x} cy={c2} r={3.5} />)}
            </svg>

            {/* An older what-if under the line played: it makes room for the new one */}
            <div className="dj-filler" style={{ transform: `translateY(${fy}px)` }}>
              <svg className="dj-edges" width={g.w} height={g.f.h} aria-hidden>
                <path className="dj-edge" d={`M0 ${g.f.h / 2}H${g.w}`} />
              </svg>
              {[b, d].map((c, i) => (
                <div key={i} className="dj-node dj-node--filler" style={{ left: c.x, width: c.w, height: g.f.h }}>
                  <Bar w={[92, 64][i]} h={8} r={4} tone={3} />
                  <Bar w={[60, 48][i]} h={6} r={3} tone={2} />
                  <Bar w={[124, 84][i]} h={6} r={3} tone={1} />
                  <Bar w={[98, 70][i]} h={6} r={3} tone={1} />
                </div>
              ))}
            </div>

            <div className="dj-node" data-target="b" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
              <div className="dj-node__title">Turn 8 · Player 1</div>
              <div className="dj-node__stats">P1 0 · P2 16</div>
              <div className="dj-note" data-target="note" data-cursor="ibeam" data-fade={s.fade || undefined}>
                <div className="dj-label">Note</div>
                <span>{s.note}</span>
                <i className="dj-caret" data-on={s.typing || undefined} />
              </div>
            </div>

            <div className="dj-node" data-target="d1" data-kept={!main || undefined} style={{ left: d.x, top: c1 - d.h / 2, width: d.w, height: d.h }}>
              <div className="dj-node__title">Game over</div>
              <div className="dj-node__sub">Player 2 wins</div>
            </div>

            <div className="dj-node dj-node--new" data-target="d2" data-on={s.grow >= 5 || undefined} style={{ left: d.x, top: c2 - d.h / 2, width: d.w, height: d.h }}>
              <div className="dj-node__title">Game over</div>
              <div className="dj-node__sub dj-win">Player 1 wins</div>
            </div>

            <Follow className="dj-sel" to={sel.width > 0 ? inset(sel, -6) : null}>
              <i /><i /><i /><i />
            </Follow>
            <span data-target="rest" style={{ position: 'absolute', left: layout === 'compact' ? 120 : 330, top: layout === 'compact' ? 286 : 258 }} />
          </>
        )
      }}
    </Stage>
  )
}
