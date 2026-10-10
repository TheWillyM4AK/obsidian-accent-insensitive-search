# Obsidian Forum announcement draft

Status: **prepared, not posted**. Updated: 2026-10-10.

## Suggested placement

Create one announcement in [Share & showcase → Plugins](https://forum.obsidian.md/c/share-showcase/plugins/22). Suggested tags, if available: `plugin-release`, `quick-switcher`, `internal-links`.

Then add the short, contextual reply below to [Ignore Accents/Diacritics on Quick Switcher and Internal Links](https://forum.obsidian.md/t/ignore-accents-diacritics-on-quick-switcher-and-internal-links/83304), where TheWillyM4AK shared the alias workaround on June 27, 2024. Once the announcement exists, the reply can also link to it.

The [broader request from 2020](https://forum.obsidian.md/t/ignore-accents-diacritics-in-link-suggestion-quick-switcher-find-in-file-and-global-search/1655) is relevant background, but also covers global content search, which this plugin does not change. Avoid duplicating the announcement across threads.

## New topic

### Accent Insensitive Search: ignore accents in Quick Switcher and [[ links

For years, typing accents to find my notes in Obsidian was a nuisance. After seeing several forum threads about the same problem, I finally created **Accent Insensitive Search** with the help of AI.

It adds **accent-insensitive (diacritic-insensitive) search** to note names and aliases in the native **Quick Switcher (Ctrl+O / Cmd+O)** and **internal link suggestions (`[[` / wikilink autocomplete)**:

- `alvaro gomez` finds **Álvaro Gómez**
- `pinguino` finds **Pingüino**

Suggestions and inserted links keep their original spelling, without adding unaccented aliases manually.

**`ñ` stays distinct from `n`:** it is a separate Spanish letter with its own key on Spanish keyboards, so it requires no extra keystroke to add an accent.

Global content search is unchanged. Tested on desktop and mobile.

[Install from the community directory](https://community.obsidian.md/plugins/busqueda-sin-tildes) · [GitHub and English/Spanish instructions](https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search)

Sharing this for anyone still looking for a solution. Feedback from Spanish speakers and users of other languages is welcome!

## Reply to the existing thread

Back in 2024, I mentioned adding unaccented aliases as a workaround here. I finally created **Accent Insensitive Search** with AI assistance to solve this directly in the native Quick Switcher and `[[` suggestions: `alvaro gomez` finds **Álvaro Gómez**, without adding aliases manually.

It ignores accents and diaereses, preserves original spelling, and keeps Spanish `ñ` distinct from `n`. Global content search is unchanged.

[Plugin and installation](https://community.obsidian.md/plugins/busqueda-sin-tildes)
