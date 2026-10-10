import { afterEach, describe, expect, it, vi } from "vitest";
import {
  displayPath, extendLinkResults, extendQuickResults, fileAllowed, yieldToMain,
  type AliasParser, type FileInfo, type LinkCandidate, type LinkContext, type LinkResult,
  type NativeApp, type QuickContext, type QuickResult,
} from "../src/adapters";
import { NormalizedMatcher, type PrepareSearch } from "../src/matching";

const prepare: PrepareSearch = (query) => (text) => {
  const needle = query.toLowerCase();
  const haystack = text.toLowerCase();
  const matches: Array<[number, number]> = [];
  let cursor = 0;
  for (let index = 0; index < needle.length; index += 1) {
    const position = haystack.indexOf(needle[index]!, cursor);
    if (position < 0) return null;
    matches.push([position, position + 1]);
    cursor = position + 1;
  }
  return { score: 100 - (matches[0]?.[0] ?? 0) - text.length / 100, matches };
};

const aliases: AliasParser = (frontmatter) =>
  (frontmatter as { aliases?: string[] } | undefined)?.aliases ?? null;
const matcher = () => new NormalizedMatcher(prepare);
const notCancelled = { isCancelled: () => false };
const enabled = () => true;
const file = (path: string): FileInfo => ({ path, extension: path.split(".").at(-1)! });

describe("yieldToMain", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("cede mediante MessageChannel y cierra ambos puertos al recibir el mensaje", async () => {
    const port1 = { onmessage: null as (() => void) | null, close: vi.fn() };
    const port2 = { postMessage: vi.fn(), close: vi.fn() };
    vi.stubGlobal("MessageChannel", class {
      port1 = port1;
      port2 = port2;
    });
    let resolved = false;
    const pending = yieldToMain().then(() => { resolved = true; });
    expect(port2.postMessage).toHaveBeenCalledWith(null);
    expect(resolved).toBe(false);
    expect(port1.close).not.toHaveBeenCalled();
    expect(port2.close).not.toHaveBeenCalled();
    port1.onmessage!();
    await pending;
    expect(resolved).toBe(true);
    expect(port1.close).toHaveBeenCalledTimes(1);
    expect(port2.close).toHaveBeenCalledTimes(1);
  });

  it("usa setTimeout cuando no existe MessageChannel", async () => {
    vi.stubGlobal("MessageChannel", undefined);
    vi.useFakeTimers();
    vi.stubGlobal("window", { setTimeout });
    let resolved = false;
    const pending = yieldToMain().then(() => { resolved = true; });
    expect(vi.getTimerCount()).toBe(1);
    expect(resolved).toBe(false);
    await vi.runAllTimersAsync();
    await pending;
    expect(resolved).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

function app(
  files: FileInfo[] = [],
  candidates: LinkCandidate[] = [],
  ignored: string[] = [],
  frontmatter: Record<string, unknown> = {},
): NativeApp {
  return {
    vault: { getFiles: vi.fn(() => files) },
    metadataCache: {
      getLinkSuggestions: vi.fn(() => candidates),
      getFileCache: vi.fn((entry) => ({ frontmatter: frontmatter[entry.path] })),
      isUserIgnored: vi.fn((path) => ignored.includes(path)),
    },
    viewRegistry: { isExtensionRegistered: vi.fn((extension) => ["pdf", "view-only"].includes(extension)) },
    embedRegistry: { isExtensionRegistered: vi.fn((extension) => ["pdf", "embed-only"].includes(extension)) },
  };
}

function quick(nativeApp: NativeApp = app(), overrides: Partial<QuickContext> = {}): QuickContext {
  return {
    app: nativeApp,
    context: "view",
    shouldShowMarkdown: true,
    shouldShowNonAttachments: true,
    shouldShowImages: true,
    shouldShowNonImageAttachments: true,
    shouldShowAllTypes: false,
    shouldShowAlias: true,
    ...overrides,
  };
}

describe("displayPath y fileAllowed", () => {
  it("omite solo la extensión de Markdown", () => {
    expect(displayPath(file("Personas/Ángel.md"))).toBe("Personas/Ángel");
    expect(displayPath(file("Ángel.canvas"))).toBe("Ángel.canvas");
    expect(displayPath(file("Ángel.pdf"))).toBe("Ángel.pdf");
  });

  it.each([
    ["md", "shouldShowMarkdown"],
    ["canvas", "shouldShowNonAttachments"],
    ["base", "shouldShowNonAttachments"],
    ["png", "shouldShowImages"],
    ["jpg", "shouldShowImages"],
    ["svg", "shouldShowImages"],
    ["avif", "shouldShowImages"],
    ["pdf", "shouldShowNonImageAttachments"],
  ] as const)("respeta el flag de %s", (extension, flag) => {
    const entry = file(`Ángel.${extension}`);
    expect(fileAllowed(quick(), entry)).toBe(true);
    expect(fileAllowed(quick(app(), { [flag]: false }), entry)).toBe(false);
  });

  it("consulta el registro del contexto view o embed para los adjuntos", () => {
    const nativeApp = app();
    const view = quick(nativeApp);
    const embed = quick(nativeApp, { context: "embed" });
    expect(fileAllowed(view, file("a.view-only"))).toBe(true);
    expect(fileAllowed(view, file("a.embed-only"))).toBe(false);
    expect(fileAllowed(embed, file("a.embed-only"))).toBe(true);
    expect(fileAllowed(embed, file("a.view-only"))).toBe(false);
  });

  it("admite extensiones desconocidas solo con todos los tipos activado", () => {
    expect(fileAllowed(quick(), file("a.unknown"))).toBe(false);
    expect(fileAllowed(quick(app(), {
      shouldShowAllTypes: true,
      shouldShowNonImageAttachments: false,
    }), file("a.unknown"))).toBe(true);
  });
});

describe("extendQuickResults", () => {
  it("devuelve la misma referencia para una consulta vacía o solo con espacios", () => {
    const nativeApp = app([file("Ángel.md")]);
    const originals: QuickResult[] = [];
    expect(extendQuickResults(quick(nativeApp), "", originals, matcher(), aliases)).toBe(originals);
    expect(extendQuickResults(quick(nativeApp), " \t ", originals, matcher(), aliases)).toBe(originals);
    expect(nativeApp.vault.getFiles).not.toHaveBeenCalled();
  });

  it("añade nombres normalizados y conserva el archivo original", () => {
    const entry = file("Personas/Ángel.md");
    const results = extendQuickResults(quick(app([entry])), " angel ", [], matcher(), aliases);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ type: "file", file: entry, downranked: false });
    expect(results[0]?.file).toBe(entry);
    expect(results[0]?.match?.matches).toEqual([[9, 14]]);
  });

  it("solo crea aliases cuando su opción está activa", () => {
    const entry = file("Persona.md");
    const nativeApp = app([entry], [], [], { [entry.path]: { aliases: ["Ángel", "García"] } });
    expect(extendQuickResults(quick(nativeApp, { shouldShowAlias: false }), "angel", [], matcher(), aliases))
      .toEqual([]);
    const results = extendQuickResults(quick(nativeApp), "angel", [], matcher(), aliases);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ type: "alias", file: entry, alias: "Ángel" });
    expect(results[0]?.match?.matches).toEqual([[0, 5]]);
  });

  it("aplica -10 a archivos y aliases excluidos", () => {
    const entry = file("Ángel.md");
    const nativeApp = app([entry], [], [entry.path], { [entry.path]: { aliases: ["Ángel amigo"] } });
    const results = extendQuickResults(quick(nativeApp), "angel", [], matcher(), aliases);
    expect(results).toHaveLength(2);
    const pathMatch = matcher().query("angel").path("Ángel")!;
    const aliasMatch = matcher().query("angel").alias("Ángel amigo")!;
    expect(results.find(result => result.type === "file")?.match?.score).toBe(pathMatch.score - 10);
    expect(results.find(result => result.type === "alias")?.match?.score).toBe(aliasMatch.score - 10);
    expect(results.every(result => result.downranked)).toBe(true);
  });

  it("no añade archivos de tipos desactivados", () => {
    const entries = [file("Ángel.md"), file("Ángel.png"), file("Ángel.pdf"), file("Ángel.canvas"), file("Ángel.base")];
    const results = extendQuickResults(quick(app(entries), {
      shouldShowImages: false,
      shouldShowNonImageAttachments: false,
      shouldShowNonAttachments: false,
    }), "angel", [], matcher(), aliases);
    expect(results.map(result => result.file?.path)).toEqual(["Ángel.md"]);
  });

  it("combina sin duplicados, conserva metadatos y mantiene enlaces pendientes", () => {
    const entry = file("Ángel.md");
    const unresolved: QuickResult = { type: "unresolved", match: { score: 1000, matches: [] }, title: "Pendiente" };
    const original: QuickResult = { type: "file", file: entry, match: { score: 0, matches: [] }, nativeProperty: 42 };
    const originals = [unresolved, original];
    const results = extendQuickResults(quick(app([entry, entry])), "angel", originals, matcher(), aliases);
    expect(results).toHaveLength(2);
    expect(results[0]).toBe(unresolved);
    expect(results[1]).toMatchObject({ file: entry, nativeProperty: 42 });
    expect(original.match?.score).toBe(0);
  });

  it("elimina la coincidencia nativa falsa de año NFD con ano", () => {
    const entry = file("an\u0303o.md");
    const unresolved: QuickResult = { type: "unresolved", match: null };
    const originals: QuickResult[] = [{ type: "file", file: entry, match: { score: 10, matches: [[0, 4]] } }, unresolved];
    const results = extendQuickResults(quick(app([entry])), "ano", originals, matcher(), aliases);
    expect(results).toEqual([unresolved]);
  });

  it("comprueba también aliases NFD y consultas con ñ NFD", () => {
    const entry = file("Persona.md");
    const aliasOriginal: QuickResult = { type: "alias", file: entry, alias: "an\u0303o", match: { score: 10, matches: [] } };
    expect(extendQuickResults(quick(app()), "ano", [aliasOriginal], matcher(), aliases)).toEqual([]);
    const ascii = file("ano.md");
    const asciiOriginal: QuickResult = { type: "file", file: ascii, match: { score: 10, matches: [] } };
    expect(extendQuickResults(quick(app()), "an\u0303o", [asciiOriginal], matcher(), aliases)).toEqual([]);
  });
});

describe("extendLinkResults", () => {
  it("usa fileSuggestions si está disponible sin consultar la caché", async () => {
    const cachedFile = file("García.md");
    const selectedFile = file("Ángel.md");
    const nativeApp = app([], [{ file: cachedFile, path: "García" }]);
    const context: LinkContext = { app: nativeApp, fileSuggestions: [{ file: selectedFile, path: "Ángel#Sección" }] };
    const results = await extendLinkResults(context, notCancelled, "angel", [], matcher(), enabled);
    expect(nativeApp.metadataCache.getLinkSuggestions).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ type: "file", file: selectedFile, path: "Ángel#Sección" });
    expect(results[0]?.file).toBe(selectedFile);
  });

  it("consulta getLinkSuggestions cuando no hay fileSuggestions", async () => {
    const entry = file("Ángel.md");
    const nativeApp = app([], [{ file: entry, path: "Ángel" }]);
    const results = await extendLinkResults({ app: nativeApp, fileSuggestions: null }, notCancelled, "angel", [], matcher(), enabled);
    expect(nativeApp.metadataCache.getLinkSuggestions).toHaveBeenCalledTimes(1);
    expect(results[0]?.path).toBe("Ángel");
  });

  it("una caché vacía disponible no provoca una segunda consulta", async () => {
    const nativeApp = app([], [{ file: file("Ángel.md"), path: "Ángel" }]);
    const results = await extendLinkResults({ app: nativeApp, fileSuggestions: [] }, notCancelled, "angel", [], matcher(), enabled);
    expect(results).toEqual([]);
    expect(nativeApp.metadataCache.getLinkSuggestions).not.toHaveBeenCalled();
  });

  it("conserva aliases, rutas, resaltados y penalización de excluidos", async () => {
    const entry = file("Persona.md");
    const nativeApp = app([], [], [entry.path]);
    const context: LinkContext = { app: nativeApp, fileSuggestions: [{ file: entry, path: "Persona#Dato", alias: "Ángel" }] };
    const results = await extendLinkResults(context, notCancelled, "angel", [], matcher(), enabled);
    expect(results[0]).toMatchObject({ type: "alias", file: entry, path: "Persona#Dato", alias: "Ángel", downranked: true, matches: [[0, 5]] });
    expect(results[0]?.score).toBe(matcher().query("angel").alias("Ángel")!.score - 10);
  });

  it("combina sin duplicados y preserva originales pendientes y metadatos", async () => {
    const entry = file("Ángel.md");
    const candidate = { file: entry, path: "Ángel#Sección" };
    const unresolved: LinkResult = { type: "unresolved", path: "Pendiente", score: 1000, matches: null, extra: "original" };
    const original: LinkResult = { type: "file", file: entry, path: candidate.path, score: 0, matches: [], nativeProperty: true };
    const context: LinkContext = {
      app: app(),
      fileSuggestions: [candidate, candidate, { file: null, path: "Ángel pendiente" }],
    };
    const results = await extendLinkResults(context, notCancelled, "angel", [unresolved, original], matcher(), enabled);
    expect(results).toHaveLength(2);
    expect(results[0]).toBe(unresolved);
    expect(results[1]).toMatchObject({ path: candidate.path, nativeProperty: true });
    expect(original.score).toBe(0);
  });

  it("devuelve la misma referencia para consulta vacía, cancelación inicial o plugin desactivado", async () => {
    const nativeApp = app();
    const context: LinkContext = { app: nativeApp, fileSuggestions: null };
    const originals: LinkResult[] = [{ type: "unresolved", path: "pendiente", score: 0, matches: null }];
    expect(await extendLinkResults(context, notCancelled, "", originals, matcher(), enabled)).toBe(originals);
    expect(await extendLinkResults(context, { isCancelled: () => true }, "angel", originals, matcher(), enabled)).toBe(originals);
    expect(await extendLinkResults(context, notCancelled, "angel", originals, matcher(), () => false)).toBe(originals);
    expect(nativeApp.metadataCache.getLinkSuggestions).not.toHaveBeenCalled();
  });

  it("elimina falsos positivos NFD sin alterar pendientes", async () => {
    const entry = file("an\u0303o.md");
    const unresolved: LinkResult = { type: "unresolved", path: "an\u0303o", score: 0, matches: null };
    const nativeFile: LinkResult = { type: "file", file: entry, path: "an\u0303o", score: 10, matches: [[0, 4]] };
    const nativeAlias: LinkResult = { type: "alias", file: entry, path: "an\u0303o", alias: "an\u0303o", score: 10, matches: [] };
    const context: LinkContext = { app: app(), fileSuggestions: [{ file: entry, path: "an\u0303o" }] };
    const results = await extendLinkResults(context, notCancelled, "ano", [nativeFile, nativeAlias, unresolved], matcher(), enabled);
    expect(results).toEqual([unresolved]);
  });

  it.each(["cancelar", "desactivar"])("descarta el trabajo parcial al %s durante la cesión", async (action) => {
    const entry = file("Ángel.md");
    const candidate: LinkCandidate = { file: entry, path: "Ángel" };
    const context: LinkContext = { app: app(), fileSuggestions: Array.from({ length: 130 }, () => candidate) };
    const originals: LinkResult[] = [];
    let cancelled = false;
    let active = true;
    let resume!: () => void;
    const yieldTask = vi.fn(() => new Promise<void>(resolve => { resume = resolve; }));
    const pending = extendLinkResults(context, { isCancelled: () => cancelled }, "angel", originals, matcher(), () => active, yieldTask);
    expect(yieldTask).toHaveBeenCalledTimes(1);
    if (action === "cancelar") cancelled = true;
    else active = false;
    resume();
    expect(await pending).toBe(originals);
  });

  it("cede ejecución entre lotes y continúa si sigue activo", async () => {
    const entry = file("Ángel.md");
    const context: LinkContext = {
      app: app(),
      fileSuggestions: Array.from({ length: 257 }, () => ({ file: entry, path: "Ángel" })),
    };
    const yieldTask = vi.fn(async () => undefined);
    const pending = extendLinkResults(context, notCancelled, "angel", [], matcher(), enabled, yieldTask);
    expect(yieldTask).toHaveBeenCalledTimes(1);
    expect(await pending).toHaveLength(1);
    expect(yieldTask).toHaveBeenCalledTimes(2);
  });

  it("descarta los resultados si se desactiva al terminar el último elemento", async () => {
    const entry = file("Ángel.md");
    const nativeApp = app();
    let active = true;
    nativeApp.metadataCache.isUserIgnored = () => {
      active = false;
      return false;
    };
    const originals: LinkResult[] = [];
    const results = await extendLinkResults(
      { app: nativeApp, fileSuggestions: [{ file: entry, path: "Ángel" }] },
      notCancelled, "angel", originals, matcher(), () => active,
    );
    expect(results).toBe(originals);
  });
});
