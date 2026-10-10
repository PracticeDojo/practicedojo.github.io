// Guided tours (Feature 58, M5): opt-in, on a practice board that is never saved.
// docs/ARCH-help-and-tour.md §8.
//
// Contract:
//   DojoTour.list() -> Promise<[{ id, title, minutes, done }]>
//   DojoTour.start(id), DojoTour.stop(), DojoTour.isRunning()
//   DojoTour.onRender()   // called at the end of App.render()
//   DojoTour.onKey(e)     // called first in the app's keydown; true = handled
window.DojoTour = (function () {
    'use strict';
    // Built in M5.
    return {};
})();
