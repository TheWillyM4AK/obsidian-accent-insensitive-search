# Accent Insensitive Search

[Español](README.es.md) · English

> [!IMPORTANT]
> **Obsidian 1.15 does this natively.** Since Obsidian 1.15.0 (early access since October 22, 2026), link suggestions, Quick switcher, Command palette, and Bases search ignore accents without any plugin ([release notes](https://obsidian.md/changelog/2026-10-22-desktop-v1.15.0/)). If you use 1.15 or later, you can uninstall this plugin: from version 0.2.0 it stays inactive on those versions and shows a one-time notice. Until 1.15 reaches the public release, the plugin remains useful on Obsidian 1.14.x; after that, it will be retired.
>
> One difference: native search also treats `ñ` as `n`, so `ano` finds `Año`.

Search without typing accents or diaereses in Obsidian's native **Quick switcher (Ctrl+O / Cmd+O)** and **`[[` link suggestions**. These extra keystrokes do not affect matches: `alvaro gomez` finds **Álvaro Gómez**, and `pinguino` finds **Pingüino**. Your notes and links keep their original spelling.

For years, having to type accents just to find my notes was an annoying part of using Obsidian. I had seen several forum threads from people with the same problem, so I finally decided to create this plugin with the help of AI to solve it and share it with the community.

**Why are `n` and `ñ` different?** In Spanish, `ñ` is a letter in its own right and has its own key on the Spanish keyboard. Typing it does not require an extra keystroke to add an accent mark, so the plugin preserves it as a distinct letter: `ano` does not find `año`.

The plugin was created for writing in Spanish and can also help with other languages that use combining diacritics. It is not a general transliteration tool.

| Type | Find |
| --- | --- |
| `alvaro gomez` | `Álvaro Gómez` |
| `ÁLVARO` | `Álvaro` or `Alvaro` |
| `pinguino` | `Pingüino` |
| `cafe` | `Café` |
| `ano` | Does **not** match `Año` |

Select the first example after typing `[[alvaro gomez` and Obsidian inserts `[[Álvaro Gómez]]` using the note's original name.

## Features

- Works in the existing Quick switcher and wikilink suggestions, without replacing either interface or changing your shortcuts.
- Matches names, paths, and existing aliases; preserves the original spelling and Obsidian's usual alias insertion behavior.
- Respects native attachment options and the ranking penalty for excluded files. Preserves native handling of empty queries, bookmarks, unresolved links, headings, blocks, and display text after `|`.
- No settings, network requests, or changes to notes, filenames, frontmatter, or aliases. Comparison happens in memory using filenames, paths, and existing metadata.

This plugin extends file and alias matching in those two interfaces. It does not add accent-insensitive matching to global Search, third-party search plugins, heading or block text, or unresolved link names.

## Installation

### Community catalog

1. Open the [official plugin listing](https://community.obsidian.md/plugins/busqueda-sin-tildes) and select **Add to Obsidian**.
2. Follow Obsidian's installation prompts, then enable **Accent Insensitive Search** in **Settings → Community plugins**.

BRAT and manual installation are also available below.

### BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Obsidian's community plugins.
2. Add this repository in BRAT: `https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search`.
3. Enable **Accent Insensitive Search** in **Settings → Community plugins**, if it is not enabled already.

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search/releases/latest).
2. Create `.obsidian/plugins/busqueda-sin-tildes/` inside your vault and place both files there.
3. Restart Obsidian and enable **Accent Insensitive Search** in **Settings → Community plugins**.

Use Quick switcher and `[[` as usual. Disable the plugin to restore native search behavior.

## Compatibility

- Minimum supported version: **Obsidian 1.14.4**.
- Verified on desktop with Obsidian 1.14.4, including native methods exercised with in-memory files and an editor stub.
- Designed for desktop and mobile without platform-specific dependencies. **The plugin's creator has tested it successfully on mobile.**
- On Obsidian 1.15 or later, which includes this feature, the plugin does not change any search. It shows a one-time notice and remembers it in its own `data.json`.

The integration wraps internal Obsidian methods because the public API does not expose a hook for these native searches. An Obsidian update or another plugin changing the same methods may require a compatibility update. If an interface is missing or its result format is incompatible, the affected component falls back to native behavior and shows a one-time notice in Spanish when Obsidian's language is Spanish, or in English otherwise. Deactivation restores the wrapped methods where possible and makes remaining wrappers inactive.

## Development

Requires **Node.js 24 or later**.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

The build produces `main.js`; Obsidian supplies the runtime API. Unit tests cover Unicode normalization, highlight offsets, matching, native filters, ranking, cancellation, and reversible patches. The native integration fixture additionally checks result compatibility and inserting a correctly accented link without creating notes.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the native integration procedure and contribution guidance, and [CHANGELOG.md](CHANGELOG.md) for release history.

## Feedback

[Open an issue](https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search/issues) in English or Spanish. Include your Obsidian and plugin versions, platform, and a minimal example with fictional note names. Suggestions and reproducible reports from other languages are welcome.

## License

[MIT](LICENSE) · TheWillyM4AK. Built with the [Obsidian API](https://github.com/obsidianmd/obsidian-api).
