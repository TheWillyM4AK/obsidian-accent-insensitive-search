# Contributing / Cómo colaborar

## English

Issues and pull requests in English or Spanish are welcome. Start a discussion in an issue before proposing a larger feature or changing normalization rules. Preserving the Spanish distinction between `n` and `ñ` is intentional.

### Report a problem

Include the Obsidian version, plugin version, operating system or mobile platform, which interface is affected (Quick switcher or `[[`), the exact query, and the expected and actual results. Use fictional filenames and aliases; do not attach private notes or vault contents. For compatibility problems, include other plugins that modify the same search interfaces.

### Local checks

Use **Node.js 24 or later**, as required by `package.json`.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Keep changes focused. Add regression coverage when changing matching, Unicode handling, highlights, filters, or patch lifecycle. Keep the English and Spanish READMEs in sync, and record user-visible changes in the changelog. Runtime code must work without Node.js, Electron, network access, or platform-specific APIs.

### Native integration check

Unit tests use an Obsidian API substitute. `tests/native.integration.js` exercises the actual native methods inside a running Obsidian instance, using fictional `TFile` objects and a simulated editor. It checks both search surfaces, ASCII ranking, Unicode highlights, aliases, filters, untouched suggestion branches, and link insertion. It does not create or modify notes.

The fixture contains an expression that evaluates to an async function with two arguments: `app` and a baseline object containing `quickOriginal` and `linkOriginal`. Run it through Obsidian's developer CLI evaluation command:

1. Disable Spanish Accent Search in the test vault and capture references to the unwrapped native Quick switcher's `getSuggestions` and the wikilink suggestion manager's `getFileSuggestions` methods.
2. Keep those references in memory as `{ quickOriginal, linkOriginal }`, then enable the plugin and wait for the workspace layout to be ready.
3. Evaluate the fixture function with the running `app` and that baseline object. All checks must pass, with an empty `failures` array.
4. Disable the plugin and verify that the original methods and their inheritance are restored, then enable it again and check that both adaptations are active without errors.

Do not capture a baseline while the plugin's wrappers are active. Native integration is separate from `npm test` and requires Obsidian 1.14.4 or a newly verified compatible version. A passing desktop check does not establish mobile compatibility; report the device and Obsidian version when testing mobile.

Contributions are distributed under the repository's [MIT license](LICENSE).

## Español

Se aceptan incidencias y pull requests en español o inglés. Abre una incidencia para comentar las funciones grandes o los cambios en las reglas de normalización antes de implementarlos. La distinción entre `n` y `ñ` es intencionada.

### Comunicar un problema

Incluye las versiones de Obsidian y del plugin, el sistema operativo o la plataforma móvil, la interfaz afectada (selector rápido o `[[`), la consulta exacta y los resultados esperados y obtenidos. Usa nombres de archivos y aliases ficticios; no adjuntes notas privadas ni contenido del baúl. Para problemas de compatibilidad, indica qué otros plugins modifican las mismas interfaces de búsqueda.

### Comprobaciones locales

Usa **Node.js 24 o posterior**, como exige `package.json`.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Limita cada cambio a su propósito. Añade pruebas de regresión al cambiar coincidencias, Unicode, resaltados, filtros o el ciclo de vida de los parches. Mantén sincronizados los README en inglés y español, y registra los cambios visibles para el usuario en el historial. El código del plugin debe funcionar sin Node.js, Electron, acceso a la red ni APIs específicas de una plataforma.

### Comprobación de integración nativa

Las pruebas unitarias usan un sustituto de la API de Obsidian. `tests/native.integration.js` ejecuta los métodos nativos reales dentro de Obsidian con objetos `TFile` ficticios y un editor simulado. Comprueba ambas interfaces, el orden ASCII, los resaltados Unicode, los aliases, los filtros, las ramas de sugerencias que se conservan y la inserción de enlaces. No crea ni modifica notas.

El archivo contiene una expresión que devuelve una función asíncrona con dos argumentos: `app` y un objeto de referencia con `quickOriginal` y `linkOriginal`. Ejecútala mediante el comando de evaluación de la CLI de desarrollo de Obsidian:

1. Desactiva Spanish Accent Search en el baúl de pruebas y conserva referencias a los métodos nativos originales: `getSuggestions` del selector rápido y `getFileSuggestions` del gestor de sugerencias de wikilinks.
2. Guarda esas referencias en memoria como `{ quickOriginal, linkOriginal }`, activa el plugin y espera a que el espacio de trabajo esté listo.
3. Evalúa la función con el `app` de la instancia abierta y ese objeto de referencia. Todas las comprobaciones deben pasar y `failures` debe ser un array vacío.
4. Desactiva el plugin y comprueba que se restauran los métodos originales y su herencia; vuelve a activarlo y comprueba que ambas adaptaciones funcionan sin errores.

No captures las referencias mientras los wrappers del plugin estén activos. La integración nativa es independiente de `npm test` y requiere Obsidian 1.14.4 o una versión cuya compatibilidad se haya verificado de nuevo. Una prueba de escritorio correcta no acredita la compatibilidad móvil; al probar en móvil, indica el dispositivo y la versión de Obsidian.

Las contribuciones se distribuyen bajo la [licencia MIT](LICENSE) del repositorio.
