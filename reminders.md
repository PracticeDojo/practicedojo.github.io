# Notes to self

## Editing manual 
The app reads `app/help/manual.json`, not the Markdown files directly. Your four Multiverse article changes weren’t showing yet because that file hadn’t been rebuilt. 

When you edit articles or tours yourself, run `node tools/help.mjs` and commit manual.json with them; `node tools/help.mjs --check` tells you if it’s out of date.