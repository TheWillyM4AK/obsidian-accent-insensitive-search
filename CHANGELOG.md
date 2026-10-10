# Changelog / Historial de cambios

## 0.1.2 — 2026-10-10

### English

- Renamed the plugin to **Accent Insensitive Search** and the repository to `obsidian-accent-insensitive-search` to describe the functionality directly.
- Clarified why `n` and `ñ` remain distinct: `ñ` is a separate Spanish letter with its own key on Spanish keyboards, without an extra keystroke to add an accent.
- Updated bilingual instructions and the forum draft. Search behavior is unchanged.

### Español

- Nuevo nombre **Accent Insensitive Search** y repositorio `obsidian-accent-insensitive-search`, para describir la función directamente.
- Aclarado por qué se distinguen `n` y `ñ`: la `ñ` es una letra propia con su propia tecla en el teclado español, sin una pulsación adicional para añadir un acento.
- Actualizadas las instrucciones bilingües y el borrador del foro. El comportamiento de búsqueda no cambia.

## 0.1.1 — 2026-10-10

### English

First public release as **Spanish Accent Search**.

- Accent-insensitive matching in native Quick switcher and `[[` file suggestions, with original names and links preserved.
- Spanish-aware normalization: vowel accents and diaeresis are ignored; `ñ` remains distinct from `n`, including decomposed Unicode.
- Existing aliases, native attachment options, excluded-file ranking, and highlight positions are preserved.
- Reversible internal-method wrappers with native fallback for incompatible interfaces.
- English and Spanish documentation, MIT license, and contribution instructions.
- Compatibility notices follow Obsidian's language: Spanish for Spanish locales, English otherwise.
- Automated lint, type checking, tests, and build checks with Node.js 24.
- Desktop compatibility verified with Obsidian 1.14.4. Practical mobile verification pending.

### Español

Primera versión pública con el nombre **Spanish Accent Search — Búsqueda sin tildes**.

- Búsqueda sin tildes en el selector rápido nativo y las sugerencias de archivos `[[`, conservando los nombres y enlaces originales.
- Normalización pensada para el español: ignora tildes de vocales y diéresis; mantiene `ñ` distinta de `n`, también con Unicode descompuesto.
- Conserva los aliases existentes, las opciones nativas de adjuntos, la penalización de archivos excluidos y las posiciones de resaltado.
- Parches reversibles de métodos internos, con comportamiento nativo de respaldo ante interfaces incompatibles.
- Documentación en inglés y español, licencia MIT e instrucciones de colaboración.
- Avisos de compatibilidad según el idioma de Obsidian: español para sus variantes e inglés para los demás idiomas.
- Comprobaciones automáticas de lint, tipos, pruebas y compilación con Node.js 24.
- Compatibilidad verificada en escritorio con Obsidian 1.14.4. Verificación práctica en móvil pendiente.

## 0.1.0 — 2026-10-10

- Initial private prototype, named **Búsqueda sin tildes**, with unit and in-memory native integration tests.
- Prototipo privado inicial, llamado **Búsqueda sin tildes**, con pruebas unitarias y de integración nativa en memoria.
