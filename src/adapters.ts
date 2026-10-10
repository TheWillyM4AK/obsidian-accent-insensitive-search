import { mergeResults, type NormalizedMatcher, type NormalizedQuery, type SearchMatch } from './matching';

export interface FileInfo {
  path: string;
  extension: string;
}
export interface LinkCandidate {
  file: FileInfo | null;
  path: string;
  alias?: string;
}
export interface NativeApp {
  vault: { getFiles(): FileInfo[] };
  metadataCache: {
    getLinkSuggestions(): LinkCandidate[];
    getFileCache(file: FileInfo): { frontmatter?: unknown } | null;
    isUserIgnored(path: string): boolean;
  };
  embedRegistry: { isExtensionRegistered(extension: string): boolean };
  viewRegistry: { isExtensionRegistered(extension: string): boolean };
}
export interface QuickContext {
  app: NativeApp;
  context: string;
  shouldShowMarkdown: boolean;
  shouldShowNonAttachments: boolean;
  shouldShowImages: boolean;
  shouldShowNonImageAttachments: boolean;
  shouldShowAllTypes: boolean;
  shouldShowAlias: boolean;
}
export interface QuickResult {
  type: string;
  file?: FileInfo;
  alias?: string;
  match: SearchMatch | null;
  downranked?: boolean;
  [key: string]: unknown;
}
export interface LinkContext {
  app: NativeApp;
  fileSuggestions: LinkCandidate[] | null;
}
export interface LinkResult {
  type: string;
  file?: FileInfo;
  path: string;
  alias?: string;
  score: number;
  matches: Array<[number, number]> | null;
  downranked?: boolean;
  [key: string]: unknown;
}
export interface Runnable { isCancelled(): boolean }
export type AliasParser = (frontmatter: unknown) => string[] | null;

/** Cede el hilo sin depender de los temporizadores ralentizados en segundo plano. */
export function yieldToMain(): Promise<void> {
  if (typeof MessageChannel !== 'function') return new Promise(resolve => window.setTimeout(resolve, 0));
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      channel.port2.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}

const images = new Set(['bmp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif']);
const decomposedEnie = /[nN]\p{M}*\u0303/u;

export function displayPath(file: FileInfo): string {
  return file.extension === 'md' ? file.path.slice(0, -3) : file.path;
}

export function fileAllowed(context: QuickContext, file: FileInfo): boolean {
  const extension = file.extension;
  if (extension === 'md') return context.shouldShowMarkdown;
  if (extension === 'canvas' || extension === 'base') return context.shouldShowNonAttachments;
  if (images.has(extension)) return context.shouldShowImages;
  const registry = context.context === 'view' ? context.app.viewRegistry : context.app.embedRegistry;
  return context.shouldShowAllTypes || (
    context.shouldShowNonImageAttachments && registry.isExtensionRegistered(extension)
  );
}

function key(result: { type: string; file?: FileInfo; alias?: string; path?: string }): string {
  return JSON.stringify([result.type, result.file?.path, result.path, result.alias]);
}

// El fuzzy nativo puede confundir n con una ñ descompuesta; se comprueba ese caso.
function keepOriginal(
  result: { type: string; file?: FileInfo; alias?: string; path?: string },
  query: string,
  matchQuery: NormalizedQuery,
  quick: boolean
): boolean {
  if (!result.file || (result.type !== 'file' && result.type !== 'alias')) return true;
  const text = result.type === 'alias' ? result.alias! : (quick ? displayPath(result.file) : result.path!);
  if (!decomposedEnie.test(query) && !decomposedEnie.test(text)) return true;
  return !!(result.type === 'alias' ? matchQuery.alias(text, true) : matchQuery.path(text, true));
}

export function extendQuickResults(
  context: QuickContext,
  query: string,
  originals: QuickResult[],
  matcher: NormalizedMatcher,
  aliases: AliasParser
): QuickResult[] {
  query = query.trim();
  if (!query) return originals;
  const matchQuery = matcher.query(query);
  const filtered = originals.filter(result => keepOriginal(result, query, matchQuery, true));
  const retained = filtered.length === originals.length ? originals : filtered;
  const additions: QuickResult[] = [];
  for (const file of context.app.vault.getFiles()) {
    if (!fileAllowed(context, file)) continue;
    const match = matchQuery.path(displayPath(file));
    const candidates = context.shouldShowAlias
      ? (aliases(context.app.metadataCache.getFileCache(file)?.frontmatter) ?? [])
      : [];
    const aliasMatches = candidates.map(alias => ({ alias, match: matchQuery.alias(alias) }));
    if (!match && !aliasMatches.some(item => item.match)) continue;
    const downranked = context.app.metadataCache.isUserIgnored(file.path);
    const penalty = downranked ? -10 : 0;
    if (match) additions.push({ type: 'file', file, match: { ...match, score: match.score + penalty }, downranked });
    for (const item of aliasMatches) {
      if (item.match) {
        additions.push({
          type: 'alias', file, alias: item.alias,
          match: { ...item.match, score: item.match.score + penalty }, downranked
        });
      }
    }
  }
  return mergeResults(retained, additions, key, result => result.match?.score ?? 0);
}

export async function extendLinkResults(
  context: LinkContext,
  runnable: Runnable,
  query: string,
  originals: LinkResult[],
  matcher: NormalizedMatcher,
  enabled: () => boolean,
  yieldTask: () => Promise<void> = yieldToMain
): Promise<LinkResult[]> {
  if (!query || !enabled() || runnable.isCancelled()) return originals;
  const matchQuery = matcher.query(query);
  const candidates = context.fileSuggestions ?? context.app.metadataCache.getLinkSuggestions();
  const additions: LinkResult[] = [];
  for (let index = 0; index < candidates.length; index++) {
    if (index > 0 && index % 128 === 0) await yieldTask();
    if (!enabled() || runnable.isCancelled()) return originals;
    const candidate = candidates[index]!;
    const file = candidate.file;
    if (!file) continue;
    const match = candidate.alias ? matchQuery.alias(candidate.alias) : matchQuery.path(candidate.path);
    if (!match) continue;
    const downranked = context.app.metadataCache.isUserIgnored(file.path);
    additions.push({
      type: candidate.alias ? 'alias' : 'file', file, path: candidate.path,
      ...(candidate.alias ? { alias: candidate.alias } : {}),
      score: match.score + (downranked ? -10 : 0), matches: match.matches, downranked
    });
  }
  if (!enabled() || runnable.isCancelled()) return originals;
  const filtered = originals.filter(result => keepOriginal(result, query, matchQuery, false));
  const retained = filtered.length === originals.length ? originals : filtered;
  return mergeResults(retained, additions, key, result => result.score);
}
