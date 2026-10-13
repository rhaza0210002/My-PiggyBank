# Contribuer à My PiggyBank

Le dépôt suit quatre règles. Elles se lisent en deux minutes.

## 1. Branches

| Branche | Rôle |
|---|---|
| `main` | Ce qui est en ligne. On n'y fusionne que sur décision de la propriétaire, par une PR de livraison depuis `feat/front` ou `feat/back`. |
| `feat/front`, `feat/back` | Branches d'intégration, une par côté (interface / données et services). |
| `type/sujet-court` | Branche de travail, **une par chantier**, créée depuis la branche d'intégration du bon côté. |

- Types de branche : `feat`, `fix`, `docs`, `chore`, `refactor` ou `test`.
  Par exemple `feat/import-csv-souple` ou `fix/retouches-2026-10-13`.
- Les petites corrections d'une même session vont ensemble sur une branche `fix/retouches-AAAA-MM-JJ`.
- Une branche de travail ne part jamais d'une autre branche de travail non fusionnée.
- Une branche de travail est effacée automatiquement une fois fusionnée.

## 2. Commits ([Conventional Commits](https://www.conventionalcommits.org/fr/))

```
type(portée): sujet en français
```

- **Types** : `feat`, `fix`, `docs`, `chore`, `refactor`, `test` ou `perf`.
- **Portées** :
  - `front` pour l'interface ;
  - `back` pour les données et les services ;
  - `repo` pour le dépôt lui-même (CI, réglages, docs de contribution).
- Un commit est un changement cohérent, et les tests passent à chaque commit.

## 3. Pull requests

- **Une PR n'est ouverte que lorsque la propriétaire le demande.** D'ici là, le travail reste en commits sur sa branche, qui peut être envoyée sur GitHub pour être sauvegardée.
- Une PR correspond à un chantier entier, jamais à une retouche isolée.
- La PR vise `feat/front` ou `feat/back`. Son titre suit le format des commits. Sa description suit le modèle proposé.
- Fusion d'une branche de travail : en **squash**, c'est-à-dire un seul commit par PR. Fusion d'une PR de livraison vers `main` : en **merge commit**.

## 4. Protections et vérifications

Sur `main`, `feat/front` et `feat/back`, GitHub impose :
- de passer par une PR, sans poussée directe ;
- une vérification `checks` verte : lint, typecheck, tests et build ;
- aucun forçage (`push --force`) ni effacement.

Avant d'envoyer, on peut lancer les mêmes vérifications en local :

```
yarn lint && yarn typecheck && yarn test && yarn build
```

## Interface : à vérifier à chaque changement visible

- Captures en 390, 820 et 1280 px de large : rien ne déborde, rien n'est coupé.
- Accessibilité :
  - contraste suffisant ;
  - tout fonctionne au clavier, avec un focus visible ;
  - le mouvement réduit est respecté.
- Aucune rayure ni aucun motif répété : les fonds sont en aplat.
- Les textes sont en français simple, et les messages d'erreur ne contiennent jamais de détail technique.
