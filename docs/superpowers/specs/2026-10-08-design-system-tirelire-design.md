# Design system « tirelire » : réglages centraux, composants communs, récompense au pointage

Date : 2026-10-08 · Statut : à relire · Chemin : architectural (nouveau sous-système de style)

## 1. Intention

**Pour qui.** Des personnes neuroatypiques (TDAH) pour qui suivre des comptes n'est pas naturellement attirant.

**Objectif.** Un site qui donne envie de revenir : récompense immédiate à chaque geste, progression visible, décor calme, aucun reproche. Le ton reste doux et « rien ne se perd ».

**Ce qui a été décidé avec l'utilisateur.**
- Approche : **les bases d'abord**, puis le décor (réglages centraux → composants → tirelire).
- Palette : **corail + vert + jaune, version kawaï, « vert en vedette »**.
- Moteur de motivation : **la tirelire qui se remplit**, avec **une pièce à chaque pointage**.
- Animation : **légère**, uniquement sur le geste de pointage (la pièce tombe, le cochon rebondit). Pas de confettis.
- Cochon : dessin **simple en aplats** (variante « mignon »), isolé dans un composant pour pouvoir être remplacé.

**Hors périmètre** (gardé pour plus tard) : stickers, accessoires et album de collection ; paliers et surprises ; mode calme (point 7 de la liste) ; objectifs d'épargne.

## 2. Critères de réussite

1. Changer une valeur de couleur, d'arrondi ou d'ombre à **un seul endroit** change tout le site.
2. Plus aucune couleur écrite en dur dans les composants (761 usages et 115 valeurs aujourd'hui).
3. Un pointage déclenche une pièce animée de 0,5 s au plus et une tirelire qui monte.
4. Contrastes : texte 4,5:1, boutons et champs 3:1, vérifiés par un test.
5. Avec « réduire les mouvements », aucune animation ne joue et rien ne manque d'information.
6. Aucune régression : tests existants verts, axe 0 violation sur les écrans migrés.

## 3. Réglages centraux (étape 1)

Un bloc `@theme` de Tailwind 4 dans `src/app/globals.css` nomme chaque valeur par son **rôle**. Les composants utilisent `bg-surface`, `text-texte-doux`, `rounded-carte`, jamais une valeur hexadécimale.

**Couleurs (palette « vert en vedette »).** Valeurs de départ, ajustables par le test de contraste.

| Rôle | Valeur | Usage |
|---|---|---|
| `fond` | `#f2fbea` | fond des pages |
| `surface` | `#ffffff` | cartes, champs |
| `surface-douce` | `#e1f5d3` | zones secondaires, fond de jauge |
| `bordure` | `#cfeebd` | traits fins |
| `texte` | `#2f3d2a` | texte principal |
| `texte-doux` | `#5c6e55` | légendes, aides |
| `accent` | `#8fd36f` | boutons principaux, jauge |
| `accent-fort` | `#2f7a3a` | liens, texte accent |
| `accent-doux` | `#d8f2c8` | pastilles « ok », survol |
| `attention` / `attention-fond` | `#7a5b00` / `#fff0b8` | « à regarder » |
| `depasse` / `depasse-fond` | `#a8431f` / `#ffe3d8` | « dépassé doucement » (corail pâle, jamais de rouge vif) |
| `piece` / `piece-bord` | `#ffe066` / `#e0b020` | pièces et récompenses |
| `cochon` / `cochon-bord` | `#ffc7d6` / `#ff8aa9` | dessin du cochon |

**Règles de sens.** Une couleur a un seul rôle. La couleur n'est **jamais seule** : toujours une icône (✓, ●, ▲) ou un mot.

**Autres réglages.** `rounded-petit | carte | bonbon` (trois arrondis), `shadow-bonbon` (ombre pleine sous les boutons) et `shadow-doux` (carte), échelle d'espacements, durées d'animation (`--duree-pointage: 0.5s`, `--duree-niveau: 0.5s`).

**Migration en deux temps, sans casse.**
1. Créer les rôles avec les **valeurs actuelles** les plus proches, remplacer les usages en dur. Le site ne change pas d'aspect.
2. Changer les valeurs pour la palette ci-dessus en une seule PR : c'est là que le nouveau look apparaît.

**Garde-fous.**
- Test automatique : chaque paire texte/fond du thème respecte 4,5:1 (texte) ou 3:1 (contrôles).
- Règle de lint (ou test de recherche) qui interdit les nouvelles couleurs hexadécimales dans `src/`.

## 4. Composants communs (étape 2)

Dans `src/components/ui/`, une seule définition de chaque brique, réglée par les rôles.

- **Bouton** : principal (vert plein, arrondi bonbon, ombre pleine), secondaire (blanc, bordure verte), lien discret, « à regarder doucement » (corail pâle), désactivé. Zone tactile d'au moins 44 px, focus visible en `accent-fort`.
- **Carte** : fond `surface`, bordure `bordure`, arrondi `carte`. Remplace `ScreenCard` et `SectionStack`.
- **Champ** : étiquette au-dessus, aide dessous, erreur en `depasse` avec un mot, jamais seule.
- **Badge** : `ok` (✓), `attention` (●), `depasse` (▲), `piece` (🪙), toujours avec icône ou mot.
- **Jauge** : remplace `ProgressBar`.
- `Tabs` et `BalanceToggle` sont recolorés par les rôles sans être réécrits.

Ordre de migration : pointage, tableau de bord, budget, puis le reste, par petites PR.

## 5. Tirelire et pièce (étape 3)

**Composant `Tirelire`** (`src/components/features/gamification/Tirelire.tsx`) : dessin SVG simple du cochon (aplats `cochon`/`cochon-bord`, œil, groin, fente), niveau de pièces jaunes dans le ventre.

- Props : `niveau` (0 à 1), `declencheur` (change à chaque pointage pour rejouer l'animation), `reduireMouvements` (venu de `prefers-reduced-motion`).
- Pièce : élément CSS qui tombe dans la fente en 0,5 s, puis le cochon rebondit et ferme l'œil un instant, le niveau monte avec une transition de 0,5 s.
- Animations en **CSS pur**, sans bibliothèque. Seule animation non liée à un geste : un clignement discret.
- Message court et annoncé aux lecteurs d'écran (`aria-live="polite"`) : « +1 pièce ». Le niveau existe aussi en texte (« 3 sur 10 »).

**Jauge du jour.** Le niveau est `pointés aujourd'hui / objectif`. L'objectif par défaut est 10, réglable plus tard. Quand la tirelire est pleine, un message de bravo apparaît. Le lendemain elle repart à zéro : **aucune série à ne pas casser, aucun pointage ne se perd** (les totaux et le bilan du mois restent inchangés).

**Données.** Aucune nouvelle table. Le compte du jour vient de `reconciled_at` (déjà stocké) via un helper pur testé. Rien de bancaire n'est ajouté ni envoyé.

**Écran concerné d'abord :** pointage (`/operations/rapprochement`). Le tableau de bord pourra afficher la tirelire du jour ensuite.

## 6. Calme et lisibilité (étape 4)

- Un seul bouton plein par écran ; les récompenses n'apparaissent qu'après un geste.
- Texte d'au moins 16 px, interligne généreux, phrases courtes.
- Montants derrière l'œil, comme aujourd'hui.
- Pas de rouge agressif, de compte à rebours, de série ni de classement.
- Rappels inchangés : au plus un par jour.
- Animations d'au plus 0,5 s, jamais en boucle (hors clignement). `prefers-reduced-motion` coupe tout.
- Le mode calme (point 7) pourra masquer le cochon et les messages.

## 7. Tests et vérification

- **Unitaires (Vitest)** : calcul du niveau de la tirelire, contrastes de chaque paire de rôles, absence de couleurs en dur.
- **Navigateur (Playwright + axe)** : écrans migrés sur mobile et ordinateur, 0 violation ; animation jouée avec mouvements normaux, absente avec mouvements réduits.
- **Revue visuelle** : captures avant/après de l'étape 1 (doit être identique) et de l'étape 2 de repeinte.

## 8. Découpage en PR

1. Réglages centraux + remplacement des couleurs/arrondis (aspect inchangé) + tests de contraste et de couleurs en dur.
2. Composants communs (bouton, carte, champ, badge, jauge), écrans les plus utilisés.
3. Repeinte : nouvelles valeurs de palette.
4. Tirelire + pièce animée sur l'écran de pointage.
5. Passe calme et lisibilité, migration des écrans restants.

Chaque PR est livrable seule et facile à annuler.

## 9. Risques et points ouverts

- La palette est une proposition : les contrastes réels peuvent obliger à foncer un texte vert ou jaune.
- 761 usages à migrer : on procède par écran pour garder des PR relisibles.
- Le dessin du cochon n'est pas figé ; il vit dans un seul composant et peut être remplacé (illustration dessinée, version avec volume).
- Collection, paliers et mode calme sont des chantiers séparés.
