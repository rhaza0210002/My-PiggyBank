/** Même normalisation que l'import CSV : sans accents, minuscules, uniquement lettres et chiffres. */
export function normalizeMatchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Mots génériques d'un libellé bancaire, sans intérêt pour reconnaître un commerçant. */
const NOISE_WORDS = new Set([
  'carte', 'cb', 'paiement', 'achat', 'retrait', 'dab', 'prlv', 'prelevement', 'vir', 'virement',
  'europeen', 'emis', 'recu', 'sepa', 'de', 'du', 'des', 'la', 'le', 'les', 'pour', 'motif', 'ref',
  'mr', 'mme', 'mlle', 'sas', 'sarl', 'sa', 'eurl', 'facture', 'commerce', 'cpt', 'bq',
]);

const MIN_KEYWORD_LENGTH = 3;

/**
 * Propose le mot-clé d'une règle à partir d'un libellé bancaire : le premier mot qui ressemble à un nom
 * de commerçant (ni date, ni numéro, ni mot générique). Renvoie '' si rien ne convient.
 */
export function suggestRuleKeyword(label: string): string {
  const tokens = label.split(/[\s:]+/).map((token) => token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''));

  const candidate = tokens.find((token) => {
    if (token.length < MIN_KEYWORD_LENGTH) return false;
    if (/\d/.test(token)) return false;
    if (NOISE_WORDS.has(normalizeMatchText(token))) return false;
    return normalizeMatchText(token).length >= MIN_KEYWORD_LENGTH;
  });

  return candidate ?? '';
}

export type KeywordProblem = 'too-short' | 'not-in-label';

/** Un mot-clé est valable s'il est assez long et s'il apparaît dans le libellé de l'opération. */
export function checkRuleKeyword(keyword: string, label: string): KeywordProblem | null {
  const normalizedKeyword = normalizeMatchText(keyword);
  if (normalizedKeyword.length < MIN_KEYWORD_LENGTH) return 'too-short';
  return normalizeMatchText(label).includes(normalizedKeyword) ? null : 'not-in-label';
}
