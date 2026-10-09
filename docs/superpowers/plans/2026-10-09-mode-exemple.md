# Mode exemple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire de « Essayer avec un exemple » un essai complet : après « Enregistrer les 8 transactions », l'exemple se retrouve dans Pointer, Dépenses réelles et Accueil, en localStorage uniquement.

**Architecture:** Un stock local (`demoStore`) garde les opérations d'exemple. `transactionService` aiguille chaque lecture/écriture d'opérations vers ce stock quand le mode exemple est actif ; catégories et budget restent les vrais. Un bandeau signale le mode et permet de le quitter.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest 5 (`environment: 'node'`, composants testés par `renderToStaticMarkup`), Tailwind 4 avec rôles de couleur.

**Spec:** `docs/superpowers/specs/2026-10-09-mode-exemple-design.md`

## Global Constraints

- Aucune requête Supabase pour les opérations tant que le mode exemple est actif (lecture comme écriture).
- Clé localStorage unique : `piggy-exemple` ; contenu illisible ou invalide = pas d'exemple, jamais d'erreur affichée.
- Textes en français, ton doux. Bandeau : « Mode exemple : ces opérations sont fictives et restent sur cet appareil. » + bouton « Quitter l'exemple ».
- Pas de couleur en dur : uniquement les rôles de `globals.css` (le test `hardcodedColors` doit rester vert).
- Accessibilité : états annoncés dans une zone `role="status"`, cibles ≥ 44 px (`min-h-11`), contour de focus conservé.
- Pointer en exemple ne crée ni pièces ni badges réels ; les notifications ignorent l'exemple ; la déconnexion efface l'exemple.
- Commits : `feat(exemple): …` ou `test(exemple): …`, terminés par la ligne `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Branche : `feat/mode-exemple` (la spec y est déjà). Tests : `yarn test`, types : `npx tsc --noEmit`, lint : `npx eslint src`.

## Review Focus

1. Le stock est vidé (autre onglet, navigateur nettoyé) pendant qu'une page de pointage est ouverte : plus d'opérations, aucun plantage, retour aux vraies données au prochain chargement.
2. Pointer puis annuler en exemple : l'opération revient à rapprocher et disparaît de l'historique de suggestions.
3. Mois : une opération du 1er du mois est comptée dans le bon mois (dates ISO, pas de décalage de fuseau).
4. Import d'un vrai fichier pendant un exemple : confirmation ; refuser garde l'exemple intact.
5. Stockage refusé (navigation privée) : « Enregistrer » en exemple affiche un message clair, rien ne casse.

---

### Task 1: Le stock local `demoStore`

**Files:**
- Create: `src/services/demoStore.ts`
- Test: `src/services/__tests__/demoStore.test.ts`

**Interfaces:**
- Produces (toutes synchrones, stockage `window.localStorage`, jamais d'exception) :
  - `DEMO_STORAGE_KEY = 'piggy-exemple'`, `DEMO_EVENT = 'piggy-exemple'`
  - `isDemoActive(): boolean`
  - `startDemo(transactions: StoredTransaction[]): boolean` — écrit le stock, renvoie `false` si le stockage est refusé
  - `endDemo(): void`
  - `readDemoTransactions(): StoredTransaction[]` — `[]` si inactif ou invalide
  - `updateDemoTransactions(mutator: (rows: StoredTransaction[]) => StoredTransaction[]): void`
  - Chaque écriture ou effacement émet `window.dispatchEvent(new Event(DEMO_EVENT))` (le bandeau s'y abonne).
- Consumes : `StoredTransaction` de `@/services/transactionService` (import de type uniquement, pour éviter un cycle d'exécution).

- [ ] **Step 1: Écrire les tests** dans `demoStore.test.ts` avec un faux `window` (`vi.stubGlobal('window', { localStorage: fake, dispatchEvent, … })`) : `startDemo` puis `isDemoActive()` vaut `true` et `readDemoTransactions()` rend les lignes ; `updateDemoTransactions` applique le mutateur et persiste ; `endDemo` remet `isDemoActive()` à `false` ; contenu `'pas du json'`, `'{"version":2}'` et `'{"version":1,"transactions":"x"}'` donnent `isDemoActive() === false` et `[]` ; un `setItem` qui lève une exception fait renvoyer `false` à `startDemo` ; l'écriture et l'effacement appellent `dispatchEvent` avec un événement de type `piggy-exemple`.
- [ ] **Step 2: Lancer** `yarn test src/services/__tests__/demoStore.test.ts` — attendu : échec « Cannot find module ».
- [ ] **Step 3: Implémenter** `demoStore.ts` selon l'interface ; format stocké `{ version: 1, transactions: StoredTransaction[] }` ; valider la forme à la lecture (version 1, tableau, chaque ligne avec `id`, `booked_on`, `amount`) et ignorer tout le reste.
- [ ] **Step 4: Relancer** le fichier de test — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(exemple): stock local des opérations d'exemple`.

---

### Task 2: Convertir l'exemple en opérations stockées

**Files:**
- Modify: `src/utils/demoStatement.ts`
- Test: `src/utils/__tests__/demoStatement.test.ts`

**Interfaces:**
- Consumes : `BankTransaction` (`@/services/csvParser`), `toIsoDate` (`@/utils/csvParsing`), `StoredTransaction`.
- Produces : `toStoredDemo(transactions: BankTransaction[]): StoredTransaction[]` — `id` `demo-<index>`, `booked_on` = `toIsoDate(date)` (les lignes à date invalide sont écartées), `label` = `rawDetail.trim()`, `amount`, `category_id` = `categoryId`, `category_key` = `categoryKey`, `type`, `reconciled_at: null`.

- [ ] **Step 1: Ajouter les tests** : à partir de `buildDemoTransactions([], new Date(2026, 9, 9))`, `toStoredDemo(...)` rend 8 lignes, la première `{ id: 'demo-0', booked_on: '2026-10-01', label: 'VIREMENT SALAIRE EXEMPLE', amount: 1850, reconciled_at: null }`, et une ligne dont `date` est `'31/02/2026'` est écartée.
- [ ] **Step 2: Lancer** `yarn test src/utils/__tests__/demoStatement.test.ts` — attendu : échec « toStoredDemo is not a function ».
- [ ] **Step 3: Implémenter** `toStoredDemo` dans `demoStatement.ts`.
- [ ] **Step 4: Relancer** — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(exemple): conversion de l'exemple en opérations stockées`.

---

### Task 3: Aiguiller `transactionService` vers le stock local

**Files:**
- Modify: `src/services/transactionService.ts`
- Test: `src/services/__tests__/transactionService.demo.test.ts`

**Interfaces:**
- Consumes : `isDemoActive`, `readDemoTransactions`, `updateDemoTransactions` (Task 1), `summarizeAmounts` et `getMonthRange` déjà présents dans le fichier.
- Produces : aucune nouvelle signature ; en mode exemple les fonctions suivantes lisent/écrivent le stock au lieu de Supabase : `getRecentTransactions`, `getTransactionsToReconcile`, `countTransactionsToReconcile`, `updateTransactionCategory`, `markTransactionsReconciled`, `unreconcileTransactions`, `getPointedLabelHistory`, `getUncategorizedTransactions`, `countUncategorizedTransactions`, `getTransactionsForMonth`, `getMonthTotals`. `getReconciliationActivity` renvoie `[]`. Tri : `booked_on` décroissant (puis ordre d'insertion), `limit` respecté. `getTransactionsForMonth` et `getMonthTotals` filtrent sur `[début, début du mois suivant[` sans repli sur les mois archivés.

- [ ] **Step 1: Écrire les tests** (`@/lib/supabaseClient` simulé par un objet dont `from` lève `Error('Supabase appelé en mode exemple')`, `@/lib/currentUser` et `@/services/archiveService` simulés pour ne rien appeler ; stock rempli avec `startDemo`) : une assertion par fonction listée — par ex. `getTransactionsToReconcile(10)` rend les 8 lignes triées du plus récent au plus ancien ; après `markTransactionsReconciled(['demo-0'])` elle en rend 7, `countTransactionsToReconcile()` vaut 7 et `getPointedLabelHistory()` contient le libellé de `demo-0` seulement s'il a une catégorie ; `unreconcileTransactions(['demo-0'])` le remet ; `updateTransactionCategory('demo-1', 'cat-1')` met `category_id` à `cat-1` et `category_key` à `null` ; `getMonthTotals(2026, 9)` somme les montants du mois ; une ligne du `2026-09-30` est exclue de `getMonthTotals(2026, 9)` et une du `2026-10-01` incluse ; `getReconciliationActivity()` vaut `[]` ; aucune de ces fonctions n'appelle `supabase.from`. Un dernier test : sans mode exemple, `getRecentTransactions(5)` appelle bien `supabase.from('transactions')` (client simulé qui renvoie `{ data: [], error: null }` via une chaîne chaînable).
- [ ] **Step 2: Lancer** `yarn test src/services/__tests__/transactionService.demo.test.ts` — attendu : échec (Supabase appelé).
- [ ] **Step 3: Implémenter** en tête de chaque fonction listée un `if (isDemoActive()) { … }` qui délègue à de petites fonctions pures locales au fichier (`demoRows()`, tri, filtre de mois) ; ne rien changer au chemin Supabase.
- [ ] **Step 4: Relancer** ce fichier puis `yarn test src/services` — attendu : tout passe, `transactionService.test.ts` existant inclus.
- [ ] **Step 5: Commit** `feat(exemple): transactionService lit et écrit le stock local en mode exemple`.

---

### Task 4: Enregistrer l'exemple depuis l'import

**Files:**
- Modify: `src/components/features/tables/CsvTransactionsTable.tsx`, `src/app/(app)/operations/import/page.tsx`, `src/utils/demoStatement.ts`
- Test: `src/components/features/tables/__tests__/CsvTransactionsTable.demo.test.tsx`, `src/app/(app)/operations/import/__tests__/page.test.tsx`

**Interfaces:**
- Consumes : `startDemo`, `isDemoActive` (Task 1), `toStoredDemo` (Task 2).
- Produces : `CsvTransactionsTable` gagne la prop `onDemoSaved?: () => void` ; en exemple, « Enregistrer les N transactions » est actif, appelle `startDemo(toStoredDemo(transactions))` (au lieu de `saveImportedTransactions`) puis `onDemoSaved?.()` et affiche « N transactions d'exemple enregistrées sur cet appareil. » dans la zone `role="status"` existante ; si `startDemo` renvoie `false` : « Ton navigateur bloque le stockage local : l'exemple n'est pas disponible ici. » dans l'alerte d'erreur. « Enregistrer les libellés reconnus » reste désactivé en exemple, avec le texte « Désactivé en exemple : il écrirait des règles dans ton vrai compte. ». La note d'exemple devient « 🧪 Exemple : ces opérations restent sur cet appareil. Enregistre-les pour les retrouver dans Pointer. ». La page affiche le lien « Pointer les opérations → » dès que `!isDemo || demoSaved`.

- [ ] **Step 1: Écrire les tests** : rendu statique de `CsvTransactionsTable` avec `isDemo` — le bouton « Enregistrer les 8 transactions » n'a pas `disabled`, le bouton des libellés l'a, les deux nouveaux textes sont présents ; page d'import : le lien « Pointer les opérations » est absent à l'état initial (déjà couvert) ; une fonction pure `shouldConfirmReplaceDemo(demoActive: boolean, isDemoPreview: boolean): boolean`, exportée de `src/utils/demoStatement.ts` (jamais de la page : Next n'autorise pas d'export libre dans `page.tsx`), vaut `true` seulement pour un vrai fichier (`isDemoPreview === false`) pendant un exemple actif ; son test va dans `src/utils/__tests__/demoStatement.test.ts`.
- [ ] **Step 2: Lancer** les deux fichiers — attendu : échecs sur les nouveaux textes/attributs.
- [ ] **Step 3: Implémenter** : dans `handleSaveTransactions` brancher `isDemo` ; dans `page.tsx`, état `demoSaved` (remis à `false` quand on lit un fichier ou relance l'exemple), `onDemoSaved={() => setDemoSaved(true)}`, et dans `handleFileUpload` : si `shouldConfirmReplaceDemo(isDemoActive(), false)`, `window.confirm('Ton exemple sera effacé. Continuer ?')` ; refus = annuler la lecture sans toucher au stock ; acceptation = `endDemo()` puis lecture normale.
- [ ] **Step 4: Relancer** les deux fichiers puis `yarn test` — attendu : tout passe.
- [ ] **Step 5: Commit** `feat(exemple): Enregistrer en exemple range les opérations sur l'appareil`.

---

### Task 5: Bandeau, déconnexion, rappels et récompenses

**Files:**
- Create: `src/components/layout/DemoBanner.tsx`
- Modify: `src/app/(app)/layout.tsx`, `src/services/personalDataService.ts` (`clearLocalPersonalData`), `src/services/notificationService.ts` (`getNotifications`)
- Test: `src/components/layout/__tests__/DemoBanner.test.tsx`, `src/services/__tests__/notificationService.demo.test.ts`, test de `clearLocalPersonalData` (ajouté à un fichier de test existant du service ou nouveau `personalDataService.demo.test.ts`)

**Interfaces:**
- Consumes : `isDemoActive`, `endDemo`, `DEMO_EVENT` (Task 1), `ROUTES.import`.
- Produces : `DemoBanner` (composant client) — rend `null` tant que le mode n'est pas actif (état lu après montage, abonné à `DEMO_EVENT`) ; actif : un `<aside role="status">` avec le texte du bandeau et un bouton `min-h-11` « Quitter l'exemple » qui appelle `endDemo()` puis `window.location.assign(ROUTES.import)`. Le texte du bandeau est exporté : `DEMO_BANNER_TEXT`. `getNotifications` renvoie `[]` en mode exemple sans appeler le moindre service. `clearLocalPersonalData()` appelle `endDemo()`.

- [ ] **Step 1: Écrire les tests** : rendu statique de `DemoBanner` ne contient rien (état initial inactif) ; `DEMO_BANNER_TEXT` vaut « Mode exemple : ces opérations sont fictives et restent sur cet appareil. » ; avec `startDemo` appelé puis `getNotifications(settings)` (services de données simulés qui lèvent s'ils sont appelés) → `[]` ; avec `startDemo` appelé puis `clearLocalPersonalData()`, `isDemoActive()` vaut `false`.
- [ ] **Step 2: Lancer** ces fichiers — attendu : échecs.
- [ ] **Step 3: Implémenter** le composant (rôles de couleur `bg-attention-fond text-attention`, bouton conforme au design system), l'ajouter dans `AppLayout` juste avant `{children}` dans `<main>`, brancher `endDemo()` dans `clearLocalPersonalData`, et le court-circuit dans `getNotifications`.
- [ ] **Step 4: Relancer** puis `yarn test`, `npx tsc --noEmit`, `npx eslint src` — attendu : tout vert (dont `hardcodedColors`).
- [ ] **Step 5: Commit** `feat(exemple): bandeau, sortie à la déconnexion, pas de rappels pour l'exemple`.

---

### Task 6: Vérification de bout en bout et PR

**Files:**
- Create (hors dépôt, scratchpad) : script Playwright `exemple.mjs`

- [ ] **Step 1: Parcours navigateur** (compte de test existant) : Import → « Essayer avec un exemple » → « Enregistrer les 8 transactions » → lien « Pointer les opérations → » → pointer une opération → Dépenses réelles montre les opérations → bandeau visible partout → « Quitter l'exemple » → retour à l'import vide. Attendu : chaque étape passe, bandeau présent sur Pointer, Dépenses réelles et Accueil.
- [ ] **Step 2: Contrôle réseau** : pendant tout le parcours en exemple, aucune requête vers `/rest/v1/transactions` (écoute `page.on('request')`). Attendu : zéro.
- [ ] **Step 3: Axe** (WCAG 2.2 AA) sur Import, Pointer et Accueil en mode exemple, mobile et ordinateur. Attendu : aucune violation.
- [ ] **Step 4: Pousser** `feat/mode-exemple` et ouvrir la PR vers `main` (corps terminé par la ligne « 🤖 Generated with [Claude Code](https://claude.com/claude-code) »), attendre la CI verte.
- [ ] **Step 5: Commit** du plan et de la spec s'ils ont bougé : `docs: plan du mode exemple`.
