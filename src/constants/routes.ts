/**
 * Plan des chemins de l'application. Source unique pour le menu, les redirections, le proxy et les liens.
 *
 *  - Accueil     /tableau-de-bord
 *  - Budget      /budget/mensuel · /budget/annuel
 *  - Opérations  /operations/depenses-reelles · /operations/rapprochement · /operations/import
 *  - Compte      /compte/profil · /compte/parametres · /compte/notifications
 *  - Connexion   /connexion · /inscription (pages publiques)
 */
export const ROUTES = {
  login: '/connexion',
  register: '/inscription',
  dashboard: '/tableau-de-bord',
  budgetMonthly: '/budget/mensuel',
  budgetAnnual: '/budget/annuel',
  actualExpenses: '/operations/depenses-reelles',
  reconciliation: '/operations/rapprochement',
  import: '/operations/import',
  profile: '/compte/profil',
  settings: '/compte/parametres',
  notifications: '/compte/notifications',
} as const;

export const AUTH_ROUTES: readonly string[] = [ROUTES.login, ROUTES.register];

export interface NavPage {
  label: string;
  href: string;
}

export interface NavSection {
  id: 'home' | 'budget' | 'operations' | 'account';
  label: string;
  /** Emoji décoratif : le libellé texte reste toujours visible à côté. */
  icon: string;
  href: string;
  /** Sous-pages de la section ; vide quand la section n'a qu'une page. */
  pages: readonly NavPage[];
}

/** Quatre sections au maximum : lisible dans une barre mobile sans menu caché. */
export const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'home', label: 'Accueil', icon: '🏠', href: ROUTES.dashboard, pages: [] },
  {
    id: 'budget',
    label: 'Budget',
    icon: '📊',
    href: ROUTES.budgetMonthly,
    pages: [
      { label: 'Mensuel', href: ROUTES.budgetMonthly },
      { label: 'Annuel', href: ROUTES.budgetAnnual },
    ],
  },
  {
    id: 'operations',
    label: 'Opérations',
    icon: '🪙',
    href: ROUTES.actualExpenses,
    pages: [
      { label: 'Dépenses réelles', href: ROUTES.actualExpenses },
      { label: 'Rapprochement', href: ROUTES.reconciliation },
      { label: 'Importer un relevé', href: ROUTES.import },
    ],
  },
  {
    id: 'account',
    label: 'Compte',
    icon: '👤',
    href: ROUTES.profile,
    pages: [
      { label: 'Profil', href: ROUTES.profile },
      { label: 'Paramètres', href: ROUTES.settings },
      { label: 'Notifications', href: ROUTES.notifications },
    ],
  },
];

/** Anciens chemins, redirigés vers les nouveaux pour ne casser ni favoris ni liens partagés. */
export const LEGACY_REDIRECTS: ReadonlyArray<{ source: string; destination: string }> = [
  { source: '/login', destination: ROUTES.login },
  { source: '/register', destination: ROUTES.register },
  { source: '/dashboard', destination: ROUTES.dashboard },
  { source: '/budgetmensual', destination: ROUTES.budgetMonthly },
  { source: '/budgetannual', destination: ROUTES.budgetAnnual },
  { source: '/depense-reelle', destination: ROUTES.actualExpenses },
  { source: '/rapprochement', destination: ROUTES.reconciliation },
  { source: '/csvUploader', destination: ROUTES.import },
  { source: '/profile', destination: ROUTES.profile },
  { source: '/settings', destination: ROUTES.settings },
  { source: '/notifications', destination: ROUTES.notifications },
];

function matchesPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Section à mettre en avant dans le menu pour un chemin donné. */
export function getActiveSection(pathname: string): NavSection | undefined {
  return NAV_SECTIONS.find(
    (section) =>
      matchesPath(pathname, section.href) || section.pages.some((page) => matchesPath(pathname, page.href)),
  );
}

export function isCurrentPage(pathname: string, href: string): boolean {
  return matchesPath(pathname, href);
}
