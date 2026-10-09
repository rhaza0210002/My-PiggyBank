import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(process.cwd(), 'src');
const HARD_CODED_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;

/** Données de couleur (palette des groupes de budget, graphiques, manifeste) : hors des rôles du thème. */
const DATA_FILES = [
  'constants/budgetGroupPalette.ts',
  'constants/tableStyles.ts',
  'app/manifest.ts',
  'app/layout.tsx',
];
const DATA_DIRS = ['components/features/charts/'];

/** Fichiers pas encore migrés vers les rôles : chaque tâche de migration retire les siens. */
const PENDING_FILES: string[] = [
  'app/(app)/budget/annuel/page.tsx',
  'app/(app)/budget/mensuel/page.tsx',
  'app/(app)/compte/donnees/page.tsx',
  'app/(app)/compte/notifications/page.tsx',
  'app/(app)/compte/parametres/page.tsx',
  'app/(app)/compte/profil/page.tsx',
  'app/(app)/error.tsx',
  'app/(app)/loading.tsx',
  'app/(app)/operations/depenses-reelles/page.tsx',
  'app/(app)/operations/import/page.tsx',
  'app/(app)/operations/rapprochement/page.tsx',
  'app/(app)/tableau-de-bord/page.tsx',
  'app/(auth)/connexion/page.tsx',
  'app/(auth)/inscription/page.tsx',
  'app/(auth)/mot-de-passe-oublie/page.tsx',
  'app/(auth)/nouveau-mot-de-passe/page.tsx',
  'app/(legal)/confidentialite/page.tsx',
  'app/(legal)/cookies/page.tsx',
  'app/(legal)/layout.tsx',
  'app/(legal)/mentions-legales/page.tsx',
  'app/globals.css',
  'app/not-found.tsx',
  'components/features/forms/AuthCard.tsx',
  'components/features/forms/AuthForm.tsx',
  'components/features/forms/FormBilan.tsx',
  'components/features/forms/LabelRuleForm.tsx',
  'components/features/forms/NewCategoryForm.tsx',
  'components/features/forms/PushReminderToggle.tsx',
  'components/features/gamification/BadgeShelf.tsx',
  'components/features/gamification/MonthRecapCard.tsx',
  'components/features/gamification/MonthsStrip.tsx',
  'components/features/gamification/StartChecklist.tsx',
  'components/features/header/LogoutButton.tsx',
  'components/features/reconciliation/ReconcileCard.tsx',
  'components/features/tables/ArchiveMonthPanel.tsx',
  'components/features/tables/BudgetGroupTable.tsx',
  'components/features/tables/BudgetTableSection.tsx',
  'components/features/tables/CsvTransactionsTable.tsx',
  'components/features/tables/MonthlyBudgetComparison.tsx',
  'components/features/tables/StoredTransactionsBreakdown.tsx',
  'components/layout/AppHeader.tsx',
  'components/layout/BottomNav.tsx',
  'components/layout/Footer.tsx',
  'components/layout/OperationsSteps.tsx',
  'components/layout/SectionTabs.tsx',
  'components/layout/SkipLink.tsx',
  'components/layout/navLinkClasses.ts',
  'components/legal/LegalDocument.tsx',
  'components/ui/BalanceToggle.tsx',
  'components/ui/ProgressBar.tsx',
  'components/ui/ScreenCard.tsx',
  'components/ui/SectionStack.tsx',
  'components/ui/Tabs.tsx',
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

function hasHardCodedColor(path: string): boolean {
  let content = readFileSync(path, 'utf8');
  // Le bloc @theme est l'endroit où les rôles reçoivent leur valeur.
  if (path.endsWith('globals.css')) content = content.replace(/@theme\s*\{[\s\S]*?\n\}/, '');
  return HARD_CODED_COLOR.test(content);
}

const checked = sourceFiles(SRC)
  .map((path) => relative(SRC, path))
  .filter((file) => !DATA_FILES.includes(file) && !DATA_DIRS.some((dir) => file.startsWith(dir)));

describe('couleurs en dur', () => {
  it('aucun fichier migré ne contient de couleur hexadécimale ou rgba()', () => {
    const offenders = checked.filter((file) => !PENDING_FILES.includes(file) && hasHardCodedColor(join(SRC, file)));
    expect(offenders).toEqual([]);
  });

  it('chaque fichier encore listé « à migrer » contient bien une couleur en dur', () => {
    const stale = PENDING_FILES.filter((file) => !hasHardCodedColor(join(SRC, file)));
    expect(stale).toEqual([]);
  });
});
