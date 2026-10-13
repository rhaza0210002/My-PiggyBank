/** Relevés fictifs (aucune vraie donnée bancaire), un par forme de fichier rencontrée chez les banques. */

/** Société Générale : lignes de compte avant le tableau, « ; », montant unique à virgule, colonne devise. */
export const SG_CSV = [
  '="0001234567890";Compte courant',
  'Solde au 30/09/2026;1 245,80',
  "Date de l'opération;Libellé;Détail de l'écriture;Montant de l'opération;Devise",
  '02/09/2026;CB CARREFOUR;CARTE X1234 01/09 CARREFOUR MARKET;-54,20;EUR',
  '03/09/2026;VIR SALAIRE;VIR RECU 123 DE: EMPLOYEUR SA;1 850,00;EUR',
  '05/09/2026;PRLV EDF;PRELEVEMENT EUROPEEN EDF CLIENTS;-72,00;EUR',
  '12/09/2026;PRLV NETFLIX;PRELEVEMENT NETFLIX.COM;-13,49;EUR',
].join('\r\n');

/** Guillemets partout, un « ; » dans un libellé. */
export const QUOTED_CSV = [
  '"Date";"Libellé";"Montant"',
  '"02/09/2026";"RESTO; LE COIN";"-23,50"',
  '"04/09/2026";"BOULANGERIE";"-4,30"',
  '"07/09/2026";"VIREMENT RECU";"100,00"',
].join('\n');

/** Débit et crédit séparés, plus une colonne solde à ne jamais prendre. */
export const DEBIT_CREDIT_CSV = [
  'Date;Libellé;Débit;Crédit;Solde',
  '02/09/2026;CB CARREFOUR;54,20;;1 245,80',
  '03/09/2026;VIR SALAIRE;;1 850,00;3 095,80',
  '05/09/2026;PRLV EDF;72,00;;3 023,80',
  '12/09/2026;PRLV NETFLIX;13,49;;3 010,31',
].join('\n');

/** Style anglo-saxon : « , », point décimal, milliers en virgule entre guillemets, dates ISO. */
export const DOT_DECIMAL_CSV = [
  'Date,Description,Amount',
  '2026-09-02,GROCERY STORE,"-1,234.56"',
  '2026-09-03,SALARY,2500.00',
  '2026-09-05,COFFEE,-12.30',
].join('\n');

/** Aucune ligne d'en-tête. */
export const NO_HEADER_CSV = [
  '02/09/2026;CB CARREFOUR;-54,20',
  '03/09/2026;VIR SALAIRE;1850,00',
  '05/09/2026;PRLV EDF;-72,00',
].join('\n');

/** Dates mois/jour, prouvées par un jour supérieur à 12. */
export const MDY_CSV = [
  'Date;Libellé;Montant',
  '09/02/2026;CB CARREFOUR;-54,20',
  '09/13/2026;VIR SALAIRE;1850,00',
  '09/20/2026;PRLV EDF;-72,00',
].join('\n');

/** Dates qui peuvent se lire dans les deux sens. */
export const AMBIGUOUS_DATES_CSV = [
  'Date;Libellé;Montant',
  '06/07/2026;CB CARREFOUR;-54,20',
  '08/09/2026;VIR SALAIRE;1850,00',
  '10/11/2026;PRLV EDF;-72,00',
].join('\n');

/** Deux colonnes de montant sans nom clair (entrées / sorties), plus un solde. */
export const TWO_AMOUNTS_CSV = [
  'Date;Libellé;Montant 1;Montant 2;Solde',
  '02/09/2026;CB CARREFOUR;;-54,20;1 245,80',
  '03/09/2026;VIR SALAIRE;1 850,00;;3 095,80',
  '05/09/2026;PRLV EDF;;-72,00;3 023,80',
  '08/09/2026;CB BOULANGERIE;;-4,30;3 019,50',
  '12/09/2026;PRLV NETFLIX;;-13,49;3 006,01',
].join('\n');

/** Société Générale suivie d'une ligne de total plus courte. */
export const TOTAL_LINE_CSV = `${SG_CSV}\r\nTotal;;-123,45`;

/** OFX 1.x : en-tête texte, balises SGML non fermées. */
export const OFX_SGML = [
  'OFXHEADER:100',
  'DATA:OFXSGML',
  'VERSION:102',
  '',
  '<OFX>',
  '<BANKMSGSRSV1><STMTTRNRS><STMTRS>',
  '<BANKTRANLIST>',
  '<STMTTRN>',
  '<TRNTYPE>DEBIT',
  '<DTPOSTED>20260902120000[+1:CET]',
  '<TRNAMT>-54.20',
  '<FITID>A1',
  '<NAME>CARREFOUR',
  '<MEMO>CB 01/09',
  '<STMTTRN>',
  '<TRNTYPE>CREDIT',
  '<DTPOSTED>20260903',
  '<TRNAMT>1850.00',
  '<FITID>A2',
  '<NAME>VIR SALAIRE',
  '</BANKTRANLIST>',
  '</STMTRS></STMTTRNRS></BANKMSGSRSV1>',
  '</OFX>',
].join('\r\n');

/** OFX 2.x : XML, balises fermées. */
export const OFX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220"?>
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260902120000</DTPOSTED><TRNAMT>-54.20</TRNAMT><FITID>A1</FITID><NAME>CARREFOUR</NAME><MEMO>CB 01/09</MEMO></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20260903</DTPOSTED><TRNAMT>1850.00</TRNAMT><FITID>A2</FITID><NAME>VIR SALAIRE</NAME></STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

/** OFX valide mais sans aucune opération. */
export const OFX_EMPTY = '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST></BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>';
