// Help search (Feature 57, M2): fuzzy search over the manual's sections.
// docs/ARCH-help-and-tour.md §6.3. Pure: no DOM, so tools/help.mjs --test runs it in Node.
//
// Contract (M1's viewer calls these):
//   DojoHelpSearch.build(manual, { Fuse }) -> index
//       manual: app/help/manual.json. Fuse defaults to the global one (fuse.js 6.6.2).
//   DojoHelpSearch.query(index, q, { device: 'desktop'|'phone', limit: 12 }) -> [{
//       id,            // 'inkwell#ready-all' ('inkwell#' for an article's lead)
//       article, anchor, title, heading, section,   // anchor '' = the article's lead
//       otherDevice,   // true when the record is only for the other device (tag it, don't hide it)
//       score,         // lower is better, after the ranking tweaks
//       snippet: { text, ranges: [[start, end], …] }  // one line around the match; ranges to mark
//   }]
//   DojoHelpSearch.suggest(index, q, { limit: 3 }) -> [articleId]   // looser pass for "no results"
window.DojoHelpSearch = (function () {
    'use strict';
    // Built in M2.
    return {};
})();
