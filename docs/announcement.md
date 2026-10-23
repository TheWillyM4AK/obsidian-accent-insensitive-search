# Obsidian Forum announcement

Status: **published**. Published: 2026-10-10. [Announcement](https://forum.obsidian.md/t/accent-insensitive-search-ignore-accents-in-quick-switcher-and-links/119290) · [Reply](https://forum.obsidian.md/t/ignore-accents-diacritics-on-quick-switcher-and-internal-links/83304/5).

On 2026-10-22, moderators merged the 2024 thread, including the reply, into the [2020 request](https://forum.obsidian.md/t/ignore-accents-diacritics-in-link-suggestion-quick-switcher-find-in-file-and-global-search/1655) and closed it after confirming native support in Obsidian 1.15. See [Follow-up: native support in Obsidian 1.15](#follow-up-native-support-in-obsidian-115).

## Placement

The announcement was published in [Share & showcase → Plugins](https://forum.obsidian.md/c/share-showcase/plugins/22).

The short, contextual reply below was published in [Ignore Accents/Diacritics on Quick Switcher and Internal Links](https://forum.obsidian.md/t/ignore-accents-diacritics-on-quick-switcher-and-internal-links/83304/5), where TheWillyM4AK shared the alias workaround on June 27, 2024. It links to the announcement as required by the category rules.

The [broader request from 2020](https://forum.obsidian.md/t/ignore-accents-diacritics-in-link-suggestion-quick-switcher-find-in-file-and-global-search/1655) is relevant background, but also covers global content search, which this plugin does not change. Avoid duplicating the announcement across threads.

## New topic

### Accent Insensitive Search: ignore accents in Quick Switcher and [[ links

> ## Disclaimer
> Is this plugin **open source**? Yes
> Is this plugin completely **free**? Yes
> Is this plugin **vibe-coded** beyond the author's ability to comprehend how it works? Yes
> Community Directory: [Accent Insensitive Search](https://community.obsidian.md/plugins/busqueda-sin-tildes)

---

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

[More details in the announcement](https://forum.obsidian.md/t/accent-insensitive-search-ignore-accents-in-quick-switcher-and-links/119290)

## Follow-up: native support in Obsidian 1.15

Status: **draft**. Publish after release 0.2.0 is available.

The 2020 request is closed, so the announcement topic is the only place to update. Edit its first post with the note below and reply once.

### Note at the top of the announcement

> **Update, October 2026:** Obsidian 1.15.0 now ignores accents natively in link suggestions, Quick Switcher, Command palette, and Bases search ([release notes](https://obsidian.md/changelog/2026-10-22-desktop-v1.15.0/)). It is in early access for now. If you're on 1.15 or later, you can uninstall this plugin. Version 0.2.0 stays inactive there. It remains useful on 1.14.x until 1.15 reaches the public release.

### Reply in the announcement topic

Quick follow-up for anyone landing here: version **0.2.0** detects Obsidian 1.15 or later, stays inactive, and shows a one-time notice suggesting you uninstall it. On 1.14.x it keeps working until 1.15 reaches the public release. After that, I'll retire it.

One small difference: native search also treats `ñ` as `n`, so `ano` finds `Año`.

Thanks to the Obsidian team for building this in, and to everyone who tried the plugin!
