// Option C · "Front panel". The home is a device: a nameplate with the
// torii, and three full-colour slabs, one per way in.
// Prototype only: rearranges the live home DOM for C-front-panel.css.
(() => {
    const home = document.getElementById('setup-modal');
    home.classList.add('hs-c');
    const wrap = home.querySelector('.home-wrap');
    const hd = home.querySelector('.home-hd');
    const lower = home.querySelector('.home-lower');
    const [table, recent] = lower.querySelectorAll(':scope > .home-box');
    const well = document.getElementById('well');
    const readout = document.getElementById('readout');

    // The header doubles as the nameplate on desktop: mark, name, question.
    const q = document.createElement('p');
    q.className = 'hs-question';
    q.textContent = 'What do you want to practise?';
    hd.querySelector('.home-ver').after(q);

    const head = (title, sub, extra = '') => {
        const h = document.createElement('header');
        h.className = 'hs-slab-hd';
        h.innerHTML = `<div class="hs-slab-top"><h3 class="hs-slab-title">${title}</h3>${extra}</div><p>${sub}</p>`;
        return h;
    };

    // Glass slab: paste a game.
    const paste = document.createElement('section');
    paste.className = 'home-box hs-slab is-glass';
    paste.append(head('Paste a game.', 'A decklist, a Duels.ink log or replay, or a saved session.'), well, readout);
    lower.prepend(paste);

    // Trace slab: set the table. The seats are display windows, decks are keys.
    table.classList.add('hs-slab', 'is-trace');
    table.querySelector('h3').replaceWith(head('Set the table.', 'Seat two decks and play from turn 1.'));

    // Olive slab: pick up again.
    recent.classList.add('hs-slab', 'is-olive');
    const all = recent.querySelector('h3 .link-btn');
    const rh = head('Pick up again.', 'Every match saves itself on this device.');
    rh.querySelector('.hs-slab-top').append(all);
    recent.querySelector('h3').replaceWith(rh);

    const main = document.createElement('div');
    main.className = 'hs-main';
    wrap.append(main);
    main.append(home.querySelector('.home-lede'), lower);
})();
