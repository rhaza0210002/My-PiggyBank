import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEVICE_STORAGE } from '@/constants/deviceStorage';

/**
 * Uniquement l'essentiel sur l'appareil : tout ce que l'app garde dans le navigateur est déclaré dans
 * DEVICE_STORAGE (donc affiché sur la page Cookies), et aucun outil de suivi n'entre dans le projet.
 */
const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(SRC, path).split(sep).join('/'),
  code: readFileSync(path, 'utf8'),
}));
const declared = new Set(DEVICE_STORAGE.map((entry) => entry.name));
const storageUsers = files.filter(({ code }) => code.includes('localStorage'));

describe('stockage sur l’appareil', () => {
  it('déclare chaque clé de stockage local sur la page Cookies', () => {
    // Clés déclarées à côté du stockage, et toute chaîne « piggy-… » (préfixe des clés de l'app) où qu'elle soit.
    const keys = [
      ...storageUsers.flatMap(({ code }) => [...code.matchAll(/_KEY = '([^']+)'/g)].map((match) => match[1])),
      ...files.flatMap(({ code }) => [...code.matchAll(/'(piggy-[a-z-]+)'/g)].map((match) => match[1])),
    ];
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => !declared.has(key))).toEqual([]);
  });

  it('ne touche au stockage local que depuis des modules connus', () => {
    expect(storageUsers.map(({ path }) => path).sort()).toEqual([
      'components/features/feedback/TestFeedback.tsx',
      'components/legal/ClearDeviceStorageButton.tsx',
      'services/demoStore.ts',
      'services/importFormatMemory.ts',
      'services/personalDataService.ts',
      'utils/accessibilityPrefs.ts',
    ]);
  });

  it('n’utilise ni sessionStorage, ni IndexedDB, ni cookie écrit à la main', () => {
    const offenders = files.filter(({ code }) => /sessionStorage|indexedDB/.test(code)).map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it('n’écrit de cookie que pour la session Supabase (durée raccourcie)', () => {
    const writers = files.filter(({ code }) => /document\.cookie/.test(code)).map(({ path }) => path);
    expect(writers).toEqual(['lib/supabaseClient.ts']);
  });

  it('n’embarque aucun outil de mesure d’audience, de publicité ou de suivi d’erreurs', () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as Record<string, Record<string, string>>;
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    const trackers = /analytics|gtag|google-tag|tagmanager|posthog|plausible|matomo|mixpanel|amplitude|segment|hotjar|sentry|datadog|logrocket|clarity|speed-insights|facebook|pixel/i;
    expect(deps.filter((name) => trackers.test(name))).toEqual([]);
  });
});
