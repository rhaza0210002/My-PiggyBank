# Design system « tirelire » Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centraliser le style du site en rôles nommés, factoriser les composants communs, repeindre en palette « vert en vedette », puis ajouter une tirelire dont une pièce tombe à chaque pointage.

**Architecture:** Un bloc `@theme` Tailwind 4 dans `src/app/globals.css` est l'unique source des couleurs, arrondis et ombres. Un test lit ce fichier pour vérifier les contrastes et un second test interdit les couleurs en dur (liste « à migrer » qui rétrécit). La tirelire est un composant SVG + CSS pur, alimenté par un compteur « pointés aujourd'hui » dérivé de `reconciled_at` (aucune donnée nouvelle).

**Tech Stack:** Next.js 16.3.8 (App Router), React 19, Tailwind 4, Vitest 5 (`environment: 'node'`, tests de composants via `renderToStaticMarkup`), yarn.

**Spec:** `docs/superpowers/specs/2026-10-08-design-system-tirelire-design.md`

## Global Constraints

- Lire `node_modules/next/dist/docs/` avant tout code Next (AGENTS.md : cette version a des changements cassants).
- UI en français, ton doux, « rien ne se perd » ; aucune série à ne pas casser, aucun classement, pas de rouge vif.
- La couleur n'est jamais seule : icône (✓ ● ▲ 🪙) ou mot avec chaque état.
- Contraste texte ≥ 4,5:1, contrôles ≥ 3:1 ; zones tactiles ≥ 44 px ; texte courant ≥ 16 px.
- Animations ≤ 0,5 s (`--duree-pointage`, `--duree-niveau`), jamais en boucle (sauf le clignement du cochon) ; `prefers-reduced-motion` supprime tout mouvement sans perdre d'information.
- Aucune couleur hexadécimale dans les composants (sauf fichiers de données listés en Task 2).
- Une PR par étape (5 PR, voir « Découpage »), chacune livrable seule ; `yarn lint && yarn typecheck && yarn test && yarn build` verts avant chaque PR.
- Aucune nouvelle table ni donnée bancaire.

## Review Focus

- **Changement de jour / fuseau** : un pointage à 00 h 30 heure de Paris compte pour le nouveau jour local (pas pour la veille UTC) (Task 9, `countPointedOn`).
- **Plus de pointages que l'objectif** : le niveau est plafonné à 1, jamais > 100 % ni négatif (Task 9, `tirelireLevel`).
- **Annulation d'un pointage** : le niveau redescend, aucune pièce ne tombe (Task 9, compteur de déclenchement).
- **Mouvement réduit** : le message « +1 pièce » et le texte « 3 sur 10 » restent affichés, sans classe d'animation active (Task 10).
- **État vide** : plus d'opération à pointer, la tirelire du jour s'affiche quand même, sans erreur (Task 11).

---

## File Structure

- `src/app/globals.css` — `@theme` (couleurs, arrondis, ombres), durées, keyframes de la tirelire.
- `src/utils/contrast.ts` — `contrastRatio(a, b)` (pur).
- `src/utils/__tests__/theme.test.ts` — lit `globals.css`, vérifie les paires de contraste.
- `src/utils/__tests__/hardcodedColors.test.ts` — interdit les hex dans `src/` hors liste « à migrer » et fichiers de données.
- `src/components/ui/{Button,Card,Field,Badge,Gauge}.tsx` (+ tests) — briques communes.
- `src/components/features/gamification/Tirelire.tsx` — dessin + animation.
- `src/utils/tirelire.ts` — `tirelireLevel`, `DAILY_GOAL`.
- `src/utils/gamification.ts` — `countPointedOn`, champ `pointedToday`.

## Valeurs des rôles

Phase 1 reprend l'existant (aucun changement visible) ; phase 3 passe aux valeurs finales (colonne 3, déjà validée : tous les contrastes listés ≥ seuil).

| Rôle (`--color-…`) | Phase 1 (actuel) | Phase 3 (final) |
|---|---|---|
| `fond` | `#ebcfc6` | `#f2fbea` |
| `surface` | `#fff8f2` | `#ffffff` |
| `surface-douce` | `#f2e6d8` | `#e1f5d3` |
| `bordure` | `#d8b6a5` | `#cfeebd` |
| `bordure-forte` (champs, boutons secondaires) | `#a3452a` | `#6f9a5a` |
| `texte` | `#5b473d` | `#2f3d2a` |
| `texte-doux` | `#6b574c` | `#5c6e55` |
| `accent` | `#e59a86` | `#8fd36f` |
| `accent-fort` | `#a3452a` | `#2f7a3a` |
| `accent-doux` | `#f8d5cb` | `#d8f2c8` |
| `ok` / `ok-fond` | `#1f4d25` / `#eaf4e6` | `#2f6b2a` / `#d8f2c8` |
| `attention` / `attention-fond` | `#5a3d10` / `#fff1da` | `#7a5b00` / `#fff0b8` |
| `depasse` / `depasse-fond` | valeurs de l'existant pour « dépassé » (grep `dépass`) | `#a8431f` / `#ffe3d8` |
| `piece` / `piece-bord` | `#d6a85c` / `#d6a85c` | `#ffe066` / `#e0b020` |
| `cochon` / `cochon-bord` | `#f8d5cb` / `#d8b6a5` | `#ffc7d6` / `#ff8aa9` |
| `focus` | `#5b473d` | `#2f3d2a` |

Écart avec la spec : le rôle `bordure-forte` est ajouté (une bordure `bordure` sur fond blanc ne peut pas atteindre 3:1 ; les champs et boutons secondaires utilisent `bordure-forte`).

Arrondis : `--radius-petit: 0.75rem`, `--radius-carte: 1.5rem`, `--radius-bonbon: 9999px` (classes `rounded-petit|carte|bonbon`). Ombres : `--shadow-bonbon: 0 3px 0 rgba(0,0,0,.22)`, `--shadow-doux: 0 6px 18px rgba(0,0,0,.08)`.

---

## PR 1 — Réglages centraux (aspect inchangé)

### Task 1: Rôles de couleur, arrondis, ombres et test de contraste

**Files:**
- Create: `src/utils/contrast.ts`, `src/utils/__tests__/theme.test.ts`
- Modify: `src/app/globals.css` (bloc `@theme`, `:root`, `body`, `:focus-visible`)

**Interfaces:**
- Produces: `contrastRatio(foreground: string, background: string): number` (hex `#rrggbb`) ; classes Tailwind `bg-fond|surface|surface-douce|accent|accent-doux|ok-fond|attention-fond|depasse-fond|piece|cochon`, `text-texte|texte-doux|accent-fort|ok|attention|depasse`, `border-bordure|bordure-forte|cochon-bord|piece-bord`, `rounded-petit|carte|bonbon`, `shadow-bonbon|doux` ; variables `--duree-pointage: 0.5s`, `--duree-niveau: 0.5s`.

- [ ] **Step 1: Write the failing test** `theme.test.ts` : lit `src/app/globals.css`, extrait `--color-<nom>: #hex` du bloc `@theme`, et vérifie :
  - tous les rôles du tableau ci-dessus existent (liste `REQUIRED_ROLES`) ;
  - `contrastRatio` ≥ 4,5 pour `texte/fond`, `texte/surface`, `texte-doux/fond`, `texte-doux/surface`, `accent-fort/fond`, `accent-fort/surface`, `texte/accent`, `ok/ok-fond`, `attention/attention-fond`, `depasse/depasse-fond` ;
  - ≥ 3 pour `bordure-forte/surface` et `focus/fond`.
  - un test unitaire de `contrastRatio('#000000','#ffffff')` = 21 et `('#777777','#777777')` = 1.
- [ ] **Step 2: Run** `yarn test src/utils/__tests__/theme.test.ts` — Expected: FAIL (module/rôles absents).
- [ ] **Step 3: Implement** `contrastRatio` (luminance relative WCAG 2.x) dans `src/utils/contrast.ts`, puis le bloc `@theme` de `globals.css` avec les **valeurs de la phase 1**. Remplacer `--background/--foreground` par les rôles ; `body` utilise `var(--color-fond)`/`var(--color-texte)` ; `:focus-visible` utilise `var(--color-focus)`. Si une paire phase 1 échoue au seuil, assombrir légèrement la valeur *dans la phase 1 uniquement* et le noter en commentaire.
- [ ] **Step 4: Run** le test + `yarn typecheck` — Expected: PASS.
- [ ] **Step 5: Commit** `feat(style): rôles de couleur, arrondis et ombres centralisés (valeurs actuelles)`.

### Task 2: Garde-fou contre les couleurs en dur

**Files:**
- Create: `src/utils/__tests__/hardcodedColors.test.ts`

**Interfaces:**
- Produces: `PENDING_FILES: string[]` (dans le test) — liste des fichiers pas encore migrés ; chaque tâche de migration en retire ses fichiers. `DATA_FILES` : `src/constants/budgetGroupPalette.ts`, `src/constants/tableStyles.ts`, `src/app/manifest.ts`, `src/app/layout.tsx` (couleur du `viewport`), `src/components/features/charts/*` (couleurs de données des graphiques).

- [ ] **Step 1: Write the failing test** : parcourt `src/**/*.{ts,tsx,css}` ; pour chaque fichier hors `DATA_FILES`, `PENDING_FILES`, tests et le bloc `@theme` de `globals.css`, échoue s'il contient `#[0-9a-fA-F]{3,8}` ou `rgba?(`. Un second test échoue si un fichier de `PENDING_FILES` n'a plus de couleur en dur (pour forcer à le retirer de la liste).
- [ ] **Step 2: Génère `PENDING_FILES`** avec `grep -rlE '#[0-9a-fA-F]{3,6}' src` moins `DATA_FILES` (≈ 55 fichiers) puis lance `yarn test src/utils/__tests__/hardcodedColors.test.ts` — Expected: PASS (liste complète).
- [ ] **Step 3: Commit** `test(style): interdire les nouvelles couleurs en dur`.

### Task 3: Arrondis et ombres

**Files:** Modify: les 44 usages `rounded-[…]` et les `shadow-[…]` répétés (`grep -rnE 'rounded-\[|shadow-\[' src`).

**Interfaces:** Consumes: `rounded-petit|carte|bonbon`, `shadow-bonbon|doux` (Task 1).

- [ ] **Step 1:** Associer chaque valeur arbitraire au rôle le plus proche (≤ 0,9 rem → `petit` ; 1–2,2 rem → `carte` ; `full`/boutons pilules → `bonbon`). Règle : un seul rôle par usage, sans changer la mise en page.
- [ ] **Step 2:** `yarn lint && yarn typecheck && yarn test && yarn build` — Expected: tout vert.
- [ ] **Step 3: Commit** `refactor(style): arrondis et ombres par rôle`.

### Task 4: Migrer les couleurs de `ui/` et `layout/`

**Files:** Modify: `src/components/ui/*.tsx`, `src/components/layout/*`, `src/components/features/header/LogoutButton.tsx`, `src/app/globals.css` (reste hors `@theme`), `src/app/not-found.tsx`, `src/app/(app)/loading.tsx`, `src/app/(app)/error.tsx` ; retirer ces fichiers de `PENDING_FILES`.

**Interfaces:** Consumes: classes de rôle (Task 1).

- [ ] **Step 1:** Remplacer chaque hex par le rôle de même valeur de phase 1 (`#6b574c` → `text-texte-doux`, `#d8b6a5` → `border-bordure`, `#a3452a` → `text-accent-fort`/`bg-accent-fort` selon l'usage, etc.). Pour un hex sans rôle, choisir le rôle le plus proche de même fonction (fond/texte/bordure) ; ne jamais créer de rôle.
- [ ] **Step 2:** `yarn test` (le test « liste à migrer » exige de retirer les fichiers migrés) puis ouvrir le site (`yarn dev`) sur connexion, tableau de bord, rapprochement : aucune différence visible.
- [ ] **Step 3: Commit** `refactor(style): couleurs par rôle dans ui, layout, pages d'erreur`.

### Task 5: Migrer les écrans, par lots

**Files:** Modify (3 commits, un par lot, chaque lot retire ses fichiers de `PENDING_FILES`) :
- Lot A : `src/app/(app)/operations/**`, `src/components/features/reconciliation/**`, `src/components/features/tables/**`
- Lot B : `src/app/(app)/tableau-de-bord/**`, `src/app/(app)/budget/**`, `src/components/features/gamification/**`
- Lot C : tout le reste (forms, auth, legal, compte, `FormBilan`, `PushReminderToggle`…)

- [ ] **Step 1 (par lot):** même règle qu'en Task 4.
- [ ] **Step 2 (par lot):** `yarn lint && yarn typecheck && yarn test` ; vérification visuelle de l'écran principal du lot.
- [ ] **Step 3 (fin du dernier lot):** `PENDING_FILES` doit être vide ; supprimer la constante et le second test, garder le premier. `yarn build` vert.
- [ ] **Step 4: Commit** `refactor(style): couleurs par rôle dans les écrans (lot X)` ; ouvrir la **PR 1**.

---

## PR 2 — Composants communs

### Task 6: Briques `Button`, `Card`, `Field`, `Badge`, `Gauge`

**Files:**
- Create: `src/components/ui/{Button,Card,Field,Badge,Gauge}.tsx`, `src/components/ui/__tests__/{Button,Card,Field,Badge,Gauge}.test.tsx`
- Modify: `ScreenCard.tsx` (utilise `Card`), `ProgressBar.tsx` (devient un alias de `Gauge`, supprimé une fois les usages migrés)

**Interfaces (Produces):**
- `Button({ variant?: 'principal' | 'secondaire' | 'lien' | 'doux' , disabled?, ...ButtonHTMLAttributes })` : `min-h-11`, `rounded-bonbon`, `shadow-bonbon` pour `principal`, fond `accent`, texte `texte`.
- `Card({ children, as?: 'section' | 'div', className? })` : `bg-surface border-2 border-bordure rounded-carte`.
- `Field({ label: string, hint?: string, error?: string, children: (props: { id: string; 'aria-describedby': string | undefined }) => ReactNode })` : étiquette liée par `htmlFor`, aide et erreur reliées par `aria-describedby`, bordure `bordure-forte`.
- `Badge({ tone: 'ok' | 'attention' | 'depasse' | 'piece', children })` : préfixe l'icône `✓`, `●`, `▲`, `🪙` (`aria-hidden`) ; le texte reste obligatoire.
- `Gauge({ value, max, label, valueText? })` : mêmes `role="progressbar"` et attributs aria que `ProgressBar` actuel, fond `surface-douce`, remplissage `accent`.

- [ ] **Step 1: Write the failing tests** (`renderToStaticMarkup`) : chaque variante de `Button` contient `min-h-11` ; `Button disabled` rend l'attribut `disabled` ; `Field` relie `label for` ↔ `id` et `aria-describedby` vers l'aide puis l'erreur ; `Badge tone="depasse"` contient `▲` et le texte passé ; `Gauge value={3} max={10}` contient `aria-valuenow="3"`, `aria-valuemax="10"` et une largeur `30%` ; `Gauge max={0}` ne plante pas et rend `0%`.
- [ ] **Step 2: Run** `yarn test src/components/ui` — Expected: FAIL.
- [ ] **Step 3: Implement** les cinq composants avec les signatures ci-dessus (classes de rôles uniquement, aucun hex).
- [ ] **Step 4: Run** les tests — Expected: PASS.
- [ ] **Step 5: Commit** `feat(ui): bouton, carte, champ, badge et jauge communs`.

### Task 7: Adopter les briques sur les écrans les plus utilisés

**Files:** Modify: `src/app/(app)/operations/rapprochement/page.tsx`, `src/components/features/reconciliation/ReconcileCard.tsx`, `src/app/(app)/tableau-de-bord/page.tsx`, `src/app/(app)/budget/mensuel/page.tsx`, `src/app/(app)/budget/annuel/page.tsx`, `src/components/features/forms/AuthForm.tsx`.

**Interfaces:** Consumes: `Button`, `Card`, `Field`, `Badge`, `Gauge` (Task 6).

- [ ] **Step 1:** Remplacer les boutons, cartes, champs, pastilles et barres de progression écrits à la main par les briques (comportements et textes inchangés). Un seul `Button variant="principal"` visible par écran ; les autres en `secondaire`/`lien`.
- [ ] **Step 2:** `yarn lint && yarn typecheck && yarn test && yarn build` ; supprimer `ProgressBar.tsx` quand il n'a plus d'usage.
- [ ] **Step 3: Commit** `refactor(ui): adopter les composants communs sur pointage, tableau de bord, budget, connexion` ; ouvrir la **PR 2**.

---

## PR 3 — Repeinte

### Task 8: Passer à la palette « vert en vedette »

**Files:** Modify: `src/app/globals.css` (valeurs de la colonne « Phase 3 »), `src/app/manifest.ts` (`background_color: '#f2fbea'`, `theme_color: '#8fd36f'`), `src/app/layout.tsx` (`viewport.themeColor: '#8fd36f'`).

- [ ] **Step 1:** Remplacer les valeurs du bloc `@theme` par la colonne « Phase 3 ». `yarn test src/utils/__tests__/theme.test.ts` doit passer ; sinon assombrir la valeur fautive (texte vert ou jaune) jusqu'au seuil et le noter dans la PR.
- [ ] **Step 2:** Vérifier au navigateur (mobile 390 px et ordinateur) connexion, tableau de bord, rapprochement, budget : lisibilité, états `disabled`, badges avec icône. Corriger tout reste de teinte brune codé via une classe non migrée.
- [ ] **Step 3:** Lancer axe sur ces quatre écrans — Expected: 0 violation `color-contrast`.
- [ ] **Step 4: Commit** `feat(style): palette vert en vedette (corail pour « à regarder », jaune pour les pièces)` ; ouvrir la **PR 3** avec captures avant/après.

---

## PR 4 — Tirelire et pièce animée

### Task 9: Compteur du jour et niveau de la tirelire

**Files:**
- Modify: `src/utils/gamification.ts` (+ `src/utils/__tests__/gamification.test.ts`)
- Create: `src/utils/tirelire.ts`, `src/utils/__tests__/tirelire.test.ts`

**Interfaces:**
- Produces: `countPointedOn(rows: readonly ActivityRow[], day: Date): number` — nombre de lignes dont `reconciled_at` tombe le même jour *local* que `day` ; `Gamification.pointedToday: number` (calculé avec `now`) ; `DAILY_GOAL = 10` ; `tirelireLevel(pointed: number, goal?: number): number` ∈ [0, 1].

- [ ] **Step 1: Write the failing tests** :
  - `countPointedOn` compte 2 lignes pointées le jour de `day`, ignore `reconciled_at: null` et une ligne pointée la veille ;
  - une ligne pointée `2026-10-08T22:30:00Z` (00 h 30 le 9 à Paris) compte pour le **9 octobre** et pas pour le 8, avec `process.env.TZ = 'Europe/Paris'` fixé dans le test ;
  - `computeGamification(rows, now).pointedToday` reprend ce compte ;
  - `tirelireLevel(0)` = 0, `(3)` = 0.3, `(10)` = 1, `(25)` = 1, `(-2)` = 0, `(3, 0)` = 0 (objectif nul : pas de division par zéro).
- [ ] **Step 2: Run** `yarn test src/utils` — Expected: FAIL.
- [ ] **Step 3: Implement** les signatures ci-dessus (réutiliser `localDayKey` existant dans `gamification.ts`).
- [ ] **Step 4: Run** les tests — Expected: PASS.
- [ ] **Step 5: Commit** `feat(tirelire): compteur du jour et niveau`.

### Task 10: Composant `Tirelire`

**Files:**
- Create: `src/components/features/gamification/Tirelire.tsx`, `src/components/features/gamification/__tests__/Tirelire.test.tsx`
- Modify: `src/app/globals.css` (keyframes `coin-drop`, `pig-bounce`, `pig-blink`, classes `.tirelire-coin`, `.tirelire-pig`, `.tirelire-fill` ; durées via `--duree-pointage`/`--duree-niveau`)

**Interfaces:**
- Consumes: `tirelireLevel`, `DAILY_GOAL` (Task 9) ; rôles `cochon`, `cochon-bord`, `piece`, `piece-bord`.
- Produces: `Tirelire({ pointed: number; goal?: number; tick: number })` — `tick` change à chaque pointage (pas à une annulation) et rejoue l'animation en changeant la `key` de la pièce.

- [ ] **Step 1: Write the failing tests** (`renderToStaticMarkup`) :
  - affiche le texte « 3 sur 10 » pour `pointed={3}` et le rôle `img` avec `aria-label` « Tirelire du jour : 3 sur 10 » ;
  - `pointed={25}` n'affiche jamais plus de 100 % de remplissage (attribut `data-niveau="1"`) ;
  - `tick={0}` ne rend aucune pièce animée ; `tick={1}` rend un élément `.tirelire-coin` ;
  - le message `role="status"` « +1 pièce » est présent pour `tick={1}` ; `pointed={10}` affiche « Tirelire pleine pour aujourd’hui, bravo ! » ;
  - le dessin n'utilise aucun hex (couleurs via `var(--color-…)`/classes).
- [ ] **Step 2: Run** `yarn test src/components/features/gamification` — Expected: FAIL.
- [ ] **Step 3: Implement** `Tirelire` : SVG simple en aplats (corps ovale, oreille dressée + oreille du fond, fente, œil, groin à deux narines, deux pattes, queue), niveau en rectangle `piece` clippé dans le corps, `data-niveau`. Dessin de référence : `.superpowers/brainstorm/5649-1791482424/content/cochon-mignon2.html` (le reprendre sans les dégradés ; ne pas committer `.superpowers/`). CSS pur, animations ≤ 0,5 s ; dans `@media (prefers-reduced-motion: reduce)` la pièce n'est pas animée et le niveau change sans transition (le texte reste).
- [ ] **Step 4: Run** les tests — Expected: PASS.
- [ ] **Step 5: Commit** `feat(tirelire): cochon, pièce animée et niveau du jour`.

### Task 11: Intégrer la tirelire à l'écran de pointage

**Files:** Modify: `src/app/(app)/operations/rapprochement/page.tsx` (+ test d'intégration léger dans `src/app/__tests__/` si le dossier existe, sinon vérification navigateur).

**Interfaces:** Consumes: `Tirelire`, `progress.pointedToday`.

- [ ] **Step 1:** Ajouter l'état `pointingTick` (incrémenté dans `reconcile`, **pas** dans `undoLastPointing`) et afficher `<Tirelire pointed={progress?.pointedToday ?? 0} tick={pointingTick} />` en tête de l'écran, y compris quand il n'y a plus d'opération à pointer. Remplacer la barre du mois par la jauge du mois (`Gauge`), la tirelire étant la jauge du jour.
- [ ] **Step 2:** Vérifier au navigateur avec le compte de test : pointer une opération → la pièce tombe, le niveau monte ; annuler → le niveau redescend sans pièce ; avec « réduire les mouvements » (émulation navigateur) → aucune animation, texte à jour ; liste vide → tirelire visible.
- [ ] **Step 3:** `yarn lint && yarn typecheck && yarn test && yarn build`.
- [ ] **Step 4: Commit** `feat(pointage): tirelire du jour sur l'écran de pointage` ; ouvrir la **PR 4**.

---

## PR 5 — Calme et lisibilité

### Task 12: Passe calme et lisibilité

**Files:** Modify: composants et pages restants selon l'audit ci-dessous ; Create: `docs/design-system.md` (guide d'une page : rôles, briques, règles).

- [ ] **Step 1:** Audit : un seul bouton plein par écran ; textes courants ≥ 16 px (`text-xs`/`text-sm` réservés aux légendes, jamais pour une action) ; aucun texte en majuscules sur plus de quelques mots ; tout état coloré a une icône ou un mot ; messages de dépassement en ton doux (« Dépassé doucement »).
- [ ] **Step 2:** Axe sur tous les écrans migrés, mobile et ordinateur — Expected: 0 violation. Vérifier au clavier (focus visible `accent-fort`/`focus`).
- [ ] **Step 3:** Écrire `docs/design-system.md` (rôles, briques, règle « une couleur = un rôle », comment changer le thème).
- [ ] **Step 4:** `yarn lint && yarn typecheck && yarn test && yarn build`.
- [ ] **Step 5: Commit** `feat(style): passe calme et lisibilité, guide du design system` ; ouvrir la **PR 5**.

---

## Découpage en PR

1. Tasks 1–5 : réglages centraux, aspect inchangé.
2. Tasks 6–7 : composants communs.
3. Task 8 : repeinte.
4. Tasks 9–11 : tirelire et pièce.
5. Task 12 : calme et lisibilité.

Les PR 3 et 4 sont indépendantes ; la PR 4 peut précéder la PR 3 si l'utilisateur veut voir la tirelire plus tôt.
