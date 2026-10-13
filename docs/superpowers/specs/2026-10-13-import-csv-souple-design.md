# Import CSV souple : lire le relevé de n'importe quelle banque

Date : 2026-10-13 · Statut : conception validée en discussion (morceaux 1, 2 et 3), à relire avant le plan.

## Intention

Aujourd'hui l'import ne comprend bien que le CSV de la Société Générale. Les autres banques échouent ou donnent des montants faux (par exemple `1234.56` lu comme 123 456). Le but est que **le relevé de n'importe quelle banque française** soit compris, sans configuration, et que la personne ne réponde à des questions que lorsque la lecture a un vrai doute — une seule question à la fois, et une seule fois par format de fichier.

Ce qui compte pour la personne :
- dans la plupart des cas, elle dépose son fichier et voit directement ses opérations ;
- en cas de doute, quelques questions simples, jamais un formulaire technique ;
- le mois suivant, avec le même format de fichier, aucune question ;
- jamais de message d'erreur technique ;
- le fichier ne quitte pas son appareil.

## Périmètre

Dans le périmètre (front uniquement, aucune modification de la base) :
- lecture du fichier : encodage, CSV ou OFX ;
- découpage du CSV et reconnaissance des colonnes d'après leur contenu ;
- étape « associer les colonnes » en questions successives (version B de la maquette) ;
- mémoire des formats sur l'appareil, et bouton « Oublier » dans Mes données ;
- messages d'erreur en français simple.

Hors périmètre :
- identifiant unique OFX (`FITID`) pour les doublons : demande une colonne en base, donc une PR back-end, plus tard ;
- import Excel, PDF ou QIF ;
- formats en plusieurs devises : la devise est ignorée, comme aujourd'hui.

Branche : `feat/import-csv-souple`, PR vers `feat/front`, commits `feat(front):`.

## Comportement

### 1. Ouvrir le fichier

- Le fichier est lu en octets (`ArrayBuffer`), pas avec `readAsText`.
- Décodage en UTF-8 strict (`TextDecoder('utf-8', { fatal: true })`). S'il échoue, décodage en `windows-1252`.
- Le BOM en tête (`﻿`) est retiré.
- Le sélecteur accepte `.csv`, `.ofx`, `.qfx` et `.txt`.

### 2. Reconnaître le format

- Le texte contient `<OFX>` ou commence par `OFXHEADER` : **OFX**.
- Sinon : **CSV**.

### 3. OFX

- Chaque bloc `<STMTTRN>` donne une opération.
- Les deux variantes sont lues : SGML (OFX 1.x, balises non fermées, une valeur par ligne) et XML (OFX 2.x, balises fermées).
- `DTPOSTED` (`AAAAMMJJ…`) donne la date.
- `TRNAMT` donne le montant, toujours avec un point décimal et un signe.
- `NAME` donne le libellé, `MEMO` le détail.
- Un OFX lisible ne déclenche jamais de questions.

### 4. Découper le CSV

- **Séparateur** : on essaie `;`, `,`, tabulation et `|`, en ignorant ce qui est entre guillemets. On retient celui qui donne le même nombre de colonnes (au moins 3) sur le plus grand nombre de lignes consécutives.
- **Guillemets** : découpage conforme au CSV standard. Un séparateur entre guillemets ne coupe pas, `""` vaut `"`, et un champ entre guillemets peut contenir un retour à la ligne.
- **Début du tableau** : c'est la première ligne suivie d'au moins 2 lignes, si le fichier en a assez, qui :
  - ont le même nombre de colonnes ;
  - contiennent une date.
  Tout ce qui précède est sauté : numéro de compte, période, solde, etc.
- **En-tête** : la ligne juste avant le début du tableau, si elle a le même nombre de colonnes et ne contient ni date ni montant. Sinon le fichier n'a pas d'en-tête, et les colonnes s'appellent « Colonne 1 », « Colonne 2 »…
- **Lignes de fin** : les lignes dont le nombre de colonnes diffère (total, solde final) sont ignorées et ne comptent pas comme illisibles.

### 5. Reconnaître les colonnes

Une colonne est d'abord jugée sur son contenu (proportion de cases non vides qui sont des dates, des montants, du texte). Le nom de l'en-tête ne sert qu'à départager.

- **Date** : colonne dont au moins 90 % des cases non vides sont des dates. S'il y en a plusieurs, on prend celle dont l'en-tête contient « opé » ou qui n'est pas « valeur ». À défaut, la première.
- **Solde** : toute colonne dont l'en-tête contient « solde » ou « balance » est exclue des montants.
- **Débit et crédit** : deux colonnes de montants dont les en-têtes contiennent « débit » et « crédit » (ou « sortie »/« entrée », « dépense »/« recette »), et qui sont rarement remplies sur la même ligne. On les recombine : montant = |crédit| − |débit|.
- **Montant** : sinon, une seule colonne de montants, de préférence nommée « montant » ou « amount ».
- **Libellé** : la colonne de texte qui a le plus de valeurs différentes.
- **Détail** : une deuxième colonne de texte, s'il y en a une, de préférence nommée « détail ». Les colonnes de devise (« EUR », « devise ») ne comptent pas comme texte.
- **Décimales** : décidées pour tout le fichier, sur la colonne des montants.
  - Une valeur se termine par `,` + 1 ou 2 chiffres : décimale virgule, et le point ou l'espace séparent les milliers.
  - Sinon, une valeur se termine par `.` + 1 ou 2 chiffres : décimale point, et la virgule ou l'espace séparent les milliers.
  - Sinon : décimale virgule.
- **Ordre des dates** (jj/mm ou mm/jj), décidé pour tout le fichier :
  - un premier nombre supérieur à 12 : jj/mm ;
  - un second nombre supérieur à 12 : mm/jj ;
  - sinon jj/mm (usage français), mais c'est un doute si au moins une date a jour ≠ mois.
  - Le format `AAAA-MM-JJ` n'est jamais ambigu.

### 6. Quand y a-t-il doute ?

La lecture renvoie, en plus de sa supposition, une liste de **doutes** :

| Doute | Condition | Question posée (étape 7) |
|---|---|---|
| `date` | aucune colonne de dates | Clique sur la colonne de la date. |
| `montant` | aucune colonne de montants, ou plusieurs possibles sans indication débit/crédit | Ta banque met-elle les sorties et les entrées dans la même colonne ? puis la ou les colonnes |
| `libelle` | aucune colonne de texte | Clique sur la colonne du libellé. |
| `ordreDate` | ordre jj/mm non prouvé et au moins une date avec jour ≠ mois | « 06/07/2026 », c'est le 6 juillet ou le 7 juin ? |
| `illisibles` | plus de 5 % des lignes du tableau sans date ou montant valide avec la supposition | toutes les questions de colonnes, préremplies |

S'il n'y a aucun doute, on n'affiche aucune question : le tableau des opérations apparaît comme aujourd'hui.

### 7. Étape « associer les colonnes » (version B)

L'étape s'affiche **à la place du tableau des opérations**, dans la même carte que la page d'import.

- Un bandeau d'attention dit pourquoi, en une phrase, par exemple « On n'est pas sûrs de la colonne du montant. Quelques petites questions et c'est fini. »
- Une seule question à la fois, avec « Question 2 sur 3 ».
- **Questions de colonne** : le tableau montre les 5 premières lignes du fichier, et la colonne supposée est surlignée (aplat `accent`).
  - Chaque en-tête de colonne est un bouton, donc atteignable au clavier, avec un nom accessible du type « Choisir la colonne Montant 2 ».
  - Un clic ou Entrée sur une autre colonne change le choix.
  - Une colonne de solde n'est pas proposée pour un montant.
- **Questions à choix** (une ou deux colonnes, ordre des dates) : des boutons `aria-pressed`, avec la supposition présélectionnée.
- **« Voilà ce que ça donnera »** : les 3 premières opérations, telles qu'elles seront importées, mises à jour à chaque choix dans une zone `aria-live="polite"`. Si un élément manque, on l'écrit à la place : « Il manque encore : la date. »
- Boutons « C'est ça » pour passer à la question suivante et « Retour » pour revenir. Après la dernière question, le bouton devient « Importer » ; il est désactivé tant qu'il manque la date, le libellé ou le montant.
- Les couleurs restent en aplat, sans rayure ni motif. Aucune animation si `prefers-reduced-motion`.
- Sur mobile (390 px), le tableau défile horizontalement dans son cadre, jamais la page.

### 8. Mémoire des formats sur l'appareil

- **Signature d'un format** : séparateur, nombre de colonnes, en-têtes normalisés (minuscules, sans accents ni espaces), joints. Pour un fichier sans en-tête : séparateur, nombre de colonnes et `sans-entete`.
- **Ce qui est gardé** : la signature, l'association choisie (colonnes, débit/crédit, décimales, ordre des dates) et la date de dernier usage. Jamais une opération ni un montant.
- **Où** : `localStorage`, clé `piggy-formats-import`, au plus 5 formats. Au-delà, on retire celui dont le dernier usage est le plus ancien.
- **Quand on enregistre** : quand la personne valide l'étape 7 avec « Importer ». Un fichier lu sans doute n'est pas enregistré, puisqu'il n'y avait rien à retenir.
- **À la lecture suivante** : si la signature est connue, l'association retenue remplace la supposition et les doutes sont ignorés, sauf `illisibles`, recalculé avec l'association retenue. Une ligne s'affiche au-dessus du tableau : « Même format que la dernière fois, tes réglages ont été repris. » avec un lien « Refaire les questions », qui rouvre l'étape 7 préremplie avec les réglages retenus.
- **Navigateur qui refuse le stockage** : on n'enregistre rien, sans message. Les questions reviendront la prochaine fois.
- **Mes données** : une carte « Réglages d'import retenus sur cet appareil » indique le nombre de formats retenus et propose un bouton « Oublier ». Après le clic, on affiche « C'est oublié. ». S'il n'y a rien, on affiche « Aucun réglage retenu. » sans bouton.

### 9. Messages d'erreur

Toujours en français simple. Jamais de nom de table, de SQL ni de message brut d'exception.

| Situation | Message |
|---|---|
| fichier vide ou impossible à décoder | « Ce fichier est vide ou illisible. Vérifie que c'est bien le relevé exporté par ta banque. » |
| ni OFX ni tableau trouvé | « Ce fichier ne contient pas d'opérations lisibles. Ta banque propose peut-être un export « CSV » ou « OFX » : essaie avec celui-là. » |
| OFX sans opération | « Ce relevé ne contient aucune opération sur la période choisie. » |
| règles de catégories illisibles (table vide ou erreur réseau) | pas d'erreur : les opérations s'affichent non catégorisées, comme dans le mode exemple |

## Architecture

### Unités

Toutes nouvelles sauf mention. Elles sont pures, sans React ni Supabase, hormis la mémoire et l'interface.

1. **`src/utils/statementImport/decodeStatement.ts`** : `decodeStatement(bytes: ArrayBuffer): string` (étape 1).
2. **`src/utils/statementImport/ofx.ts`** : `isOfx(text: string): boolean`, `parseOfx(text: string): StatementLine[]` (étape 3).
3. **`src/utils/statementImport/csvTable.ts`** : `readCsvTable(text: string): CsvTable | null` (étape 4).
   - Type `CsvTable = { separator: string; headers: string[]; hasHeader: boolean; rows: string[][] }`.
4. **`src/utils/statementImport/detectMapping.ts`** : `detectMapping(table: CsvTable): { mapping: ColumnMapping; doubts: Doubt[] }` (étapes 5 et 6).
   - Type `ColumnMapping = { date: number | null; label: number | null; detail: number | null; amount: { kind: 'single'; column: number | null } | { kind: 'split'; debit: number | null; credit: number | null }; decimal: ',' | '.'; dateOrder: 'dmy' | 'mdy' }`.
   - Type `Doubt = 'date' | 'montant' | 'libelle' | 'ordreDate' | 'illisibles'`.
5. **`src/utils/statementImport/applyMapping.ts`** : `applyMapping(table: CsvTable, mapping: ColumnMapping): { lines: StatementLine[]; unreadable: number }`.
   - Type `StatementLine = { date: string; label: string; detail: string; amount: number }`.
   - `date` est normalisée en `jj/mm/aaaa`, donc l'affichage du tableau et `toIsoDate` (doublons) restent inchangés.
6. **`src/utils/statementImport/readStatement.ts`** : `readStatement(text: string, remembered?: ColumnMapping): ReadResult`, qui assemble 2 à 5.
   - Type `ReadResult = { kind: 'ofx'; lines } | { kind: 'csv'; table; mapping; doubts; lines; fromMemory: boolean } | { kind: 'error'; message }`.
7. **`src/services/csvParser.ts`** (modifié) :
   - la reconnaissance des colonnes propre à la Société Générale disparaît ;
   - il garde `BankTransaction` et la catégorisation, exposée par `categorizeLines(lines: StatementLine[], labels: LibelleTransact[]): BankTransaction[]`, même règle de correspondance qu'aujourd'hui.
   - Pour garder les clés de doublons existantes, `rawDetail` = le détail s'il n'est pas vide, sinon le libellé (comme le faisait la SG : « Détail de l'écriture »).
8. **`src/services/importFormatMemory.ts`** : `formatSignature(table)`, `recallMapping(signature)`, `rememberMapping(signature, mapping)`, `countRememberedFormats()`, `forgetFormats()` (étape 8).
   - Contenu illisible : traité comme vide. Stockage refusé : les fonctions ne lèvent jamais d'erreur.
9. **`src/components/features/import/ColumnMappingSteps.tsx`** : l'étape 7.
   - Props : `table`, `initialMapping`, `doubts`, `onConfirm(mapping)`.
   - L'aperçu passe par `applyMapping`.
10. **`src/app/(app)/operations/import/page.tsx`** (modifié) :
    - lecture par `arrayBuffer` puis `readStatement` ;
    - affiche l'étape 7 ou le tableau, puis `categorizeLines` ;
    - la ligne « Même format que la dernière fois » ;
    - les nouveaux messages d'erreur.
11. **`src/app/(app)/compte/donnees/page.tsx`** (modifié) : la carte « Réglages d'import retenus sur cet appareil ».
12. `src/utils/csvParsing.ts` : `toIsoDate` est gardée. Les autres fonctions sont retirées si plus rien ne les utilise.

### Flux

```
fichier → decodeStatement → readStatement
  ├─ OFX → lignes
  └─ CSV → readCsvTable → (mémoire ? association retenue : detectMapping) → applyMapping
         ├─ doutes → ColumnMappingSteps → association validée → rememberMapping → applyMapping
         └─ aucun doute → lignes
lignes → categorizeLines → CsvTransactionsTable (inchangé)
```

## Tests

Vitest, en suivant les tests existants (`src/utils/__tests__`, `src/services/__tests__`, tests de page en `renderToStaticMarkup`).

**Fichiers d'exemple**, dans `src/utils/statementImport/__tests__/fixtures/`. Ils sont fictifs, sans aucune vraie donnée bancaire.
- Société Générale actuelle : lignes d'en-tête de compte, `;`, montant unique, virgule.
- Fichier à `;` et guillemets, avec un `;` dans un libellé.
- Débit et crédit séparés, plus une colonne solde.
- Décimale point, séparateur `,` et guillemets (style anglo-saxon), dates `AAAA-MM-JJ`.
- Sans en-tête.
- Dates mm/jj prouvées par un jour supérieur à 12.
- Dates ambiguës.
- Deux colonnes de montant sans nom clair : le doute `montant` doit apparaître.
- OFX 1.x SGML et OFX 2.x XML.
- Le même contenu en UTF-8 avec BOM et en windows-1252.

**Cas à vérifier :**
- **Montants** : `1234.56` donne 1234,56 et `1 234,56` donne 1234,56. Une colonne solde n'est jamais prise comme montant. Débit/crédit donne un montant signé correct.
- **Doublons** : le fichier SG d'exemple produit les mêmes `rawDetail`, et donc les mêmes clés de doublons, qu'avant la refonte (test de non-régression).
- **Doutes** : chaque doute du tableau de l'étape 6 a son test. Au-delà de 5 % de lignes illisibles, le doute `illisibles` apparaît.
- **Mémoire** : enregistrer puis rappeler. Au-delà de 5 formats, le plus ancien est retiré. Un contenu corrompu est traité comme vide. Un `localStorage` qui lève une erreur ne fait jamais planter la page.
- **Étape 7** :
  - les questions s'enchaînent selon les doutes ;
  - l'aperçu se met à jour ;
  - « Importer » est désactivé quand il manque un élément ;
  - les en-têtes de colonne sont des boutons nommés ;
  - la zone `aria-live` est présente.
- **Page d'import** : il n'y a plus de message technique (aucun texte ne contient « libelle_transacts », « RLS » ni « SQL »).
- Les garde-fous existants restent verts : couleurs codées en dur, icônes sans emoji, styles de tableau.
- **Captures** à 390, 820 et 1280 px de l'étape 7, avec le compte de test.
