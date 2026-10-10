// Ejecutar mediante Obsidian CLI. Todos los archivos y editores de prueba son simulados.
(async function (app, baseline) {
  const passed = [];
  const failures = [];
  const check = (name, condition) => {
    (condition ? passed : failures).push(name);
  };
  const plugin = app.plugins.plugins['busqueda-sin-tildes'];
  if (!plugin) return { passed: 0, failures: ['Plugin no cargado'] };
  const quickPrototype = app.internalPlugins.plugins.switcher.instance.QuickSwitcherModal.prototype;
  const suggester = app.workspace.editorSuggest.suggests.find(item => item.suggestManager?.getFileSuggestions);
  const manager = suggester.suggestManager;
  const sourcePrototype = Object.getPrototypeOf(app.vault.getFiles()[0]);
  const file = (path) => {
    const name = path.split('/').pop();
    const extension = name.slice(name.lastIndexOf('.') + 1);
    return Object.assign(Object.create(sourcePrototype), {
      path, name, extension, basename: name.slice(0, -(extension.length + 1)),
      stat: { mtime: 1, ctime: 1, size: 0 }, parent: null
    });
  };
  const angel = file('Personas/Ángel García López.md');
  const asciiAngel = file('Personas/Angel Garcia.md');
  const year = file('Año.md');
  const decomposedYear = file('An\u0303o.md');
  const penguin = file('Pingüino.md');
  const tree = file('😀 Árbol.md');
  const cafe = file('Cafe\u0301.md');
  const folder = file('Gestión/Proyecto.md');
  const ignored = file('Oculto/Ángel privado.md');
  const aliasFile = file('Persona.md');
  const pdf = file('Álbum.pdf');
  const image = file('Árbol.png');
  const canvas = file('Árbol.canvas');
  const base = file('Árbol.base');
  const unknown = file('Árbol.xyz');
  const files = [angel, asciiAngel, year, decomposedYear, penguin, tree, cafe, folder, ignored, aliasFile, pdf, image, canvas, base, unknown];
  const aliases = new Map([[angel, ['Ángel V.']], [aliasFile, ['Álvaro', 'Alvaro', 'Año', 'An\u0303o']]]);
  const path = (file) => file.extension === 'md' ? file.path.slice(0, -3) : file.path;
  const candidates = files.flatMap(file => [
    { file, path: path(file) },
    ...(aliases.get(file) ?? []).map(alias => ({ file, path: path(file), alias }))
  ]);
  candidates.push({ file: null, path: 'Ángel pendiente' });
  const metadata = {
    getLinkSuggestions: () => candidates,
    getFileCache: (file) => ({ frontmatter: { aliases: aliases.get(file) ?? [] } }),
    isUserIgnored: (path) => path.startsWith('Oculto/'),
    unresolvedLinks: { 'fuente.md': { 'Ángel pendiente': 1, 'pendiente': 1 } },
    fileToLinktext: (file) => file.basename
  };
  const fakeApp = {
    vault: {
      getFiles: () => files,
      getAbstractFileByPath: (path) => files.find(file => file.path === path),
      getConfig: () => false
    },
    metadataCache: metadata,
    workspace: { getRecentFiles: () => [angel.path, ignored.path] },
    internalPlugins: { getEnabledPluginById: () => null },
    embedRegistry: { isExtensionRegistered: (ext) => ext === 'pdf' },
    viewRegistry: { isExtensionRegistered: (ext) => ext === 'pdf' || ext === 'xyz' }
  };
  const quickContext = {
    app: fakeApp, context: 'view', shouldShowMarkdown: true,
    shouldShowNonAttachments: true, shouldShowImages: false,
    shouldShowNonImageAttachments: false, shouldShowAllTypes: false,
    shouldShowAlias: true, shouldShowUnresolved: true, shouldShowNonFileBookmarks: false
  };
  const runnable = { isCancelled: () => false };
  const quick = (query, overrides = {}) => quickPrototype.getSuggestions.call({ ...quickContext, ...overrides }, query);
  const linkContext = (overrides = {}) => Object.assign(Object.create(manager), {
    app: fakeApp, fileSuggestions: null, getSourcePath: () => '', ...overrides
  });
  const link = (query, overrides = {}) => manager.getFileSuggestions.call(linkContext(overrides), runnable, query);
  const summarize = (results) => JSON.stringify(results.map(result => ({
    type: result.type, path: result.path, file: result.file?.path, alias: result.alias,
    match: result.match, matches: result.matches, score: result.score, downranked: result.downranked
  })));

  check('Ambas funciones nativas adaptadas', plugin.getStatus().quickSwitcher && plugin.getStatus().wikilinks);
  for (const query of ['angel', 'ÁNGEL', 'angel garcia', 'garcia']) {
    check(`Ctrl+O encuentra nombre: ${query}`, quick(query).some(result => result.type === 'file' && result.file === angel));
    check(`[[ encuentra nombre: ${query}`, (await link(query)).some(result => result.type === 'file' && result.file === angel));
  }
  check('Consulta acentuada encuentra nombre ASCII', quick('Ángel').some(result => result.file === asciiAngel));
  check('Diéresis Ctrl+O', quick('pinguino').some(result => result.file === penguin));
  check('Diéresis [[', (await link('pinguino')).some(result => result.file === penguin));
  for (const query of ['ano', 'an\u0303o', 'año']) {
    const expected = query !== 'ano';
    for (const get of [quick, link]) {
      const results = await get(query);
      check(`ñ se conserva (${get === quick ? 'Ctrl+O' : '[['}, ${query})`,
        results.some(result => result.file === year) === expected
        && results.some(result => result.file === decomposedYear) === expected);
    }
  }
  check('Alias con acento', quick('alvaro').some(result => result.type === 'alias' && result.alias === 'Álvaro'));
  check('Aliases distintos no se colapsan', quick('alvaro').filter(result => result.type === 'alias' && result.file === aliasFile).length === 2);
  check('Desactivar alias respeta opción', quick('alvaro', { shouldShowAlias: false }).length === 0);
  check('Ruta de carpeta acentuada', quick('gestion').some(result => result.file === folder));
  const folderResult = quick('gestion').find(result => result.file === folder);
  check('Penalización nativa de ruta completa', folderResult.match.score === plugin.matcher.query('gestion').alias(path(folder), true).score - 1);
  const ignoredResult = quick('angel').find(result => result.type === 'file' && result.file === ignored);
  check('Archivo excluido penalizado', ignoredResult.downranked && ignoredResult.match.score === plugin.matcher.query('angel').path(path(ignored)).score - 10);
  const emojiResult = quick('arbol').find(result => result.file === tree);
  check('Resaltado tras emoji UTF16', JSON.stringify(emojiResult.match.matches) === '[[3,8]]');
  const cafeResult = (await link('cafe')).find(result => result.file === cafe);
  check('Resaltado incluye tilde Unicode descompuesta', JSON.stringify(cafeResult.matches) === '[[0,5]]');
  check('PDF oculto por opciones', !quick('album').some(result => result.file === pdf));
  check('PDF visible por opciones', quick('album', { shouldShowNonImageAttachments: true }).some(result => result.file === pdf));
  check('Imágenes ocultas por opciones', !quick('arbol').some(result => result.file === image));
  check('Imágenes visibles por opciones', quick('arbol', { shouldShowImages: true }).some(result => result.file === image));
  check('Canvas y Base respetan opciones', !quick('arbol', { shouldShowNonAttachments: false }).some(result => result.file === canvas || result.file === base));
  check('Tipos desconocidos ocultos', !quick('arbol').some(result => result.file === unknown));
  check('Todos los tipos visibles', quick('arbol', { shouldShowAllTypes: true }).some(result => result.file === unknown));
  check('Registro de adjuntos depende del contexto', !quick('arbol', { context: 'embed', shouldShowNonImageAttachments: true }).some(result => result.file === unknown));
  check('Registro de vistas depende del contexto', quick('arbol', { shouldShowNonImageAttachments: true }).some(result => result.file === unknown));
  check('Búsqueda vacía idéntica', summarize(quick('')) === summarize(baseline.quickOriginal.call(quickContext, '')));
  check('Búsqueda vacía [[ idéntica', summarize(await link('')) === summarize(await baseline.linkOriginal.call(linkContext(), runnable, '')));
  check('Enlaces pendientes sin normalizar', !quick('angel').some(result => result.type === 'unresolved' && result.linktext === 'Ángel pendiente'));
  check('Enlaces pendientes [[ sin normalizar', !(await link('angel')).some(result => result.type === 'linktext' && result.path === 'Ángel pendiente'));

  const asciiFiles = ['Carpeta/Alpha.md', 'Beta.md', 'Carpeta/Gamma.md'].map(file);
  const asciiApp = {
    ...fakeApp, vault: { ...fakeApp.vault, getFiles: () => asciiFiles },
    metadataCache: {
      ...metadata, getFileCache: () => ({ frontmatter: {} }), unresolvedLinks: {},
      getLinkSuggestions: () => asciiFiles.map(file => ({ file, path: path(file) }))
    }
  };
  for (const query of ['a', 'alpha', 'carpeta', 'gm']) {
    const context = { ...quickContext, app: asciiApp };
    check(`Ranking ASCII idéntico Ctrl+O: ${query}`, summarize(quickPrototype.getSuggestions.call(context, query)) === summarize(baseline.quickOriginal.call(context, query)));
    check(`Ranking ASCII idéntico [[: ${query}`, summarize(await manager.getFileSuggestions.call(linkContext({ app: asciiApp }), runnable, query)) === summarize(await baseline.linkOriginal.call(linkContext({ app: asciiApp }), runnable, query)));
  }

  for (const [query, method] of [
    ['angel#Encabezado', 'getHeadingSuggestions'], ['angel^bloque', 'getBlockSuggestions'],
    ['angel|etiqueta', 'getDisplaySuggestions'], ['##Encabezado', 'getGlobalHeadingSuggestions'],
    ['^^bloque', 'getGlobalBlockSuggestions']
  ]) {
    const sentinel = [{ marker: method }];
    const context = linkContext({ [method]: () => sentinel });
    const result = await manager.getSuggestionsAsync.call(context, runnable, query);
    check(`Se conserva rama ${method}`, result === sentinel);
  }

  let transaction;
  const expected = '[[Ángel García López]]';
  const selected = (await link('angel garcia')).find(result => result.file === angel && result.type === 'file');
  const editor = { getLine: () => '[[angel]]', transaction: value => { transaction = value; }, focus() {} };
  suggester.selectSuggestion.call({
    app: fakeApp, close() {},
    context: { query: 'angel', start: { line: 0, ch: 2 }, end: { line: 0, ch: 7 }, file: null, editor }
  }, selected, new KeyboardEvent('keydown', { key: 'Enter' }));
  check('Selección nativa conserva tildes al insertar', transaction?.changes[0]?.text === expected);
  check('Selección nativa reemplaza corchetes existentes', transaction?.changes[0]?.from.ch === 0 && transaction?.changes[0]?.to.ch === 9);
  check('Cursor queda tras el enlace completo', transaction?.selection?.from.ch === expected.length);
  check('No se pierde identidad ni ruta del archivo', selected.file === angel && selected.path === 'Personas/Ángel García López');
  return { passed: passed.length, total: passed.length + failures.length, failures };
})
