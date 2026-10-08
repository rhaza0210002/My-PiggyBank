import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AUTH_ROUTES,
  LEGACY_REDIRECTS,
  NAV_SECTIONS,
  ROUTES,
  getActiveSection,
  isCurrentPage,
} from '@/constants/routes';

/** Chemin du fichier page.tsx d'une route, dans les groupes (app) ou (auth). */
function pageExists(route: string): boolean {
  return ['(app)', '(auth)'].some((group) =>
    existsSync(join(process.cwd(), 'src/app', group, route, 'page.tsx')),
  );
}

describe('plan des chemins', () => {
  it('chaque route déclarée a une page', () => {
    Object.values(ROUTES).forEach((route) => {
      expect(pageExists(route), `page manquante pour ${route}`).toBe(true);
    });
  });

  it('les chemins sont en minuscules, en français, sans camelCase', () => {
    Object.values(ROUTES).forEach((route) => {
      expect(route).toMatch(/^\/[a-z-]+(\/[a-z-]+)*$/);
    });
  });

  it('le menu tient en quatre sections, lisibles sans menu caché', () => {
    expect(NAV_SECTIONS).toHaveLength(4);
    NAV_SECTIONS.forEach((section) => expect(section.label.length).toBeGreaterThan(0));
  });

  it('toutes les pages connectées sont accessibles depuis le menu', () => {
    const reachable = new Set(NAV_SECTIONS.flatMap((section) => [section.href, ...section.pages.map((page) => page.href)]));
    const connected = Object.values(ROUTES).filter((route) => !AUTH_ROUTES.includes(route));

    connected.forEach((route) => expect(reachable.has(route), `${route} absente du menu`).toBe(true));
  });
});

describe('redirections des anciens chemins', () => {
  it('chaque ancien chemin mène à une route existante', () => {
    const known = new Set<string>(Object.values(ROUTES));
    LEGACY_REDIRECTS.forEach(({ destination }) => expect(known.has(destination)).toBe(true));
  });

  it('aucun ancien chemin ne recouvre un nouveau', () => {
    const known = new Set<string>(Object.values(ROUTES));
    LEGACY_REDIRECTS.forEach(({ source }) => expect(known.has(source)).toBe(false));
  });

  it('couvre les onze anciennes pages', () => {
    expect(LEGACY_REDIRECTS).toHaveLength(11);
  });
});

describe('page active', () => {
  it('met en avant la section d’une sous-page', () => {
    expect(getActiveSection(ROUTES.reconciliation)?.id).toBe('operations');
    expect(getActiveSection(ROUTES.budgetAnnual)?.id).toBe('budget');
    expect(getActiveSection(ROUTES.notifications)?.id).toBe('account');
    expect(getActiveSection(ROUTES.dashboard)?.id).toBe('home');
  });

  it('ne met aucune section en avant hors de l’application', () => {
    expect(getActiveSection(ROUTES.login)).toBeUndefined();
  });

  it('ne confond pas deux chemins qui partagent un préfixe', () => {
    expect(isCurrentPage('/budget/mensuel', '/budget/mens')).toBe(false);
    expect(isCurrentPage('/budget/mensuel', '/budget/mensuel')).toBe(true);
  });
});
