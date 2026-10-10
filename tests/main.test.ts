import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { App, PluginManifest } from "obsidian";
import type { LinkResult, QuickResult } from "../src/adapters";

const mock = vi.hoisted(() => ({ notice: vi.fn(), getLanguage: vi.fn(() => 'es') }));

vi.mock("obsidian", () => ({
  Plugin: class {
    registerEvent = vi.fn();
    constructor(public app: unknown) {}
  },
  Notice: class {
    constructor(message: string, duration: number) { mock.notice(message, duration); }
  },
  getLanguage: mock.getLanguage,
  parseFrontMatterAliases: (frontmatter: { aliases?: string[] } | undefined) => frontmatter?.aliases ?? null,
  prepareFuzzySearch: (query: string) => (text: string) => {
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
    return { score: 100 - text.length / 100, matches };
  },
}));

import BusquedaSinTildes from "../src/main";

const manifest: PluginManifest = {
  id: "busqueda-sin-tildes", name: "Búsqueda sin tildes", version: "0.1.0",
  minAppVersion: "1.14.4", description: "Prueba", author: "Prueba", isDesktopOnly: false,
};
const runnable = { isCancelled: () => false };

function environment(options: { missingQuick?: boolean; missingLinks?: boolean } = {}) {
  const entry = { path: "Ángel.md", extension: "md" };
  const quickOriginals: QuickResult[] = [];
  const linkOriginals: LinkResult[] = [];
  const nativeQuick = vi.fn<(...args: unknown[]) => unknown>(() => quickOriginals);
  const nativeLink = vi.fn<(...args: unknown[]) => unknown>(() => linkOriginals);
  const prototype = { getSuggestions: nativeQuick };
  const ready: Array<() => void> = [];
  const listeners = new Map<string, () => void>();
  const nativeApp = {
    vault: { getFiles: vi.fn(() => [entry]) },
    metadataCache: {
      getLinkSuggestions: vi.fn(() => [{ file: entry, path: "Ángel" }]),
      getFileCache: vi.fn(() => null),
      isUserIgnored: vi.fn(() => false),
    },
    viewRegistry: { isExtensionRegistered: () => true },
    embedRegistry: { isExtensionRegistered: () => true },
    internalPlugins: options.missingQuick ? {} : {
      plugins: { switcher: { instance: { QuickSwitcherModal: { prototype } } } },
    },
    workspace: {
      onLayoutReady: vi.fn((callback: () => void) => { ready.push(callback); }),
      on: vi.fn((name: string, callback: () => void) => {
        listeners.set(name, callback);
        return { name };
      }),
      editorSuggest: { suggests: [] as Array<{ suggestManager: object }> },
    },
  };
  const manager = {
    app: nativeApp,
    fileSuggestions: null,
    getFileSuggestions: nativeLink,
    getSuggestionsAsync: vi.fn(),
  };
  if (!options.missingLinks) nativeApp.workspace.editorSuggest.suggests.push({ suggestManager: manager });
  const receiver = Object.assign(Object.create(prototype), {
    app: nativeApp,
    context: "view",
    shouldShowMarkdown: true,
    shouldShowNonAttachments: true,
    shouldShowImages: true,
    shouldShowNonImageAttachments: true,
    shouldShowAllTypes: false,
    shouldShowAlias: true,
  }) as { getSuggestions(query: string): unknown };
  const plugin = new BusquedaSinTildes(nativeApp as unknown as App, manifest);
  const load = () => {
    plugin.onload();
    ready.forEach(callback => callback());
  };
  return { plugin, load, nativeApp, prototype, manager, receiver, ready, listeners, entry,
    nativeQuick, nativeLink, quickOriginals, linkOriginals };
}

describe("ciclo de vida y compatibilidad del plugin", () => {
  beforeEach(() => {
    mock.notice.mockClear();
    mock.getLanguage.mockReturnValue('es');
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("instala ambos parches al estar listo el layout y conserva los resultados nativos", async () => {
    const env = environment();
    env.plugin.onload();
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: false, wikilinks: false });
    env.ready.forEach(callback => callback());
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: true, wikilinks: true });
    expect(env.prototype.getSuggestions).not.toBe(env.nativeQuick);
    expect(env.manager.getFileSuggestions).not.toBe(env.nativeLink);
    expect(env.receiver.getSuggestions("angel")).toMatchObject([{ type: "file", file: env.entry }]);
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toMatchObject([{ type: "file", path: "Ángel", file: env.entry }]);
    expect(env.nativeQuick).toHaveBeenCalledWith("angel");
    expect(env.nativeLink).toHaveBeenCalledWith(runnable, "angel");
    expect(env.plugin.registerEvent).toHaveBeenCalledTimes(2);
    expect(mock.notice).not.toHaveBeenCalled();
    env.plugin.onunload();
  });

  it("no apila wrappers al repetirse los eventos de layout y archivo", () => {
    const env = environment();
    env.load();
    const quick = env.prototype.getSuggestions;
    const links = env.manager.getFileSuggestions;
    env.listeners.get("layout-change")!();
    env.listeners.get("file-open")!();
    expect(env.prototype.getSuggestions).toBe(quick);
    expect(env.manager.getFileSuggestions).toBe(links);
    env.plugin.onunload();
  });

  it("avisa una sola vez por superficie ausente aunque haya varios reintentos", () => {
    const env = environment({ missingQuick: true, missingLinks: true });
    env.load();
    env.listeners.get("layout-change")!();
    env.listeners.get("file-open")!();
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: false, wikilinks: false });
    expect(mock.notice).toHaveBeenCalledTimes(2);
    expect(mock.notice.mock.calls.filter(call => String(call[0]).includes("Ctrl+O"))).toHaveLength(1);
    expect(mock.notice.mock.calls.filter(call => String(call[0]).includes("sugerencias de [["))).toHaveLength(1);
    env.plugin.onunload();
  });

  it("usa el idioma de Obsidian para los avisos de incompatibilidad", () => {
    mock.getLanguage.mockReturnValue('en');
    const env = environment({ missingQuick: true, missingLinks: true });
    env.load();
    expect(mock.notice).toHaveBeenCalledWith(
      expect.stringContaining('Spanish Accent Search: this version cannot ignore accents in Ctrl+O'), 10000
    );
    expect(mock.notice).toHaveBeenCalledWith(
      expect.stringContaining('Spanish Accent Search: this version cannot ignore accents in [[ suggestions'), 10000
    );
    env.plugin.onunload();
  });

  it("desactiva solo Ctrl+O si el método nativo pasa a devolver una Promise", async () => {
    const env = environment();
    const pending = Promise.resolve(env.quickOriginals);
    env.nativeQuick.mockReturnValue(pending);
    env.load();
    expect(env.receiver.getSuggestions("angel")).toBe(pending);
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: false, wikilinks: true });
    expect(mock.notice).toHaveBeenCalledTimes(1);
    expect(env.receiver.getSuggestions("angel")).toBe(pending);
    env.listeners.get("layout-change")!();
    expect(env.plugin.getStatus().quickSwitcher).toBe(false);
    expect(mock.notice).toHaveBeenCalledTimes(1);
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toHaveLength(1);
    env.plugin.onunload();
  });

  it("devuelve los originales y desactiva solo Ctrl+O si falla su extensión", async () => {
    const env = environment();
    env.load();
    env.nativeApp.vault.getFiles.mockImplementation(() => { throw new Error("extensión fallida"); });
    expect(env.receiver.getSuggestions("angel")).toBe(env.quickOriginals);
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: false, wikilinks: true });
    expect(env.receiver.getSuggestions("angel")).toBe(env.quickOriginals);
    expect(mock.notice).toHaveBeenCalledTimes(1);
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toHaveLength(1);
    env.plugin.onunload();
  });

  it("devuelve los originales y desactiva solo enlaces si falla su extensión", async () => {
    const env = environment();
    env.load();
    env.nativeApp.metadataCache.getLinkSuggestions.mockImplementation(() => { throw new Error("caché incompatible"); });
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toBe(env.linkOriginals);
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: true, wikilinks: false });
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toBe(env.linkOriginals);
    expect(mock.notice).toHaveBeenCalledTimes(1);
    expect(env.receiver.getSuggestions("angel")).toHaveLength(1);
    env.plugin.onunload();
  });

  it("conserva una respuesta nativa incompatible de enlaces y avisa una vez", async () => {
    const env = environment();
    const nativeValue = { incompatible: true };
    env.nativeLink.mockResolvedValue(nativeValue);
    env.load();
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toBe(nativeValue);
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: true, wikilinks: false });
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toBe(nativeValue);
    expect(mock.notice).toHaveBeenCalledTimes(1);
    env.plugin.onunload();
  });

  it("conserva las excepciones y rechazos del método nativo", async () => {
    const env = environment();
    const quickFailure = new Error("fallo nativo Ctrl+O");
    const linkFailure = new Error("fallo nativo enlaces");
    env.nativeQuick.mockImplementation(() => { throw quickFailure; });
    env.nativeLink.mockRejectedValue(linkFailure);
    env.load();
    expect(() => env.receiver.getSuggestions("angel")).toThrow(quickFailure);
    await expect(env.manager.getFileSuggestions(runnable, "angel")).rejects.toBe(linkFailure);
    expect(mock.notice).not.toHaveBeenCalled();
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: true, wikilinks: true });
    env.plugin.onunload();
  });

  it("restaura los métodos originales y no reaplica parches después de unload", () => {
    const env = environment();
    env.load();
    env.plugin.onunload();
    expect(env.prototype.getSuggestions).toBe(env.nativeQuick);
    expect(env.manager.getFileSuggestions).toBe(env.nativeLink);
    expect(env.plugin.getStatus()).toEqual({ quickSwitcher: false, wikilinks: false });
    env.listeners.get("layout-change")!();
    expect(env.prototype.getSuggestions).toBe(env.nativeQuick);
    expect(env.manager.getFileSuggestions).toBe(env.nativeLink);
    expect(mock.notice).not.toHaveBeenCalled();
  });

  it("devuelve los originales si unload ocurre mientras espera la búsqueda nativa", async () => {
    const env = environment();
    let resolve!: (results: LinkResult[]) => void;
    env.nativeLink.mockReturnValue(new Promise<LinkResult[]>(complete => { resolve = complete; }));
    env.load();
    const pending = env.manager.getFileSuggestions(runnable, "angel");
    env.plugin.onunload();
    resolve(env.linkOriginals);
    expect(await pending).toBe(env.linkOriginals);
    expect(env.nativeApp.metadataCache.getLinkSuggestions).not.toHaveBeenCalled();
    expect(mock.notice).not.toHaveBeenCalled();
  });

  it("un wrapper conservado por un tercero delega sin añadir coincidencias tras unload", async () => {
    const env = environment();
    env.load();
    const quickWrapper = env.prototype.getSuggestions;
    const linkWrapper = env.manager.getFileSuggestions;
    const otherQuick = vi.fn(function (this: unknown, ...args: unknown[]) {
      return quickWrapper.apply(this, args);
    });
    const otherLink = vi.fn(function (this: unknown, ...args: unknown[]) {
      return linkWrapper.apply(this, args);
    });
    env.prototype.getSuggestions = otherQuick;
    env.manager.getFileSuggestions = otherLink;
    env.plugin.onunload();
    expect(env.prototype.getSuggestions).toBe(otherQuick);
    expect(env.manager.getFileSuggestions).toBe(otherLink);
    expect(env.receiver.getSuggestions("angel")).toBe(env.quickOriginals);
    expect(await env.manager.getFileSuggestions(runnable, "angel")).toBe(env.linkOriginals);
    expect(env.nativeApp.vault.getFiles).not.toHaveBeenCalled();
    expect(env.nativeApp.metadataCache.getLinkSuggestions).not.toHaveBeenCalled();
  });
});
