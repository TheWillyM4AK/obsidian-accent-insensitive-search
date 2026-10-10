import { normalizeForSearch, remapMatches, type NormalizedText } from './normalization';

export interface SearchMatch {
  score: number;
  matches: Array<[number, number]>;
}
export type PrepareSearch = (query: string) => (text: string) => SearchMatch | null;

/** La caché contiene únicamente nombres en memoria y tiene un límite fijo. */
export class NormalizedMatcher {
  private readonly cache = new Map<string, NormalizedText>();

  constructor(private readonly prepare: PrepareSearch, private readonly capacity = 4096) {}

  normalize(text: string): NormalizedText {
    const cached = this.cache.get(text);
    if (cached) return cached;
    const normalized = normalizeForSearch(text);
    if (this.cache.size >= this.capacity) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(text, normalized);
    return normalized;
  }

  query(query: string): NormalizedQuery {
    const normalized = this.normalize(query);
    return new NormalizedQuery(this, this.prepare(normalized.text), normalized.text !== query);
  }

  clear(): void { this.cache.clear(); }
}

export class NormalizedQuery {
  constructor(
    private readonly owner: NormalizedMatcher,
    private readonly search: (text: string) => SearchMatch | null,
    private readonly changedQuery: boolean
  ) {}

  private match(text: string): SearchMatch | null {
    const normalized = this.owner.normalize(text);
    const match = this.search(normalized.text);
    return match ? { score: match.score, matches: remapMatches(match.matches, normalized) } : null;
  }

  changed(text: string): boolean {
    return this.changedQuery || (/[^\p{ASCII}]/u.test(text) && this.owner.normalize(text).text !== text);
  }

  alias(alias: string, force = false): SearchMatch | null {
    return force || this.changed(alias) ? this.match(alias) : null;
  }

  /** Obsidian prioriza el nombre final; la ruta completa tiene penalización de 1. */
  path(path: string, force = false): SearchMatch | null {
    if (!force && !this.changed(path)) return null;
    const offset = path.lastIndexOf('/') + 1;
    const nameMatch = this.match(path.slice(offset));
    if (nameMatch) {
      return {
        score: nameMatch.score,
        matches: nameMatch.matches.map(([start, end]) => [start + offset, end + offset])
      };
    }
    const pathMatch = this.match(path);
    return pathMatch ? { ...pathMatch, score: pathMatch.score - 1 } : null;
  }
}

export function mergeResults<T extends object>(
  originals: T[],
  additions: T[],
  key: (result: T) => string,
  score: (result: T) => number
): T[] {
  if (!additions.length) return originals;
  const merged = [...originals];
  const positions = new Map(merged.map((result, index) => [key(result), index]));
  let changed = false;
  for (const result of additions) {
    const id = key(result);
    const position = positions.get(id);
    if (position === undefined) {
      positions.set(id, merged.length);
      merged.push(result);
      changed = true;
    } else if (score(result) > score(merged[position]!)) {
      merged[position] = { ...merged[position], ...result };
      changed = true;
    }
  }
  return changed ? merged.sort((a, b) => score(b) - score(a)) : originals;
}
