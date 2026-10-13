# Normes GitHub de My PiggyBank — plan

Date : 2026-10-13 · Statut : proposition, à valider par l'utilisatrice avant toute action sur GitHub.

## But

Un dépôt qui suit les usages courants de GitHub sans ajouter de charge à l'utilisatrice :
- les règles sont écrites une fois ;
- les vérifications sont automatiques ;
- GitHub empêche les erreurs (fusion sans tests, effacement de branche) au lieu de compter sur la mémoire.

## État des lieux (2026-10-13)

| Sujet | Constat |
|---|---|
| Dépôt | Public, compte personnel `rhaza0210002`, seule collaboratrice. |
| Branches | `main` (production), `feat/front` (42 commits d'avance sur `main`), `feat/back` (identique à `main`, inutilisée). **74 branches distantes**, dont 71 déjà fusionnées dans `feat/front`. |
| Protection | Aucune règle sur `main` ni sur `feat/front` : on peut y pousser directement, forcer ou effacer. |
| Vérifications (CI) | `.github/workflows/ci.yml` : lint, typecheck, tests et build sur chaque PR, plus un audit des dépendances qui ne bloque pas. Bonne base. Un commentaire a des accents abîmés (`DÃ©`). |
| Fusions | Les trois méthodes sont permises (merge, squash, rebase). Les branches ne sont pas effacées après fusion. |
| PR | Pas de modèle de description. Des branches ont été empilées les unes sur les autres (`feat/responsive` contenait #62 à #66), ce qui rend les PR difficiles à relire. |
| Commits | Majoritairement `feat(front):` et `fix(front):`. Les plus anciens utilisent d'autres portées (`feat(exemple):`) ou n'en ont pas (`test`). |
| Docs | Pas de guide de contribution. |

## Règles proposées

### 1. Branches

- `main` : ce qui est en ligne. On n'y fusionne **que sur demande de l'utilisatrice**, par une PR de livraison `feat/front` → `main` (ou `feat/back` → `main`).
- `feat/front` et `feat/back` : branches d'intégration, une par côté.
- **Branches de travail** : une par sujet, créée depuis la branche d'intégration du bon côté. Nom : `type/sujet-court`, avec les types `feat`, `fix`, `docs`, `chore`, `refactor` ou `test`, par exemple `fix/bilan-coupe` ou `feat/import-csv-souple`.
- **Pas d'empilement** : une branche de travail ne part jamais d'une autre branche de travail non fusionnée. Si un sujet dépend d'un autre, on attend la fusion du premier.
- Une branche de travail est effacée automatiquement après sa fusion.

### 2. Commits — Conventional Commits

- Format : `type(portée): sujet à l'impératif ou au présent, en français`.
- Types : `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `perf`.
- Portées : `front` ou `back`. Pour ce qui ne touche ni l'un ni l'autre (CI, réglages du dépôt) : `chore(repo):`.
- Un commit = un changement cohérent qui passe les tests.
- Pied de commit : la ligne `Co-Authored-By` quand Claude a écrit le code.

### 3. Pull requests

- Une PR = une branche de travail = un sujet, vers `feat/front` ou `feat/back`.
- Titre : celui du commit principal (même format).
- Modèle de description `.github/pull_request_template.md` :
  - Pourquoi ;
  - Ce qui change ;
  - Vérifications, avec des cases à cocher : tests, tsc, eslint, captures 390 / 820 / 1280 px si l'interface change, accessibilité (contraste, clavier, mouvement réduit, aucun motif ni rayure).
- **Fusion** : en **squash** pour les branches de travail (un commit propre par PR dans `feat/front`), en **merge commit** pour les PR de livraison vers `main` (on garde l'historique détaillé).
- Fusion seulement quand la CI est verte. Pas de relecture obligatoire par une autre personne, puisque l'utilisatrice est seule et que GitHub interdit d'approuver sa propre PR.

### 4. Protections (rulesets GitHub)

Sur `main`, `feat/front` et `feat/back` :
- PR obligatoire, plus de poussée directe ;
- vérification `checks` (lint, typecheck, tests, build) obligatoire et verte ;
- forçage (`push --force`) et effacement interdits.

L'utilisatrice, propriétaire du dépôt, garde un contournement d'urgence (*bypass*). Il n'est jamais utilisé par Claude.

### 5. Ménage

- Effacer les **71 branches distantes déjà fusionnées** dans `feat/front`. Leur travail est intact dans `feat/front` ; seules les étiquettes disparaissent. GitHub permet de restaurer une branche effacée depuis la page de sa PR.
- Garder `main`, `feat/front` et `feat/back`, ainsi que les branches en cours : `fix/bilan-coupe` et `chore/normes-github`.
- `dev` et `loginSignInForm` ne sont pas fusionnées : on les regarde avant de décider.

### 6. Documentation

- `CONTRIBUTING.md` : les règles 1 à 4 en une page, à lire en 2 minutes.
- Corriger les accents du commentaire dans `ci.yml`.
- Mettre à jour la mémoire de Claude (`feedback-git-front-back`) avec ces règles.

### Laissé de côté pour l'instant

- Dependabot (mises à jour automatiques des dépendances) : il ouvrirait des PR régulières à trier, une charge en plus. À reconsidérer plus tard.
- Étiquettes, tickets (issues), jalons, versions numérotées (tags) : utiles en équipe, pas nécessaires seule.

## Étapes

Chaque étape est faite par Claude. L'utilisatrice valide seulement ce plan.

1. Sur `chore/normes-github` : `CONTRIBUTING.md`, `.github/pull_request_template.md`, correction de `ci.yml`. Commit `chore(repo): …`, puis PR vers `feat/front`.
2. Réglages du dépôt (`gh api`) : effacement auto des branches après fusion, méthodes de fusion squash et merge commit, rebase désactivé.
3. Rulesets sur `main`, `feat/front` et `feat/back` (règle 4). On vérifie ensuite qu'une poussée directe sur `feat/front` est bien refusée.
4. Ménage : liste exacte des branches à effacer montrée à l'utilisatrice, effacement après son accord.
5. Mise à jour de la mémoire de Claude.

**Vérification finale** :
- la PR de l'étape 1 passe la CI ;
- elle se fusionne en squash ;
- sa branche s'efface toute seule ;
- `gh api …/rulesets` montre les trois protections.
