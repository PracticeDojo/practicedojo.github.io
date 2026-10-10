// Spotlight (Feature 57, M4): "Show me" and the tours' pointer. Dims the page except one
// control, rings it and shows a callout. docs/ARCH-help-and-tour.md §7.
//
// Contract:
//   DojoSpotlight.setTargets(targets)   // manual.targets; if never called, show() fetches help/manual.json
//   DojoSpotlight.resolve(name) -> Element|null   // the target's element on this device, if visible
//   DojoSpotlight.show(nameOrElement, {
//       title, text,                    // text is short Markdown-free HTML-escaped prose
//       step,                           // e.g. '2 / 8', shown in mono
//       buttons: [{ label, primary, onClick }],
//       passThrough,                    // let clicks reach the target (tour steps that wait for an action)
//       onClose
//   }) -> Promise<boolean>              // false if the target isn't on screen (callout centred instead)
//   DojoSpotlight.hide(), DojoSpotlight.isOpen()
// Handles its own Escape (capture phase) so the app's Escape chain never sees it while open.
window.DojoSpotlight = (function () {
    'use strict';
    // Built in M4.
    return {};
})();
