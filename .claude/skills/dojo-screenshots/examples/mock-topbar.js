// Inject example: a throwaway mock-up drawn into the live app (nothing in the
// repo changes). shoot.mjs adds this file with --inject; the steps file then
// calls window.__mock(...) and takes a shot per variant.
window.__mock = (variant) => {
    const right = document.querySelector('.topbar-right');
    if (!right) return;
    let tag = document.getElementById('mk-tag');
    if (!tag) {
        tag = document.createElement('span');
        tag.id = 'mk-tag';
        tag.style.cssText = 'font:600 11px var(--font-mono);padding:4px 8px;border-radius:6px;background:var(--accent);color:#FFF8F4';
        right.prepend(tag);
    }
    tag.textContent = `Variant ${variant}`;
};
