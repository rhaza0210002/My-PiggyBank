# Design system « tirelire »

Le style du site tient en **un seul endroit** : le bloc `@theme` de `src/app/globals.css`. Pour changer l'allure du site, on change des valeurs là, jamais dans les composants.

## Règles

- **Une couleur = un rôle.** On écrit `bg-surface`, `text-texte-doux`, `border-bordure`, jamais `#2f3d2a` ni `bg-white` ni `text-red-700`. Le test `src/utils/__tests__/hardcodedColors.test.ts` échoue sinon (sont exemptés : la palette des groupes de budget, les graphiques, le manifeste, le logo Google).
- **La couleur n'est jamais seule.** Un état porte toujours une icône ou un mot (`Badge` : ✓ ● ▲ 🪙).
- **Contrastes testés.** `src/utils/__tests__/theme.test.ts` lit `globals.css` et vérifie 4,5:1 (texte) et 3:1 (contrôles) pour chaque paire utilisée. Une nouvelle paire texte/fond = une nouvelle ligne dans ce test.
- **Un seul bouton plein par écran** (`Button variant="principal"`), les autres en `secondaire`, `lien` ou `doux`.
- **Zones tactiles ≥ 44 px**, texte courant ≥ 16 px (`text-sm`/`text-xs` seulement pour légendes et aides).
- **Pas de rouge vif, de série à ne pas casser ni de classement.** Un dépassement est « dépassé doucement » (corail pâle + ▲ + mot).
- **Animations ≤ 0,5 s**, jamais en boucle (sauf le clignement du cochon), supprimées par `prefers-reduced-motion`.

## Rôles de couleur (palette « vert en vedette »)

| Rôle | Usage |
|---|---|
| `fond`, `surface`, `surface-douce` | fond de page, cartes et champs, zones secondaires |
| `bordure`, `bordure-forte` | traits fins ; contour des champs et boutons secondaires (≥ 3:1) |
| `texte`, `texte-doux`, `sur-accent` | texte principal, légendes, texte posé sur `accent` |
| `accent`, `accent-fort`, `accent-doux` | boutons et jauge ; liens et titres d'accent ; pastilles et survol |
| `ok`/`ok-fond`, `attention`/`attention-fond`, `depasse`/`depasse-fond` | « dans le budget », « à regarder », « dépassé doucement » |
| `piece`/`piece-bord`, `cochon`/`cochon-bord` | pièces et récompenses ; dessin du cochon |
| `focus` | contour de focus clavier |

Arrondis : `rounded-petit`, `rounded-carte`, `rounded-bonbon`. Ombres : `shadow-bonbon` (sous les boutons), `shadow-doux` (cartes). Durées : `--duree-pointage`, `--duree-niveau`.

## Briques (`src/components/ui/`)

`Button`, `Card`, `Field`, `Badge`, `Gauge` ; `Tabs`, `BalanceToggle`, `ScreenCard`, `SectionStack` utilisent les mêmes rôles.

## Tirelire (`src/components/features/gamification/Tirelire.tsx`)

Jauge du jour : le cochon se remplit de pièces (`pointedToday / DAILY_GOAL`, objectif 10) et une pièce tombe à chaque pointage. Le niveau est plafonné à 100 %, remis à zéro le lendemain, sans série. Le dessin est un seul composant : on peut le remplacer sans toucher au reste.

## Changer la palette

1. Modifier les valeurs `--color-*` du bloc `@theme`.
2. `yarn test` : si une paire passe sous le seuil, assombrir la valeur fautive.
3. Vérifier avec axe sur le pointage, le tableau de bord et le budget (mobile et ordinateur).
