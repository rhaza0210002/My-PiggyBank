/**
 * Données bancaires : on ne garde que le nécessaire pour reconnaître une opération (enseigne, date,
 * montant). Numéros de carte, IBAN, e-mails et longues références sont masqués avant toute
 * sauvegarde, et la clé anti-doublon est une empreinte : elle ne contient plus aucun texte bancaire.
 */

const MASK = '••••';

const PATTERNS: [RegExp, string][] = [
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '••@••'],
  [/\b[A-Za-z]{2}\d{2}(?:\s?[A-Za-z0-9]{4}){3,7}(?:\s?[A-Za-z0-9]{1,4})?\b/g, `IBAN ${MASK}`],
  [/\d{8,}/g, MASK],
  [/\bX\d{3,4}\b/gi, `X${MASK}`],
];

/** Libellé de la banque sans numéro de carte, IBAN, e-mail ni longue référence. */
export function sanitizeBankLabel(label: string): string {
  return PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), label).trim();
}

/** Empreinte SHA-256 (hexadécimal) : identique côté navigateur et côté base (`sha256`). */
export async function fingerprint(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
