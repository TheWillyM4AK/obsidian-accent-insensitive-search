# Accent Insensitive Search — Búsqueda sin tildes

Español · [English](README.md)

Busca sin escribir tildes ni diéresis en el **selector rápido nativo de Obsidian (Ctrl+O / Cmd+O)** y las **sugerencias de enlaces `[[`**. Esas pulsaciones extra no afectan a las coincidencias: `alvaro gomez` encuentra **Álvaro Gómez** y `pinguino` encuentra **Pingüino**. Tus notas y enlaces conservan su escritura original.

Llevaba años encontrándome con este problema: tener que escribir las tildes para encontrar mis notas resultaba incómodo. Había visto varios hilos en el foro de Obsidian con personas a las que les pasaba lo mismo, así que finalmente decidí crear este plugin con ayuda de IA para solucionarlo y compartirlo con la comunidad.

**¿Por qué se distinguen `n` y `ñ`?** En español, la `ñ` es una letra propia y tiene su propia tecla en el teclado español. Escribirla no requiere una pulsación adicional para añadir un acento, por eso el plugin la conserva como una letra distinta: `ano` no encuentra `año`.

El plugin nació para escribir en español y también puede resultar útil en otros idiomas que usan marcas diacríticas combinantes. No es una herramienta general de transliteración.

| Escribes | Encuentras |
| --- | --- |
| `alvaro gomez` | `Álvaro Gómez` |
| `ÁLVARO` | `Álvaro` o `Alvaro` |
| `pinguino` | `Pingüino` |
| `cafe` | `Café` |
| `ano` | **No** coincide con `Año` |

Al seleccionar el primer ejemplo después de escribir `[[alvaro gomez`, Obsidian inserta `[[Álvaro Gómez]]`, con el nombre original de la nota.

## Funciones

- Funciona en el selector rápido y en las sugerencias de wikilinks existentes, sin sustituir las interfaces ni cambiar tus atajos.
- Busca entre nombres, rutas y aliases existentes; conserva la escritura original y el comportamiento habitual de Obsidian al insertar enlaces desde un alias.
- Respeta las opciones nativas de adjuntos y la penalización de los archivos excluidos. Mantiene el funcionamiento nativo de las consultas vacías, los marcadores, los enlaces pendientes, los encabezados, los bloques y el texto visible tras `|`.
- Sin ajustes, conexiones de red ni cambios en notas, nombres de archivo, frontmatter o aliases. La comparación se realiza en memoria con nombres, rutas y metadatos existentes.

El plugin amplía la búsqueda de archivos y aliases en esas dos interfaces. No añade búsqueda sin tildes a la búsqueda global, a buscadores de otros plugins, al texto de encabezados o bloques ni a los nombres de enlaces pendientes.

## Instalación

### Catálogo de la comunidad

1. Abre la [ficha oficial del plugin](https://community.obsidian.md/plugins/busqueda-sin-tildes) y selecciona **Add to Obsidian**.
2. Sigue las indicaciones de instalación de Obsidian y activa **Accent Insensitive Search** en **Ajustes → Plugins de la comunidad**.

También puedes utilizar BRAT o la instalación manual que se explican a continuación.

### BRAT

1. Instala y activa [BRAT](https://github.com/TfTHacker/obsidian42-brat) desde los plugins de la comunidad de Obsidian.
2. Añade este repositorio en BRAT: `https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search`.
3. Activa **Accent Insensitive Search** en **Ajustes → Plugins de la comunidad**, si aún no está activo.

### Manual

1. Descarga `main.js` y `manifest.json` de la [última versión publicada](https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search/releases/latest).
2. Crea `.obsidian/plugins/busqueda-sin-tildes/` dentro de tu baúl y coloca ambos archivos en esa carpeta.
3. Reinicia Obsidian y activa **Accent Insensitive Search** en **Ajustes → Plugins de la comunidad**.

Usa Ctrl+O y `[[` como siempre. Desactiva el plugin para recuperar el comportamiento nativo.

## Compatibilidad

- Versión mínima admitida: **Obsidian 1.14.4**.
- Verificado en escritorio con Obsidian 1.14.4, incluidas comprobaciones de los métodos nativos con archivos y un editor simulados en memoria.
- Diseñado para escritorio y móvil, sin dependencias específicas de una plataforma. **La verificación práctica en móvil está pendiente.**

La integración envuelve métodos internos de Obsidian porque la API pública no ofrece un punto de extensión para estas búsquedas nativas. Una actualización de Obsidian u otro plugin que cambie los mismos métodos puede exigir una revisión de compatibilidad. Si falta una interfaz o cambia el formato de sus resultados, el componente afectado conserva el comportamiento nativo y muestra un aviso único en español cuando Obsidian está en español, o en inglés para los demás idiomas. Al desactivar el plugin, se restauran los métodos cuando es posible y los wrappers que permanezcan quedan inactivos.

## Desarrollo

Requiere **Node.js 24 o posterior**.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

La compilación genera `main.js`; Obsidian aporta la API en tiempo de ejecución. Las pruebas unitarias cubren normalización Unicode, posiciones de resaltado, coincidencias, filtros nativos, ordenación, cancelación y parches reversibles. La prueba de integración nativa también comprueba la compatibilidad de resultados y la inserción de un enlace con sus tildes, sin crear notas.

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para el procedimiento de integración y las instrucciones de colaboración, y [CHANGELOG.md](CHANGELOG.md) para el historial de versiones.

## Comentarios y colaboración

[Abre una incidencia](https://github.com/TheWillyM4AK/obsidian-accent-insensitive-search/issues) en español o inglés. Incluye las versiones de Obsidian y del plugin, la plataforma y un ejemplo mínimo con nombres de notas ficticios. Son bienvenidas las propuestas y los informes reproducibles de otros idiomas.

## Licencia

[MIT](LICENSE) · TheWillyM4AK. Creado con la [API de Obsidian](https://github.com/obsidianmd/obsidian-api).
