import { describe, expect, it } from 'vitest';
import { safeRedirectPath } from '@/utils/safeRedirect';

describe('safeRedirectPath', () => {
  it('garde un chemin interne', () => {
    expect(safeRedirectPath('/nouveau-mot-de-passe', '/x')).toBe('/nouveau-mot-de-passe');
  });

  it('refuse les adresses externes ou ambiguës', () => {
    ['https://evil.test', '//evil.test', '/\\evil.test', 'evil', '', null, undefined].forEach((value) => {
      expect(safeRedirectPath(value, '/x')).toBe('/x');
    });
  });
});
