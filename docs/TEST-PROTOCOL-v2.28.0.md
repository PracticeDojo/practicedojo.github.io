# TEST PROTOCOL — Practice Dojo v2.28.0

Scope: **Feature 47 · Kiln night theme and the signal family.** Use the Set 13 demo at 1600×1000 and a
390×844 phone. Run v2.27.0's protocol once in Night for a full sweep.

## A — Theme
| # | Step | Expected |
|---|------|----------|
| A.1 | Fresh browser, device in light mode, load the app | Day (Mineral) shell. Tweaks → Theme shows **Auto** |
| A.2 | Switch the device to dark mode with the app open | The app turns Kiln without a reload |
| A.3 | Tweaks → Theme → **Night**, reload | Kiln from the first frame (no light flash), including the loading screen |
| A.4 | Tweaks → Theme → **Day** with the device in dark mode | Day shell; stays Day after reload |
| A.5 | Kiln board | Chassis warm black, paper modules warm dark, the well blacker than the chassis with a hairline edge; lore numerals, turn number, End turn in Radio orange with dark text on the key |
| A.6 | Kiln: multiverse, timelines, Tweaks, modals, Library, home, text-card mode | Dark paper everywhere; no light panels left behind; text readable |
| A.7 | Kiln + Mono palette | End turn becomes a light grey key with dark text; lore numerals light; P1 / P2 ticks still distinct |

## B — Signal family
| # | Step | Expected |
|---|------|----------|
| B.1 | Tweaks → Accent | Four swatches: Signal (split Ember / Radio), Coral, Olive, Trace |
| B.2 | Coral, Olive, Trace in Day and in Night | End turn, lore, turn number, auto-save switch and the live tree path change together; text on the key stays readable (dark on Olive / Trace) |
| B.3 | Olive | Lore numerals on the well are the lifted yellow-olive, not the darker key colour |
| B.4 | Back to Signal | Ember by day, Radio at night |
| B.5 | A browser that had Rose / Emerald / Violet / Azure / Amber saved | Opens on Signal |
