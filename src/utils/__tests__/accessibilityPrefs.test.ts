import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_ATTRIBUTES,
  ZOOM_ATTRIBUTE,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  clampZoom,
  loadPrefs,
  savePrefs,
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

  it('n’accepte qu’un zoom tombant sur un pas entre 100 % et 150 %', () => {
    expect(parsePrefs(JSON.stringify({ zoom: 120 })).zoom).toBe(120);
    [95, 155, 123, '120', null].forEach((zoom) => {
      expect(parsePrefs(JSON.stringify({ zoom })).zoom).toBe(ZOOM_MIN);
    });
  });
});

describe('applyPrefs', () => {
  it('pose un attribut par option active et retire les autres', () => {
    const root = fakeRoot();
    applyPrefs(root, { ...DEFAULT_PREFS, police: true, contraste: true });
    expect(root.attributes.get('data-police')).toBe('luciole');
    expect(root.attributes.get('data-contraste')).toBe('fort');
    expect(root.attributes.has('data-zoom')).toBe(false);

    applyPrefs(root, DEFAULT_PREFS);
    expect(root.attributes.size).toBe(0);
  });

  it('pose le zoom seulement au-dessus de 100 %', () => {
    const root = fakeRoot();
    applyPrefs(root, { ...DEFAULT_PREFS, zoom: 130 });
    expect(root.attributes.get(ZOOM_ATTRIBUTE)).toBe('130');
    applyPrefs(root, DEFAULT_PREFS);
    expect(root.attributes.has(ZOOM_ATTRIBUTE)).toBe(false);
  });

  it('masque le bouton accessibilité avec data-bouton, sans toucher aux autres réglages', () => {
    const root = fakeRoot();
    applyPrefs(root, { ...DEFAULT_PREFS, police: true, boutonMasque: true });
    expect(root.attributes.get('data-bouton')).toBe('masque');
    expect(root.attributes.get('data-police')).toBe('luciole');
  });

  it('borne le zoom', () => {
    expect(clampZoom(ZOOM_MIN - ZOOM_STEP)).toBe(ZOOM_MIN);
    expect(clampZoom(ZOOM_MAX + ZOOM_STEP)).toBe(ZOOM_MAX);
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

  it.each([110, 120, 130, 140, 150])('a une règle pour le zoom %i %%', (zoom) => {
    expect(css).toContain(`html[data-zoom='${zoom}'] { font-size: ${zoom}%; }`);
  });

  it('garde Nunito par défaut et Luciole sur demande', () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-nunito\)/);
    expect(css).toMatch(/html\[data-police='luciole'\][^}]*--font-sans:\s*var\(--font-luciole\)/);
  });
});

describe('loadPrefs / savePrefs', () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };

  it('relit ce qui a été enregistré, et applique les attributs', () => {
    const root = fakeRoot();
    savePrefs({ ...DEFAULT_PREFS, zoom: 140, boutonMasque: true }, root, storage);
    expect(loadPrefs(storage)).toEqual({ ...DEFAULT_PREFS, zoom: 140, boutonMasque: true });
    expect(root.attributes.get('data-bouton')).toBe('masque');
    expect(root.attributes.get('data-zoom')).toBe('140');
  });

  it('applique quand même les réglages si le stockage est refusé', () => {
    const root = fakeRoot();
    const refusing = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => savePrefs({ ...DEFAULT_PREFS, police: true }, root, refusing)).not.toThrow();
    expect(root.attributes.get('data-police')).toBe('luciole');
  });
});
