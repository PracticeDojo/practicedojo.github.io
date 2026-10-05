// Option A · "Keyed". Same layout as today; each choice gets its key colour.
// Prototype only: tags the live home DOM so A-keyed.css can style it.
(() => {
    const home = document.getElementById('setup-modal');
    home.classList.add('hs-a');
    const [table, recent] = home.querySelectorAll('.home-lower > .home-box');
    table.classList.add('hs-table');
    recent.classList.add('hs-recent');

    // Section labels become keys: Trace for a new match, Olive for saved work.
    const keyLabel = (h3, cls, text, icon) => {
        const first = h3.firstChild;
        if (first && first.nodeType === 3) first.remove();
        const k = document.createElement('span');
        k.className = `hs-key ${cls}`;
        k.innerHTML = `<i class="fa-solid ${icon}"></i>${text}`;
        h3.prepend(k);
    };
    keyLabel(table.querySelector('h3'), 'is-trace', 'New match', 'fa-chess-board');
    keyLabel(recent.querySelector('h3'), 'is-olive', 'Pick up again', 'fa-clock-rotate-left');

    // The well gets its own key too: glass, like the well itself.
    const lede = home.querySelector('.home-lede');
    const glassKey = document.createElement('span');
    glassKey.className = 'hs-key is-glass';
    glassKey.innerHTML = '<i class="fa-solid fa-paste"></i>Bring a game in';
    lede.prepend(glassKey);

    // Desktop: the torii mark stands beside the headline.
    const mark = document.createElement('span');
    mark.className = 'hs-torii';
    mark.setAttribute('aria-hidden', 'true');
    lede.parentNode.insertBefore(mark, lede);
    const row = document.createElement('div');
    row.className = 'hs-lede-row';
    lede.parentNode.insertBefore(row, mark);
    row.append(mark, lede);
})();
