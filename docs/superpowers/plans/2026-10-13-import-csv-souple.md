# Import CSV souple — plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lire le relevé (CSV ou OFX) de n'importe quelle banque française. En cas de doute seulement, poser des questions une à une, puis retenir les réponses sur l'appareil.

**Architecture:**
- Une chaîne de fonctions pures dans `src/utils/statementImport/` : décodage → format → tableau → association des colonnes → lignes.
- Une mémoire `localStorage` dans `src/services/importFormatMemory.ts`.
- Un composant d'étapes `ColumnMappingSteps`, dont la logique (questions, réponses) est pure et testée à part.
- `csvParser.ts` ne garde que `BankTransaction` et la catégorisation.

**Tech Stack:** Next.js 16 (App Router, composants client), TypeScript, Tailwind 4 (tokens du thème), Vitest 5 en environnement `node` (sans DOM : composants testés par `renderToStaticMarkup`, `window`/`localStorage` simulés par `vi.stubGlobal`).

**Spec:** `docs/superpowers/specs/2026-10-13-import-csv-souple-design.md`

## Global Constraints

- **Front uniquement.** Aucune modification de Supabase ni de `supabase/`. Branche `feat/import-csv-souple`, commits `feat(front):`, `fix(front):` ou `test(front):`. Pas de PR sans demande de l'utilisatrice.
- **Dates** : chaque `StatementLine.date` est en `jj/mm/aaaa`, pour que `toIsoDate` et l'affichage existants restent inchangés.
- **Doublons** : `rawDetail` vaut le détail s'il n'est pas vide, sinon le libellé. Pour la Société Générale, la clé de doublon reste celle d'avant.
- **Textes** :
  - en français simple ;
  - aucun texte visible ne contient `libelle_transacts`, `RLS`, `SQL` ni de message d'exception brut ;
  - les messages d'erreur sont exactement ceux de la section 9 de la spec.
- **Interface** :
  - couleurs uniquement par les tokens du thème (garde-fou `hardcodedColors`) ;
  - aucune rayure ni motif ;
  - icônes du composant `Icon` (garde-fou `noEmojiIcons`) ;
  - animations coupées si `prefers-reduced-motion` ;
  - à 390 px, seul le tableau défile à l'horizontale, jamais la page.
- **Mémoire** : clé `piggy-formats-import`, 5 formats au plus. On ne garde jamais une opération ni un montant. On ne lève jamais d'erreur si le stockage est refusé.
- **Seuils** :
  - 90 % de cases dates pour reconnaître une colonne de date ;
  - doute `illisibles` au-delà de 5 % de lignes illisibles ;
  - séparateur retenu s'il donne au moins 3 colonnes ;
  - début de tableau = une ligne suivie de 2 lignes régulières.
- Commandes : `yarn test`, `yarn typecheck`, `yarn lint`.

## Review Focus

1. **Fichier Société Générale déjà importé par le passé** : les clés de doublons (`prepareTransactionsForStorage`) doivent être identiques avant et après. Testé dans la tâche 7.
2. **Montants avec milliers** : `1.234,56`, `1 234,56` (espace insécable), `-1,234.56`, `(12,00)` et `12,00 €` doivent tous être bien lus. Testé dans la tâche 4.
3. **Ligne de total ou de solde final en bas du fichier**, avec un autre nombre de colonnes : elle est ignorée et ne compte pas comme illisible. Testé dans la tâche 2.
4. **Fichier en mémoire mais tronqué** : le doute `illisibles` est recalculé, la mémoire ne masque pas un fichier abîmé. Testé dans la tâche 6.
5. **Navigateur qui refuse `localStorage`** (navigation privée stricte) : l'import marche, rien n'est retenu, aucune erreur. Testé dans la tâche 8.

---

### Task 1: Types communs et décodage du fichier

**Files:**
- Create: `src/utils/statementImport/types.ts`, `src/utils/statementImport/decodeStatement.ts`
- Test: `src/utils/statementImport/__tests__/decodeStatement.test.ts`

**Interfaces:**
- Produces, dans `types.ts` :
  - `StatementLine = { date: string; label: string; detail: string; amount: number }`
  - `CsvTable = { separator: string; headers: string[]; hasHeader: boolean; rows: string[][] }`
  - `AmountColumns = { kind: 'single'; column: number | null } | { kind: 'split'; debit: number | null; credit: number | null }`
  - `ColumnMapping = { date: number | null; label: number | null; detail: number | null; amount: AmountColumns; decimal: ',' | '.'; dateOrder: 'dmy' | 'mdy' }`
  - `Doubt = 'date' | 'montant' | 'libelle' | 'ordreDate' | 'illisibles'`
  - `ReadResult = { kind: 'ofx'; lines: StatementLine[] } | { kind: 'csv'; table: CsvTable; mapping: ColumnMapping; doubts: Doubt[]; lines: StatementLine[]; fromMemory: boolean } | { kind: 'error'; message: string }`
- Produces : `decodeStatement(bytes: ArrayBuffer): string`

- [ ] **Step 1 : écrire le test qui échoue.** Le fichier contient 4 cas :
  - « lit l'UTF-8 » : `Opération` encodé en UTF-8 donne `Opération` ;
  - « retire le BOM » : le résultat ne commence pas par `﻿` ;
  - « bascule en windows-1252 si l'UTF-8 est invalide » : `Buffer.from('Opération;Débit', 'latin1')` donne `Opération;Débit` ;
  - « fichier vide » : donne `''`.
- [ ] **Step 2** : `yarn test src/utils/statementImport/__tests__/decodeStatement.test.ts`. Attendu : FAIL, module introuvable.
- [ ] **Step 3 : implémenter `decodeStatement`.** D'abord `new TextDecoder('utf-8', { fatal: true })`. Dans un `catch`, `new TextDecoder('windows-1252')`. Puis retirer `^﻿`.
- [ ] **Step 4** : relancer le test. Attendu : PASS, 4 sur 4.
- [ ] **Step 5** : commit `feat(front): décodage des relevés (UTF-8 ou windows-1252, sans BOM)`.

### Task 2: Découper le CSV — `readCsvTable`

**Files:**
- Create: `src/utils/statementImport/csvTable.ts`, `src/utils/statementImport/__tests__/fixtures.ts`
- Test: `src/utils/statementImport/__tests__/csvTable.test.ts`

**Interfaces:**
- Consumes : `CsvTable` (tâche 1).
- Produces :
  - `readCsvTable(text: string): CsvTable | null` ;
  - `splitCsvRecords(text: string, separator: string): string[][]`, exporté pour les tests. Il découpe aussi les retours à la ligne situés entre guillemets.
- Produces, dans `fixtures.ts` : des chaînes fictives réutilisées par les tâches suivantes.
  - `SG_CSV` : 2 lignes d'en-tête de compte, en-têtes `Date de l'opération;Libellé;Détail de l'écriture;Montant de l'opération;Devise`, 4 opérations à virgule décimale, dont un libellé « VIR SALAIRE ».
  - `QUOTED_CSV` : séparateur `;`, guillemets, un libellé `"RESTO; LE COIN"`.
  - `DEBIT_CREDIT_CSV` : colonnes `Date;Libellé;Débit;Crédit;Solde`.
  - `DOT_DECIMAL_CSV` : séparateur `,`, en-têtes `Date,Description,Amount`, dates `2026-09-02`, montants `-1,234.56` entre guillemets et `12.30`.
  - `NO_HEADER_CSV` : sans en-tête.
  - `MDY_CSV` : dates `09/13/2026`.
  - `AMBIGUOUS_DATES_CSV` : dates `06/07/2026` et `08/09/2026` uniquement.
  - `TWO_AMOUNTS_CSV` : colonnes `Date;Libellé;Montant 1;Montant 2;Solde`.
  - `TOTAL_LINE_CSV` : `SG_CSV` suivi d'une ligne `Total;;-123,45`.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - `splitCsvRecords('a;"b;c";"d ""e"""', ';')` donne `[['a','b;c','d "e"']]`.
  - Un champ entre guillemets qui contient `\n` reste une seule case.
  - `readCsvTable(SG_CSV)` :
    - `separator` vaut `';'` ;
    - `headers[0]` vaut `"Date de l'opération"` ;
    - `rows.length` vaut 4 ;
    - les 2 lignes de compte sont sautées.
  - `readCsvTable(QUOTED_CSV).rows[0]` contient `'RESTO; LE COIN'`.
  - `readCsvTable(DOT_DECIMAL_CSV).separator` vaut `','`.
  - `readCsvTable(NO_HEADER_CSV)` :
    - `hasHeader` vaut `false` ;
    - `headers` vaut `['Colonne 1','Colonne 2','Colonne 3']` ;
    - la première opération est dans `rows`.
  - `readCsvTable(TOTAL_LINE_CSV).rows.length` vaut 4 : la ligne de total est ignorée.
  - `readCsvTable('bonjour\nau revoir')` vaut `null`.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - Pour chaque séparateur candidat (`;`, `,`, `\t`, `|`), découper avec `splitCsvRecords` et mesurer la plus longue suite de lignes consécutives qui ont le même nombre de colonnes, au moins 3. Garder le meilleur séparateur.
  - Début du tableau : la première ligne qui contient une date (`isDateCell`, interne : `jj/mm/aaaa`, `jj-mm-aa`, `aaaa-mm-jj`) et qui est suivie de 2 lignes de même largeur contenant une date. S'il reste moins de 2 lignes après elle, les lignes restantes suffisent.
  - En-tête : la ligne précédente, si elle a la même largeur et ne contient ni date ni montant.
  - Fin : les lignes de largeur différente sont écartées.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): découpage CSV (séparateur, guillemets, en-têtes de banque sautés)`.

### Task 3: Reconnaître les colonnes — `detectMapping`

**Files:**
- Create: `src/utils/statementImport/cells.ts`, `src/utils/statementImport/detectMapping.ts`
- Test: `src/utils/statementImport/__tests__/detectMapping.test.ts`

**Interfaces:**
- Consumes : `CsvTable`, `ColumnMapping`, `Doubt`, et les fixtures (tâche 2).
- Produces, dans `cells.ts` :
  - `isDateCell(v: string): boolean` (déplacée depuis `csvTable.ts`) ;
  - `isAmountCell(v: string): boolean`, qui accepte virgule ou point, milliers par espace, espace insécable, point ou virgule, `€`, signe et parenthèses ;
  - `normalizeHeader(v: string): string`, qui passe en minuscules et retire accents et non-alphanumériques.
- Produces : `detectMapping(table: CsvTable): { mapping: ColumnMapping; doubts: Doubt[] }`. Le doute `illisibles` n'est pas calculé ici (voir tâche 6).

- [ ] **Step 1 : écrire les tests qui échouent.**
  - `SG_CSV` :
    - `date` 0, `label` 1, `detail` 2, `amount` `{kind:'single', column:3}` ;
    - `decimal` `','`, `dateOrder` `'dmy'`, `doubts` `[]` ;
    - la devise (4) n'est pas prise comme texte.
  - `DEBIT_CREDIT_CSV` : `amount` `{kind:'split', debit:2, credit:3}`, et la colonne Solde (4) n'apparaît nulle part dans `mapping`.
  - `DOT_DECIMAL_CSV` : `decimal` `'.'`, `date` 0, `doubts` `[]`.
  - `MDY_CSV` : `dateOrder` `'mdy'`, sans doute `ordreDate`.
  - `AMBIGUOUS_DATES_CSV` : `dateOrder` `'dmy'`, et `doubts` contient `'ordreDate'`.
  - `TWO_AMOUNTS_CSV` : `doubts` contient `'montant'`, la colonne Solde n'est jamais proposée, et la supposition est `{kind:'split', debit:3, credit:2}`, à savoir :
    - la colonne surtout négative est le débit ;
    - la colonne surtout positive est le crédit ;
    - si les deux ont le même signe : `single` sur la première.
  - Avec une table sans colonne de dates : `date` `null` et doute `'date'`.
  - `isAmountCell` :
    - vrai pour `'1.234,56'`, `'1 234,56'`, `'-1,234.56'`, `'(12,00)'`, `'12,00 €'` ;
    - faux pour `'EUR'`, `'06/07/2026'`, `''`.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter** selon la section 5 de la spec.
  - Le profil de chaque colonne (part de dates, part de montants, nombre de valeurs distinctes) se calcule sur les cases non vides.
  - En-têtes repérés par `normalizeHeader` :
    - solde : `solde`, `balance` ;
    - débit : `debit`, `sortie`, `depense` ;
    - crédit : `credit`, `entree`, `recette` ;
    - montant : `montant`, `amount` ;
    - devise : `devise`, `currency`.
  - Une colonne dont toutes les valeurs font 3 lettres majuscules est aussi une devise.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): reconnaissance des colonnes d'un relevé par leur contenu`.

### Task 4: Appliquer l'association — `applyMapping`

**Files:**
- Create: `src/utils/statementImport/applyMapping.ts`
- Test: `src/utils/statementImport/__tests__/applyMapping.test.ts`

**Interfaces:**
- Consumes : `CsvTable`, `ColumnMapping`, `StatementLine`.
- Produces :
  - `parseAmount(value: string, decimal: ',' | '.'): number | null` ;
  - `normalizeDate(value: string, order: 'dmy' | 'mdy'): string | null`, qui renvoie `jj/mm/aaaa` ;
  - `applyMapping(table: CsvTable, mapping: ColumnMapping): { lines: StatementLine[]; unreadable: number }`.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - `parseAmount` :
    - `('1234.56','.')` donne `1234.56` ;
    - `('1.234,56',',')` donne `1234.56` ;
    - `('1 234,56',',')` donne `1234.56` ;
    - `('-1,234.56','.')` donne `-1234.56` ;
    - `('(12,00)',',')` donne `-12` ;
    - `('12,00 €',',')` donne `12` ;
    - `('',',')` donne `null`.
  - `normalizeDate` :
    - `('2/9/26','dmy')` donne `'02/09/2026'` ;
    - `('09/13/2026','mdy')` donne `'13/09/2026'` ;
    - `('2026-09-02','dmy')` donne `'02/09/2026'` ;
    - `('31/02/2026','dmy')` donne `null`.
  - `applyMapping(DEBIT_CREDIT_CSV, …)` : une ligne débit `54,20` donne `-54.2`, une ligne crédit `1 850,00` donne `1850`.
  - Une ligne sans montant et sans date compte dans `unreadable` et ne figure pas dans `lines`.
  - Avec `label` `null`, `lines` est vide et `unreadable` vaut le nombre de lignes.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - En `split`, montant = `Math.abs(crédit) - Math.abs(débit)`, chaque case vide valant 0. Si les deux sont vides, la ligne est illisible.
  - `detail` vaut `''` quand `mapping.detail` est `null`.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): conversion des lignes de relevé (montants, débit/crédit, dates)`.

### Task 5: OFX

**Files:**
- Create: `src/utils/statementImport/ofx.ts`
- Test: `src/utils/statementImport/__tests__/ofx.test.ts`, plus des fixtures `OFX_SGML` et `OFX_XML` ajoutées dans `fixtures.ts`.

**Interfaces:**
- Produces : `isOfx(text: string): boolean`, `parseOfx(text: string): StatementLine[]`.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - `isOfx(OFX_SGML)` et `isOfx(OFX_XML)` sont vrais, `isOfx(SG_CSV)` est faux.
  - `parseOfx(OFX_SGML)` donne 2 lignes, dont `{ date: '02/09/2026', label: 'CARREFOUR', detail: 'CB 01/09', amount: -54.2 }`. Le fichier est en balises non fermées, avec `DTPOSTED:20260902120000[+1:CET]` et `TRNAMT:-54.20`.
  - `parseOfx(OFX_XML)` donne le même résultat avec des balises fermées.
  - Un OFX sans `<STMTTRN>` donne `[]`.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.** Isoler chaque bloc `<STMTTRN>…</STMTTRN>` (ou jusqu'au `<STMTTRN>` suivant ou `</BANKTRANLIST>`). Lire chaque champ par `/<NAME>([^<\r\n]*)/`. Montant : `Number` après remplacement d'une virgule éventuelle.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): lecture des relevés OFX (SGML et XML)`.

### Task 6: Assembler — `readStatement`

**Files:**
- Create: `src/utils/statementImport/readStatement.ts`
- Test: `src/utils/statementImport/__tests__/readStatement.test.ts`

**Interfaces:**
- Consumes : les tâches 2 à 5.
- Produces :
  - `readStatement(text: string, remembered?: ColumnMapping): ReadResult` ;
  - les constantes de message `EMPTY_FILE_MESSAGE`, `NO_OPERATIONS_MESSAGE`, `EMPTY_OFX_MESSAGE`, avec les textes exacts de la section 9 de la spec.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - `readStatement('')` donne `{kind:'error', message: EMPTY_FILE_MESSAGE}`.
  - `readStatement('bonjour')` donne `NO_OPERATIONS_MESSAGE`.
  - Un OFX sans opération donne `EMPTY_OFX_MESSAGE`.
  - `readStatement(SG_CSV)` donne `kind` `'csv'`, `doubts` `[]`, 4 `lines` et `fromMemory` `false`.
  - Avec 2 lignes sur 20 au montant illisible, `doubts` contient `'illisibles'`.
  - `readStatement(TWO_AMOUNTS_CSV, retenue)` :
    - `fromMemory` vaut `true` ;
    - `doubts` vaut `[]` ;
    - l'association retenue est appliquée.
  - Avec une association retenue et un fichier dont plus de 5 % des lignes deviennent illisibles, `doubts` vaut `['illisibles']` (Review Focus 4).
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - Texte vide ou blanc : erreur. OFX : `parseOfx`. Sinon : `readCsvTable`, puis `remembered ?? detectMapping(table).mapping`, puis `applyMapping`.
  - Doutes : `[]` si l'association vient de la mémoire, sinon ceux de `detectMapping`. Puis on ajoute `'illisibles'` si `unreadable / table.rows.length > 0.05`.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): lecture complète d'un relevé avec doutes et messages simples`.

### Task 7: Catégorisation — `categorizeLines` remplace `SocieteGeneraleParser`

**Files:**
- Modify: `src/services/csvParser.ts` (en entier), `src/utils/csvParsing.ts` (ne garder que `toIsoDate` et ce qu'il utilise), `src/utils/__tests__/csvParsing.test.ts` (ne garder que les tests de `toIsoDate`)
- Test: `src/services/__tests__/csvParser.test.ts`

**Interfaces:**
- Consumes : `StatementLine`, `LibelleTransact`, `normalizeMatchText` (`@/utils/labelMatching`).
- Produces : `categorizeLines(lines: StatementLine[], labels: LibelleTransact[]): BankTransaction[]`. Le type `BankTransaction` ne change pas.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - **Non-régression des doublons.** On construit `avant` avec `new SocieteGeneraleParser(SG_CSV, []).parse()`, **avant** de le supprimer, puis on fige ses `prepareTransactionsForStorage(avant).rows.map(r => r.dedupe_key)` comme tableau littéral dans le test. On vérifie ensuite que `prepareTransactionsForStorage(categorizeLines(readStatement(SG_CSV).lines, [])).rows.map(r => r.dedupe_key)` lui est égal.
  - Une ligne `VIR SALAIRE` de montant positif donne `type` `'VIREMENT_ENTRANT'`.
  - Avec une règle `{ label: 'carrefour', key: 'alimentation', id_cat: 'c1' }`, la ligne CARREFOUR reçoit `categoryId` `'c1'`, comme aujourd'hui.
- [ ] **Step 2** : lancer le test. Attendu : FAIL, `categorizeLines` n'existe pas.
- [ ] **Step 3 : implémenter.**
  - `rawDetail = line.detail || line.label`.
  - Recherche de règle sur `normalizeMatchText([line.date, line.label, line.detail, …].join(' '))`, même logique que l'actuelle.
  - Retirer `SocieteGeneraleParser`, `getColumnMap` et les fonctions de `csvParsing.ts` devenues inutiles.
- [ ] **Step 4** : `yarn test` et `yarn typecheck`. Attendu : PASS. La page d'import ne compile plus : c'est réparé à la tâche 10, mais en attendant, adapter son appel pour que `typecheck` passe (`categorizeLines(result.lines, labels)` dans le cas sans doute).
- [ ] **Step 5** : commit `refactor(front): catégorisation séparée de la lecture du relevé (doublons inchangés)`.

### Task 8: Mémoire des formats — `importFormatMemory`

**Files:**
- Create: `src/services/importFormatMemory.ts`
- Test: `src/services/__tests__/importFormatMemory.test.ts`, sur le modèle de `demoStore.test.ts` (`vi.stubGlobal('window', { localStorage })` avec une `Map`).

**Interfaces:**
- Produces :
  - `IMPORT_FORMATS_KEY = 'piggy-formats-import'` ;
  - `formatSignature(table: CsvTable): string` ;
  - `recallMapping(signature: string): ColumnMapping | null` ;
  - `rememberMapping(signature: string, mapping: ColumnMapping): void` ;
  - `countRememberedFormats(): number` ;
  - `forgetFormats(): void`.

- [ ] **Step 1 : écrire les tests qui échouent.**
  - Une association enregistrée est ensuite rappelée à l'identique.
  - La signature est insensible aux accents et à la casse des en-têtes. Une table sans en-tête donne une signature qui contient `sans-entete`.
  - Après 6 formats enregistrés, `countRememberedFormats()` vaut 5 et le plus ancien n'est plus rappelé. L'horloge est contrôlée avec `vi.setSystemTime`.
  - Le contenu stocké ne contient aucun montant : `JSON.stringify` ne contient pas `54,20`.
  - Un contenu `'{pas du json'` donne `recallMapping` `null` et `countRememberedFormats` `0`.
  - Si `getItem` et `setItem` lèvent une erreur, aucune fonction ne lève (Review Focus 5).
  - `forgetFormats()` remet le compte à 0.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - Forme stockée : `{ version: 1, formats: { signature, mapping, lastUsed }[] }`.
  - Toute lecture et toute écriture sont dans un `try`, avec le même garde que `demoStore` (`storage()`).
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): mémoire des formats d'import sur l'appareil (5 au plus, sans montants)`.

### Task 9: Étape « associer les colonnes » (version B)

**Files:**
- Create: `src/utils/statementImport/mappingQuestions.ts`, `src/components/features/import/ColumnMappingSteps.tsx`
- Test: `src/utils/statementImport/__tests__/mappingQuestions.test.ts`, `src/components/features/import/__tests__/ColumnMappingSteps.test.tsx`

**Interfaces:**
- Consumes : `CsvTable`, `ColumnMapping`, `Doubt`, `applyMapping`.
- Produces :
  - `Question = { kind: 'amountShape' } | { kind: 'column'; role: 'date' | 'label' | 'amount' | 'debit' | 'credit' } | { kind: 'dateOrder'; sample: string }` ;
  - `buildQuestions(doubts: Doubt[], mapping: ColumnMapping, table: CsvTable): Question[]`, recalculée à chaque réponse ;
  - `answerColumn(mapping, role, column): ColumnMapping` ;
  - `answerAmountShape(mapping, shape: 'single' | 'split'): ColumnMapping` ;
  - `answerDateOrder(mapping, order): ColumnMapping` ;
  - `missingParts(mapping): string[]`, qui renvoie des libellés français (`'la date'`, `'le libellé'`, `'le montant'`) ;
  - `doubtReason(doubts: Doubt[]): string`, la phrase du bandeau ;
  - le composant par défaut `ColumnMappingSteps({ table, initialMapping, doubts, onConfirm })`.

- [ ] **Step 1 : écrire les tests qui échouent** (logique pure).
  - Doute `'montant'` : `amountShape`, puis `column:debit` et `column:credit`. Avec `single` : `amountShape` puis `column:amount`.
  - Doute `'date'` : `column:date`. Doute `'ordreDate'` : `dateOrder` avec `sample` égal à la première date ambiguë (`'06/07/2026'`).
  - Doute `'illisibles'` : toutes les questions de colonnes, préremplies.
  - `answerColumn(m, 'debit', 3)` retire la colonne 3 de tout autre rôle.
  - `missingParts` d'une association sans date vaut `['la date']`.
  - `doubtReason(['montant'])` vaut `'On n’est pas sûrs de la colonne du montant. Quelques petites questions et c’est fini.'`.
- [ ] **Step 2 : écrire le test de rendu.** `renderToStaticMarkup(<ColumnMappingSteps table={TWO_AMOUNTS table} … />)` doit contenir :
  - `Question 1 sur 3` ;
  - le bandeau de `doubtReason` ;
  - des boutons `aria-pressed` pour la forme du montant ;
  - une zone `aria-live="polite"` ;
  - `Voilà ce que ça donnera` ;
  - aucun `bg-[#`.

  Pour une question de colonne : des `<button` d'en-tête avec `aria-label="Choisir la colonne Montant 2"`, et aucun bouton pour la colonne Solde.
- [ ] **Step 3** : lancer les deux tests. Attendu : FAIL.
- [ ] **Step 4 : implémenter.**
  - La logique pure d'abord, puis le composant.
  - État : `mapping` et `index`. Aperçu : `applyMapping(table, mapping).lines.slice(0, 3)`, montants formatés avec `signedEuroFormatter`. Tableau : `table.rows.slice(0, 5)` dans un cadre `overflow-x-auto`.
  - Colonne choisie en aplat `bg-accent` ; survol `hover:bg-accent-doux`.
  - Boutons « Retour », « C’est ça » puis « Importer », ce dernier désactivé si `missingParts` n'est pas vide.
  - Transitions avec `motion-reduce:transition-none`.
- [ ] **Step 5** : lancer les tests. Attendu : PASS.
- [ ] **Step 6** : commit `feat(front): étape « associer les colonnes », une question à la fois`.

### Task 10: Brancher la page d'import

**Files:**
- Modify: `src/app/(app)/operations/import/page.tsx`, `src/app/(app)/operations/import/__tests__/page.test.tsx`

**Interfaces:**
- Consumes : `decodeStatement`, `readStatement`, `formatSignature`, `recallMapping`, `rememberMapping`, `categorizeLines`, `ColumnMappingSteps`.

- [ ] **Step 1 : compléter le test de page qui échoue.**
  - Le HTML ne contient ni `libelle_transacts`, ni `RLS`, ni `SQL`.
  - L'`input` a `accept=".csv,.ofx,.qfx,.txt"`.
  - Le texte du bouton est `Choisir mon relevé (CSV ou OFX)`.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - `file.arrayBuffer()`, puis `decodeStatement`. Si la sortie est un CSV : `recallMapping(formatSignature(table))`, puis `readStatement(text, rappel)`. Comme la signature demande la table, on fait un premier `readStatement(text)` pour l'obtenir, puis un second avec le rappel s'il existe.
  - S'il y a des doutes : on affiche `ColumnMappingSteps` à la place du tableau. `onConfirm` fait `rememberMapping`, puis `applyMapping`, puis `categorizeLines`.
  - Sinon : on affiche directement `categorizeLines`.
  - Si `fromMemory` : la ligne « Même format que la dernière fois, tes réglages ont été repris. » avec le bouton « Refaire les questions », qui rouvre `ColumnMappingSteps` avec `doubts` `['illisibles']` et l'association retenue.
  - `getLibelleTransacts` en échec ou vide : on catégorise avec `[]`, sans message.
  - `kind: 'error'` : le message dans `role="alert"`.
- [ ] **Step 4** : `yarn test`, `yarn typecheck` et `yarn lint`. Attendu : tout passe.
- [ ] **Step 5** : commit `feat(front): import de relevés de toutes banques, questions seulement en cas de doute`.

### Task 11: Mes données — oublier les réglages d'import

**Files:**
- Modify: `src/app/(app)/compte/donnees/page.tsx`
- Test: `src/app/(app)/compte/donnees/__tests__/page.test.tsx` (à créer s'il n'existe pas, sur le modèle du test de la page d'import, avec les services mockés)

- [ ] **Step 1 : écrire le test qui échoue.** Le HTML contient `Réglages d’import retenus sur cet appareil`. Avec `countRememberedFormats` mocké à 0, il contient `Aucun réglage retenu.` et pas de bouton `Oublier`. Avec 2, il contient `2 formats retenus` et un bouton `Oublier`.
- [ ] **Step 2** : lancer le test. Attendu : FAIL.
- [ ] **Step 3 : implémenter.**
  - Une carte avec la même classe `CARD` que les autres. Le compte est lu dans un `useEffect`, car `localStorage` n'est disponible qu'après le montage.
  - « Oublier » appelle `forgetFormats()`, puis affiche « C’est oublié. » dans une zone `role="status"`.
- [ ] **Step 4** : lancer le test. Attendu : PASS.
- [ ] **Step 5** : commit `feat(front): Mes données — oublier les réglages d'import de l'appareil`.

### Task 12: Vérification de bout en bout

- [ ] **Step 1** : `yarn test`, `yarn typecheck`, `yarn lint`, `yarn build`. Attendu : tout passe, y compris les garde-fous `hardcodedColors`, `noEmojiIcons` et `tableStyles`.
- [ ] **Step 2 : captures Playwright avec le compte de test**, en 390, 820 et 1280 px :
  - la page d'import après dépôt de `TWO_AMOUNTS_CSV` (étape B, question 1, puis question de colonne) ;
  - après dépôt de `SG_CSV` (tableau direct) ;
  - un second dépôt de `TWO_AMOUNTS_CSV` (ligne « Même format… »).

  Vérifier qu'aucune page ne défile à l'horizontale.
- [ ] **Step 3** : relire les captures. Si une correction est nécessaire, faire un commit `fix(front): …`, puis relancer l'étape 1.
- [ ] **Step 4** : envoyer la branche sur GitHub pour la sauvegarder (`git push`). **Pas de PR** sans demande de l'utilisatrice.
