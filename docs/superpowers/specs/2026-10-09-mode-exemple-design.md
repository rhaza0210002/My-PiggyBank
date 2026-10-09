# Mode exemple : un essai complet, uniquement dans le navigateur

Date : 2026-10-09 · Statut : conception validée en discussion, à relire avant le plan.

## Intention

Une personne qui découvre My PiggyBank peut cliquer « Essayer avec un exemple » et **suivre tout le parcours** (importer, pointer, voir le bilan) sans rien importer de réel. Les opérations d'exemple n'existent que dans le navigateur (localStorage) : elles ne sont jamais envoyées à Supabase.

Ce qui compte pour la personne :
- l'exemple se retrouve **dans la suite des opérations** (Pointer, Dépenses réelles, Accueil), pas seulement dans un tableau isolé ;
- elle sait à tout moment qu'elle est dans un exemple, et peut le quitter en un geste ;
- un exemple ne donne jamais de vraies récompenses ni de vraies notifications.

Contexte projet : usage **mensuel** par tranches de durée, esprit « utile et durable », données au minimum (voir la mémoire du projet). Ce chantier est indépendant de l'import CSV souple et de la clôture de mois, prévus à part.

## Périmètre

Dans le périmètre :
- un stock local d'opérations d'exemple et un indicateur « mode exemple actif » ;
- l'aiguillage de la couche `transactionService` vers ce stock quand le mode est actif ;
- un bandeau « Mode exemple » avec « Quitter l'exemple » ;
- la sortie automatique (avec confirmation) quand on importe un vrai relevé ;
- l'exclusion de l'exemple des récompenses et des notifications.

Hors périmètre : import CSV souple, clôture de mois et tableaux figés, saisie manuelle, parcours de première utilisation, noyau mana/pièces.

## Architecture

### Unités

1. **`src/services/demoStore.ts`** (nouveau, sans dépendance à Supabase)
   - Rôle : garder en localStorage la liste des opérations d'exemple et l'état « actif ».
   - Interface : `isDemoActive()`, `startDemo(transactions)`, `endDemo()`, `readDemoTransactions()`, `updateDemoTransactions(mutator)`.
   - Clé unique `piggy-exemple`. Un contenu illisible ou invalide est traité comme « pas d'exemple » (jamais d'erreur affichée).
   - Si le localStorage est refusé (navigation privée stricte), `startDemo` renvoie `false` : l'écran d'import affiche « Ton navigateur bloque le stockage local : l'exemple n'est pas disponible ici » et reste sur l'ancien affichage d'aperçu.

2. **`src/services/transactionService.ts`** (modifié)
   - Chaque fonction de lecture ou d'écriture des opérations commence par `if (isDemoActive())` et travaille sur `demoStore`. Fonctions concernées : `getRecentTransactions`, `getTransactionsToReconcile`, `countTransactionsToReconcile`, `updateTransactionCategory`, `markTransactionsReconciled`, `unreconcileTransactions`, `getPointedLabelHistory`, `getUncategorizedTransactions`, `countUncategorizedTransactions`, `getTransactionsForMonth`, `getMonthTotals`.
   - `saveImportedTransactions`, appelé pendant l'aperçu d'un exemple (clic sur « Enregistrer les 8 transactions »), range les opérations dans le stock local au lieu de Supabase et active le mode exemple ; importer ensuite un vrai relevé appelle d'abord `endDemo()` (après confirmation).
   - `getReconciliationActivity` (alimente badges et pièces) renvoie une liste vide en mode exemple.
   - Les identifiants d'exemple sont de la forme `demo-<n>` ; le stock reproduit la forme `StoredTransaction` (dont `reconciled_at`).

3. **`src/utils/demoStatement.ts`** (existant) : produit les 8 opérations d'exemple ; ajout d'une conversion en `StoredTransaction`.

4. **Interface**
   - `DemoBanner` : bandeau affiché par la mise en page des écrans Opérations et Accueil quand le mode est actif. Texte : « Mode exemple : ces opérations sont fictives et restent sur cet appareil. » + bouton « Quitter l'exemple ».
   - Page d'import : « Essayer avec un exemple » affiche d'abord l'aperçu, comme un vrai fichier lu (rien n'est encore stocké). « Enregistrer les 8 transactions » est actif et appelle `startDemo` ; le lien « Pointer les opérations → » apparaît alors, comme après un vrai import. « Enregistrer les libellés reconnus » reste désactivé en exemple (il écrirait des règles dans le vrai compte), avec une courte explication.
   - Import d'un vrai fichier pendant l'exemple : confirmation « Ton exemple sera effacé. Continuer ? ».

### Flux

Bouton exemple → `buildDemoTransactions` → aperçu (rien de stocké) → « Enregistrer les 8 transactions » → `startDemo` (écrit le stock, active le mode) → « Pointer les opérations » lit le stock via `transactionService` → pointage met à jour le stock → Dépenses réelles et Accueil lisent le même stock → « Quitter l'exemple » appelle `endDemo` et tout revient aux vraies données.

Catégories et lignes de budget restent les vraies (lues dans Supabase) : l'exemple se compare au vrai budget de la personne.

### Gestion des erreurs et cas limites
- Stock corrompu ou version inconnue : ignoré, mode inactif.
- Deux onglets ouverts : le dernier écrit gagne ; aucun verrou nécessaire (usage mono-personne).
- Déconnexion : le mode exemple est effacé à la déconnexion, pour qu'un exemple ne se retrouve pas chez la personne suivante sur un appareil partagé.
- Notifications : `notificationService` n'est pas appelé en mode exemple (aucun comptage ni rappel basé sur des opérations fictives).

## Récompenses

En mode exemple, pointer ne crée ni pièces ni badges réels : l'activité renvoyée au système de récompenses est vide. La tirelire garde son animation pour que l'essai soit complet, mais son compteur du jour n'est pas conservé.

## Tests

- `demoStore` : démarrer, lire, mettre à jour, quitter ; contenu corrompu ; stockage refusé.
- `transactionService` : pour chaque fonction listée, en mode exemple, aucun appel à Supabase (client simulé qui échoue au moindre appel) et résultat cohérent avec le stock ; hors mode exemple, comportement inchangé.
- Pointer puis annuler : le stock reflète l'état, `getPointedLabelHistory` suit.
- `DemoBanner` : visible seulement en mode exemple ; « Quitter l'exemple » appelle `endDemo`.
- Page d'import : texte, confirmation avant d'écraser un exemple, message si le stockage est refusé.
- Vérification dans le navigateur : parcours import → pointage → dépenses réelles → quitter, sur ordinateur et mobile ; aucune requête Supabase de lecture ou d'écriture d'opérations pendant l'exemple.

## Risques

- Oublier une fonction du service : le test « aucun appel Supabase en mode exemple » est là pour l'empêcher.
- Confusion exemple/réel : le bandeau est visible sur chaque écran concerné et la sortie est automatique à l'import réel.
