// The real home screen (app/index.html, v3.2.4) as rendered with the sample
// library, used as the backdrop behind each proposal's Library drawer.
// Slots: hd (header controls), recentTitle and recent (Pick up again).
function homeHtml({ hd, recentTitle, recent }) {
    return `<div id="setup-modal" class="home-page" inert role="dialog" aria-modal="true" aria-labelledby="home-title">
        <div class="home-wrap">
            <!-- The brand column: the mark, the name and version, the tagline -->
            <div class="home-brand">
                <span class="brand-mark home-logo" aria-hidden="true"></span>
                <div class="home-id">
                    <h1 id="home-title">Practice Dojo</h1>
                    <span class="home-ver" id="app-version-setup">v3.2.4</span>
                </div>
                <p class="home-tagline">A Lorcana Sandbox. <span class="mute">Come in, play, rewind.</span></p>
            </div>

            <header class="home-hd">${hd}</header>

            <section class="home-lede">
                <h2>Paste a decklist <span class="mute">or a Duels.ink game.</span></h2>
                <p>Or drop a saved session anywhere on this page. The Dojo works out what it is.</p>
            </section>

            <div class="well is-idle" id="well">
                <div class="well-in">
                    <textarea id="intake" spellcheck="false" aria-describedby="readout" aria-label="Paste a decklist, a Duels.ink log or replay, or a saved session" placeholder="4 Tinker Bell - Giant Fairy
4 Maui - Hero to All
…

or a whole Duels.ink log, starting “Player 1's starting hand: …”" style=""></textarea>
                    <div class="well-ft">
                        <span class="hint">Nothing to paste? Try an example:</span>
                        <button class="btn btn-ghost" id="btn-example-deck"><i class="fa-solid fa-layer-group"></i> A decklist</button>
                        <button class="btn btn-ghost"><i class="fa-solid fa-film"></i> A Duels.ink log</button>
                        <input type="file" id="intake-file" class="hidden" accept=".json,.gz,.txt,.md,.log,.replay,application/json,application/gzip,text/plain" style="">
                        <button class="btn"><i class="fa-solid fa-file-arrow-up"></i> Choose a file</button>
                    </div>
                </div>
            </div>

            <section class="readout" id="readout" aria-live="polite" hidden=""></section>

            <div class="home-lower">
                <section class="home-box" aria-labelledby="home-table-title">
                    <h3 id="home-table-title">On the table</h3>
                    <div class="seats" id="home-seats"><div class="seat is-empty"><span class="seat-who">You</span><span class="deck-box is-empty"></span><span class="seat-name">Random cards</span></div><div class="seat is-empty"><span class="seat-who">Opponent</span><span class="deck-box is-empty"></span><span class="seat-name">Random cards</span></div></div>
                    <div class="chips-label">Or pick a deck. It goes to the first open seat.</div>
                    <div class="chips" id="home-chips"><button class="chip" data-key="my:d-2" title=""><span class="cc-pips"><span class="cc-pip" style="--pip:#D64545"></span><span class="cc-pip" style="--pip:#8E8C88"></span></span> Locals Steel brew</button><button class="chip" data-key="my:d-1" title=""><span class="cc-pips"><span class="cc-pip" style="--pip:#D64545"></span><span class="cc-pip" style="--pip:#8E8C88"></span></span> My Amber/Ruby list</button><button class="chip" data-key="def:s13-princess-aggro" title="Amber/Emerald Princess Aggro deck"><span class="cc-pips"><span class="cc-pip" style="--pip:#E0A23A"></span><span class="cc-pip" style="--pip:#1F9D6A"></span></span> S13 - GY - Princess Aggro</button><button class="chip" data-key="def:s13-purple-yellow-control" title="Amethyst/Amber Control deck"><span class="cc-pips"><span class="cc-pip" style="--pip:#E0A23A"></span><span class="cc-pip" style="--pip:#7A5CFF"></span></span> S13 - PY - Control</button><button class="chip" data-key="def:s13-evasive-tempo" title="Amber/Ruby Evasive Tempo deck"><span class="cc-pips"><span class="cc-pip" style="--pip:#7A5CFF"></span><span class="cc-pip" style="--pip:#D64545"></span></span> S13 - AR - Evasive Tempo</button><button class="chip" data-key="def:s12-amethyst-ruby" title="The list from the sample Duels.ink replay in docs/samples"><span class="cc-pips"><span class="cc-pip" style="--pip:#7A5CFF"></span><span class="cc-pip" style="--pip:#D64545"></span></span> S12 - AR - Control</button></div>
                    <div class="start-row">
                        <button class="btn btn-primary start-btn" id="btn-start-match">
                            Start match <i class="fa-solid fa-arrow-right"></i>
                        </button>
                        <span class="start-hint">An empty seat plays 60 random cards.</span>
                    </div>
                </section>
                <section class="home-box" aria-labelledby="home-recent-title">
                    <h3 id="home-recent-title">${recentTitle}</h3>
                    <div id="home-recent">${recent}</div>
                </section>
            </div>
        </div>
    </div>`;
}
