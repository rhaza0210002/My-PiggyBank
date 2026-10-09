import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_ATTRIBUTES,
  DEFAULT_PREFS,
  STORAGE_KEY,
  applyPrefs,
  noFlashScript,
  parsePrefs,
} from '@/utils/accessibilityPrefs';

function fakeRoot() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
  };
}

describe('parsePrefs', () => {
  it('ne change rien quand rien n’est enregistré ou que le texte est illisible', () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('pas du json')).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('42')).toEqual(DEFAULT_PREFS);
  });

  it('relit les options enregistrées et ignore tout le reste', () => {
    expect(parsePrefs(JSON.stringify({ police: true, calme: true, intrus: true, grand: 'oui' }))).toEqual({
      ...DEFAULT_PREFS,
      police: true,
      calme: true,
    });
  });
});

describe('applyPrefs', () => {
  it('pose un attribut par option active et retire les autres', () => {
    const root = fakeRoot();
    applyPrefs(root, { ...DEFAULT_PREFS, police: true, contraste: true });
    expect(root.attributes.get('data-police')).toBe('luciole');
    expect(root.attributes.get('data-contraste')).toBe('fort');
    expect(root.attributes.has('data-taille')).toBe(false);

    applyPrefs(root, DEFAULT_PREFS);
    expect(root.attributes.size).toBe(0);
  });
});

describe('script anti-saut', () => {
  it('relit le même stockage et pose les mêmes attributs que l’application', () => {
    const script = noFlashScript();
    expect(script).toContain(STORAGE_KEY);
    Object.values(ACCESSIBILITY_ATTRIBUTES).forEach(({ name, value }) => {
      expect(script).toContain(name);
      expect(script).toContain(value);
    });
  });
});

describe('feuille de style', () => {
  const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

  it.each(Object.values(ACCESSIBILITY_ATTRIBUTES))('a une règle pour $name="$value"', ({ name, value }) => {
    expect(css).toContain(`html[${name}='${value}']`);
  });

  it('garde Nunito par défaut et Luciole sur demande', () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-nunito\)/);
    expect(css).toMatch(/html\[data-police='luciole'\][^}]*--font-sans:\s*var\(--font-luciole\)/);
  });
});
