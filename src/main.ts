import { Notice, Plugin, getLanguage, parseFrontMatterAliases, prepareFuzzySearch, requireApiVersion } from 'obsidian';
import { extendLinkResults, extendQuickResults, type LinkContext, type LinkResult, type QuickContext, type QuickResult, type Runnable } from './adapters';
import { NormalizedMatcher } from './matching';
import { patchMethod, type MethodPatch } from './patch';
import { incompatibilityNotice, nativeSupportNotice, type SearchSurface } from './i18n';

/** Desde esta versión, Obsidian ignora los acentos en sus sugerencias nativas. */
export const NATIVE_SUPPORT_VERSION = '1.15.0';

interface StoredData {
  nativeNoticeShown?: boolean;
}

interface NativeSurface {
  internalPlugins?: {
    plugins?: { switcher?: { instance?: { QuickSwitcherModal?: { prototype: object } } } };
  };
  workspace: {
    editorSuggest?: { suggests?: Array<{ suggestManager?: object }> };
  };
}

export default class BusquedaSinTildes extends Plugin {
  private enabled = false;
  private readonly matcher = new NormalizedMatcher(prepareFuzzySearch);
  private readonly patches: MethodPatch[] = [];
  private readonly targets = new WeakSet<object>();
  private readonly notices = new Set<SearchSurface>();
  private status = { quickSwitcher: false, wikilinks: false };

  onload(): void {
    // Con el soporte nativo, los parches solo duplicarían el trabajo de Obsidian.
    if (requireApiVersion(NATIVE_SUPPORT_VERSION)) {
      this.app.workspace.onLayoutReady(() => void this.announceNativeSupport());
      return;
    }
    this.enabled = true;
    this.app.workspace.onLayoutReady(() => this.applyPatches());
    this.registerEvent(this.app.workspace.on('layout-change', () => this.applyPatches()));
    this.registerEvent(this.app.workspace.on('file-open', () => this.applyPatches()));
  }

  onunload(): void {
    this.enabled = false;
    for (const patch of [...this.patches].reverse()) patch.dispose();
    this.matcher.clear();
    this.status = { quickSwitcher: false, wikilinks: false };
  }

  getStatus(): Readonly<typeof this.status> { return { ...this.status }; }

  /** Avisa una sola vez por vault de que el plugin ya no es necesario. */
  private async announceNativeSupport(): Promise<void> {
    const data = ((await this.loadData()) ?? {}) as StoredData;
    if (data.nativeNoticeShown) return;
    new Notice(nativeSupportNotice(getLanguage()), 0);
    await this.saveData({ ...data, nativeNoticeShown: true });
  }

  private warnOnce(surface: SearchSurface): void {
    if (this.notices.has(surface) || !this.enabled) return;
    this.notices.add(surface);
    const message = incompatibilityNotice(getLanguage(), surface);
    new Notice(message, 10000);
    console.warn(`[busqueda-sin-tildes] ${message}`);
  }

  private applyPatches(): void {
    if (!this.enabled) return;
    const native = this.app as unknown as NativeSurface;
    const prototype = native.internalPlugins?.plugins?.switcher?.instance?.QuickSwitcherModal?.prototype;
    if (prototype && typeof (prototype as Record<string, unknown>).getSuggestions === 'function') {
      if (!this.targets.has(prototype)) {
        try {
          const patch = patchMethod(prototype, 'getSuggestions', (original, receiver: QuickContext, args) => {
            const originals = original.apply(receiver, args) as QuickResult[];
            if (!this.enabled || !this.status.quickSwitcher || typeof args[0] !== 'string') return originals;
            if (!Array.isArray(originals)) {
              this.status.quickSwitcher = false;
              this.warnOnce('quickSwitcher');
              return originals;
            }
            try {
              return extendQuickResults(receiver, args[0], originals, this.matcher, parseFrontMatterAliases);
            } catch {
              this.status.quickSwitcher = false;
              this.warnOnce('quickSwitcher');
              return originals;
            }
          });
          this.patches.push(patch);
          this.targets.add(prototype);
          this.status.quickSwitcher = true;
        } catch { this.warnOnce('quickSwitcher'); }
      }
    } else this.warnOnce('quickSwitcher');

    const suggesters = native.workspace.editorSuggest?.suggests;
    const manager = suggesters?.map(suggester => suggester.suggestManager)
      .find(candidate => candidate && typeof (candidate as Record<string, unknown>).getFileSuggestions === 'function'
        && typeof (candidate as Record<string, unknown>).getSuggestionsAsync === 'function');
    if (manager) {
      if (!this.targets.has(manager)) {
        try {
          const patch = patchMethod(manager, 'getFileSuggestions', async (original, receiver: LinkContext, args) => {
            const originals = await original.apply(receiver, args) as LinkResult[];
            if (!this.enabled || !this.status.wikilinks || typeof args[1] !== 'string') return originals;
            if (!Array.isArray(originals)) {
              this.status.wikilinks = false;
              this.warnOnce('wikilinks');
              return originals;
            }
            try {
              return await extendLinkResults(
                receiver, args[0] as Runnable, args[1], originals,
                this.matcher, () => this.enabled
              );
            } catch {
              this.status.wikilinks = false;
              this.warnOnce('wikilinks');
              return originals;
            }
          });
          this.patches.push(patch);
          this.targets.add(manager);
          this.status.wikilinks = true;
        } catch { this.warnOnce('wikilinks'); }
      }
    } else this.warnOnce('wikilinks');
  }
}
