# Spanish Accent Search

[Español](README.es.md) · English

Find **Álvaro Gómez** by typing `alvaro gomez` in Obsidian's native **Quick switcher (Ctrl+O / Cmd+O)** or **`[[` link suggestions**. Keep the correct spelling in your notes and links.

For years, having to type accents just to find my notes was an annoying part of using Obsidian. I had seen several forum threads from people with the same problem, so I finally decided to create this plugin with the help of AI to solve it and share it with the community.

Designed with Spanish in mind: vowel accents and the diaeresis do not get in the way, while **`ñ` stays a separate letter from `n`**. It can also help with other languages that use combining diacritics; it is not a general transliteration tool.

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

**Community catalog status: not yet listed.** Until the plugin is accepted into Obsidian's catalog, use BRAT or a manual installation.

### BRAT

1. Install and enable [BRAT](https://github.com/TfTHacker/obsidian42-brat) from Obsidian's community plugins.
2. Add this repository in BRAT: `https://github.com/TheWillyM4AK/obsidian-busqueda-sin-tildes`.
3. Enable **Spanish Accent Search** in **Settings → Community plugins**, if it is not enabled already.

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/TheWillyM4AK/obsidian-busqueda-sin-tildes/releases/latest).
2. Create `.obsidian/plugins/busqueda-sin-tildes/` inside your vault and place both files there.
3. Restart Obsidian and enable **Spanish Accent Search** in **Settings → Community plugins**.

Use Quick switcher and `[[` as usual. Disable the plugin to restore native search behavior.

## Compatibility

- Minimum supported version: **Obsidian 1.14.4**.
- Verified on desktop with Obsidian 1.14.4, including native methods exercised with in-memory files and an editor stub.
- Designed for desktop and mobile without platform-specific dependencies. **Practical mobile verification is pending.**

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

[Open an issue](https://github.com/TheWillyM4AK/obsidian-busqueda-sin-tildes/issues) in English or Spanish. Include your Obsidian and plugin versions, platform, and a minimal example with fictional note names. Suggestions and reproducible reports from other languages are welcome.

## License

[MIT](LICENSE) · TheWillyM4AK. Built with the [Obsidian API](https://github.com/obsidianmd/obsidian-api).
