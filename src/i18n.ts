export type SearchSurface = 'quickSwitcher' | 'wikilinks';

/** Obsidian language codes can include a region, for example es-MX. */
export function incompatibilityNotice(language: string, surface: SearchSurface): string {
  if (language.toLowerCase().startsWith('es')) {
    const label = surface === 'quickSwitcher' ? 'Ctrl+O' : 'las sugerencias de [[';
    return `Búsqueda sin tildes: esta versión no permite ignorar acentos en ${label}. La búsqueda nativa sigue activa.`;
  }
  const label = surface === 'quickSwitcher' ? 'Ctrl+O' : '[[ suggestions';
  return `Accent Insensitive Search: this version cannot ignore accents in ${label}. Native search remains active.`;
}
