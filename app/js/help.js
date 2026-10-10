// Help (Feature 57, M1): the in-app manual. Drawer on desktop, full-screen sheet on phones.
// docs/ARCH-help-and-tour.md §6. Reads app/help/manual.json (built by tools/help.mjs).
//
// Contract:
//   DojoHelp.load() -> Promise<manual>   (fetched once, cached; tours and spotlight may use it)
//   DojoHelp.open(articleId?, slug?)     (no id: the contents)
//   DojoHelp.close(), DojoHelp.toggle(), DojoHelp.isOpen()
//   DojoHelp.device() -> 'desktop'|'phone'   (the layout in use, max-width 760px = phone)
// Loaded as a classic script in <head>: no DOM work until the page has loaded or help is used.
window.DojoHelp = (function () {
    'use strict';
    // Built in M1.
    return {};
})();
