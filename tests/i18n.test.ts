import { describe, expect, it } from 'vitest';
import { incompatibilityNotice, type SearchSurface } from '../src/i18n';

describe('compatibility notice language', () => {
  it.each(['es', 'es-MX', 'es-ES', 'ES'])('uses Spanish for %s', language => {
    expect(incompatibilityNotice(language, 'quickSwitcher')).toBe(
      'Búsqueda sin tildes: esta versión no permite ignorar acentos en Ctrl+O. La búsqueda nativa sigue activa.'
    );
    expect(incompatibilityNotice(language, 'wikilinks')).toBe(
      'Búsqueda sin tildes: esta versión no permite ignorar acentos en las sugerencias de [[. La búsqueda nativa sigue activa.'
    );
  });

  it.each(['en', 'en-GB', 'fr', ''])('uses English for %s', language => {
    expect(incompatibilityNotice(language, 'quickSwitcher')).toBe(
      'Accent Insensitive Search: this version cannot ignore accents in Ctrl+O. Native search remains active.'
    );
    expect(incompatibilityNotice(language, 'wikilinks')).toBe(
      'Accent Insensitive Search: this version cannot ignore accents in [[ suggestions. Native search remains active.'
    );
  });

  it.each<SearchSurface>(['quickSwitcher', 'wikilinks'])('identifies the affected surface: %s', surface => {
    expect(incompatibilityNotice('es', surface)).toContain(surface === 'quickSwitcher' ? 'Ctrl+O' : '[[');
    expect(incompatibilityNotice('en', surface)).toContain(surface === 'quickSwitcher' ? 'Ctrl+O' : '[[');
  });
});
