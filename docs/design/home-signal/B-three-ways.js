// Option B · "Three ways in". The home becomes three side-by-side modules,
// each under a band in its key colour; phones get a chooser row on top.
// Prototype only: rearranges the live home DOM for B-three-ways.css.
(() => {
    const home = document.getElementById('setup-modal');
    home.classList.add('hs-b');
    const lower = home.querySelector('.home-lower');
    const [table, recent] = lower.querySelectorAll(':scope > .home-box');
    const well = document.getElementById('well');
    const readout = document.getElementById('readout');

    const band = (cls, icon, title, sub, extra = '') => {
        const b = document.createElement('header');
        b.className = `hs-band ${cls}`;
        b.innerHTML = `<div class="hs-band-top"><span class="hs-band-label"><i class="fa-solid ${icon}"></i>${title}</span>${extra}</div><p>${sub}</p>`;
        return b;
    };
    const body = (box) => {
        const d = document.createElement('div');
        d.className = 'hs-body';
        [...box.children].forEach(c => { if (c.tagName !== 'H3') d.append(c); });
        box.append(d);
        return d;
    };

    // 1 · Paste: the well becomes its own module, glass all through.
    const paste = document.createElement('section');
    paste.className = 'home-box hs-paste';
    paste.id = 'hs-paste';
    paste.append(band('is-glass', 'fa-paste', 'Paste a game', 'A decklist, a Duels.ink log or replay, or a saved session. The Dojo works out which.'));
    const pb = document.createElement('div');
    pb.className = 'hs-body';
    pb.append(well, readout);
    paste.append(pb);
    lower.prepend(paste);

    // 2 · New match: Trace.
    table.id = 'hs-table';
    table.classList.add('hs-table');
    body(table);
    table.prepend(band('is-trace', 'fa-chess-board', 'New match', 'Seat two decks and play from turn 1.'));

    // 3 · Pick up again: Olive. "All sessions" moves into the band.
    recent.id = 'hs-recent';
    recent.classList.add('hs-recent');
    const all = recent.querySelector('h3 .link-btn');
    body(recent);
    const rb = band('is-olive', 'fa-clock-rotate-left', 'Pick up again', 'Every match saves itself on this device.');
    rb.querySelector('.hs-band-top').append(all);
    recent.prepend(rb);

    // The lede asks the question the three modules answer.
    const lede = home.querySelector('.home-lede');
    lede.querySelector('h2').textContent = 'What do you want to practise?';
    const mark = document.createElement('span');
    mark.className = 'hs-torii';
    mark.setAttribute('aria-hidden', 'true');
    const hero = document.createElement('div');
    hero.className = 'hs-hero';
    lede.parentNode.insertBefore(hero, lede);
    hero.append(mark, lede);

    // Phones: three keys to jump straight to a way in.
    const jump = document.createElement('nav');
    jump.className = 'hs-jump';
    jump.setAttribute('aria-label', 'Ways in');
    jump.innerHTML = `
        <a class="hs-jk is-glass" href="#hs-paste"><i class="fa-solid fa-paste"></i><span>Paste</span></a>
        <a class="hs-jk is-trace" href="#hs-table"><i class="fa-solid fa-chess-board"></i><span>New match</span></a>
        <a class="hs-jk is-olive" href="#hs-recent"><i class="fa-solid fa-clock-rotate-left"></i><span>Resume</span></a>`;
    hero.after(jump);
    jump.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (t === paste) document.getElementById('intake').focus({ preventScroll: true });
    });
})();
