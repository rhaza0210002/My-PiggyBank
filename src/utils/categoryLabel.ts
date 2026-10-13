/**
 * Règles d'un nom de catégorie personnelle. Ce sont les mêmes que celles de la base
 * (migration 20261013120000) : ici pour prévenir tout de suite, la base restant le vrai garde-fou.
 */
export const CATEGORY_LABEL_MAX = 40;
export const MAX_OWN_CATEGORIES = 30;

const LETTER_OR_DIGIT = 'A-Za-z0-9À-ÖØ-öø-ÿŒœ';
const ALLOWED = new RegExp(`^[${LETTER_OR_DIGIT}][${LETTER_OR_DIGIT} '’&().,/+-]*$`);

/** Espaces en trop retirés, comme le fait la base avant d'enregistrer. */
export function normalizeCategoryLabel(label: string): string {
  return label.replace(/\s+/g, ' ').trim();
}

/** Message à afficher, ou null si le nom est accepté. */
export function categoryLabelError(label: string): string | null {
  const name = normalizeCategoryLabel(label);
  if (name.length === 0) return 'Le nom de la catégorie est obligatoire.';
  if (name.length > CATEGORY_LABEL_MAX) return `Le nom de la catégorie fait au plus ${CATEGORY_LABEL_MAX} caractères.`;
  if (!/^[A-Za-z0-9À-ÖØ-öø-ÿŒœ]/.test(name)) return 'Le nom de la catégorie commence par une lettre ou un chiffre.';
  if (!ALLOWED.test(name)) {
    return 'Le nom de la catégorie ne peut contenir que des lettres, des chiffres, des espaces et & \' ’ ( ) . , / + -.';
  }
  return null;
}
