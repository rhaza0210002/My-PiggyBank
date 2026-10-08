export interface LabeledCategory {
  label: string;
  category_id: string;
}

export interface CategorySuggestion {
  categoryId: string;
  /** `exact` : même libellé déjà pointé ; `similar` : même enseigne dans des libellés proches. */
  kind: 'exact' | 'similar';
  /** Nombre de pointages passés qui appuient cette suggestion. */
  count: number;
}

/** Mots de la banque qui ne disent rien de l'enseigne. */
const NOISE = new Set([
  'carte', 'cb', 'prlv', 'sepa', 'vir', 'virement', 'paiement', 'achat', 'retrait', 'dab', 'cheque', 'de', 'du', 'des', 'la', 'le', 'les', 'et',
  'clients', 'particuliers', 'facture', 'ref', 'mandat', 'emetteur',
]);

/** Libellé réduit à ses mots utiles : sans accents, chiffres, dates, numéros de carte masqués ni mots de la banque. */
export function significantWords(label: string): string[] {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !NOISE.has(word));
}

/**
 * Propose la catégorie la plus probable pour une opération, d'après les libellés déjà pointés. Aucune donnée
 * n'est envoyée nulle part : le calcul se fait dans le navigateur, sur ce que l'utilisateur a déjà rangé.
 * Retourne undefined plutôt que de deviner quand les indices sont trop maigres.
 */
export function suggestCategory(label: string, history: readonly LabeledCategory[]): CategorySuggestion | undefined {
  const words = significantWords(label);
  if (words.length === 0) return undefined;
  const key = words.join(' ');

  const exact = new Map<string, number>();
  const similar = new Map<string, number>();

  history.forEach((past) => {
    const pastWords = significantWords(past.label);
    if (pastWords.length === 0) return;

    if (pastWords.join(' ') === key) {
      exact.set(past.category_id, (exact.get(past.category_id) ?? 0) + 1);
    } else if (pastWords.some((word) => word.length >= 4 && words.includes(word))) {
      similar.set(past.category_id, (similar.get(past.category_id) ?? 0) + 1);
    }
  });

  const best = (counts: Map<string, number>) => [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const bestExact = best(exact);
  if (bestExact) return { categoryId: bestExact[0], kind: 'exact', count: bestExact[1] };

  // « Ressemble » : il faut au moins deux pointages concordants, un seul serait un pari.
  const bestSimilar = best(similar);
  if (bestSimilar && bestSimilar[1] >= 2) return { categoryId: bestSimilar[0], kind: 'similar', count: bestSimilar[1] };

  return undefined;
}
