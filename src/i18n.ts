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

export function nativeSupportNotice(language: string): string {
  if (language.toLowerCase().startsWith('es')) {
    return 'Búsqueda sin tildes: Obsidian 1.15 ya ignora los acentos de forma nativa. El plugin queda inactivo y puedes desinstalarlo.';
  }
  return 'Accent Insensitive Search: Obsidian 1.15 now ignores accents natively. The plugin stays inactive, and you can uninstall it.';
}
