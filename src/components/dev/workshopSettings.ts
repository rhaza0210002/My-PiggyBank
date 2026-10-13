/**
 * Atelier de l'identité graphique (développement seulement) : les réglages réécrivent les variables du thème
 * sur toute l'app, en direct. Les valeurs de départ sont lues dans le thème lui-même (globals.css).
 */

export interface WorkshopColor {
  token: string;
  label: string;
}

export const WORKSHOP_COLORS: WorkshopColor[] = [
  { token: 'fond', label: 'Fond de page' },
  { token: 'surface', label: 'Cartes (blanc)' },
  { token: 'surface-douce', label: 'Cadre doux' },
  { token: 'bordure', label: 'Bordures fines' },
  { token: 'bordure-forte', label: 'Bordures des champs' },
  { token: 'texte', label: 'Texte et traits' },
  { token: 'texte-doux', label: 'Texte doux' },
  { token: 'accent', label: 'Vert (accent)' },
  { token: 'accent-fort', label: 'Vert foncé' },
  { token: 'accent-doux', label: 'Vert très doux' },
  { token: 'corail', label: 'Corail' },
  { token: 'corail-clair', label: 'Corail clair' },
  { token: 'piece', label: 'Pièce (jaune)' },
  { token: 'cochon', label: 'Cochon (rose)' },
  { token: 'ok', label: 'Réussite' },
  { token: 'attention', label: 'Attention' },
  { token: 'depasse', label: 'Dépassement' },
];

export const FONT_CHOICES = [
  { id: 'nunito', label: 'Nunito', value: 'var(--font-nunito), ui-sans-serif, system-ui, sans-serif' },
  { id: 'baloo', label: 'Baloo (ronde)', value: 'var(--font-baloo), var(--font-nunito), ui-sans-serif, system-ui, sans-serif' },
  { id: 'luciole', label: 'Luciole (lisibilité)', value: 'var(--font-luciole), ui-sans-serif, system-ui, sans-serif' },
  { id: 'systeme', label: 'Police du système', value: 'ui-sans-serif, system-ui, sans-serif' },
] as const;

export type FontId = (typeof FONT_CHOICES)[number]['id'];

export interface WorkshopSettings {
  colors: Record<string, string>;
  /** Arrondi des grandes cartes, en rem. */
  radiusCard: number;
  /** Taille du texte de base, en pourcentage de celle du navigateur. */
  textScale: number;
  fontText: FontId;
  fontTitle: FontId;
}

export const DEFAULT_FORM = { radiusCard: 1.5, textScale: 100, fontText: 'nunito', fontTitle: 'baloo' } as const;

const fontValue = (id: FontId) => FONT_CHOICES.find((font) => font.id === id)?.value ?? FONT_CHOICES[0].value;

/** Variables CSS à poser sur la racine du document pour ces réglages. */
export function workshopVariables(settings: WorkshopSettings): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const { token } of WORKSHOP_COLORS) {
    const value = settings.colors[token];
    if (value) variables[`--color-${token}`] = value;
  }
  variables['--radius-carte'] = `${settings.radiusCard}rem`;
  variables['--font-sans'] = fontValue(settings.fontText);
  variables['--font-titre'] = fontValue(settings.fontTitle);
  return variables;
}

/** Ce qui a changé entre deux réglages, en mots (pour le journal en direct). */
export function describeChanges(before: WorkshopSettings, after: WorkshopSettings): string[] {
  const changes: string[] = [];
  for (const { token, label } of WORKSHOP_COLORS) {
    if (before.colors[token] !== after.colors[token]) changes.push(`${label} (${token}) : ${after.colors[token]}`);
  }
  if (before.radiusCard !== after.radiusCard) changes.push(`Arrondi des cartes : ${after.radiusCard}rem`);
  if (before.textScale !== after.textScale) changes.push(`Taille du texte : ${after.textScale} %`);
  if (before.fontText !== after.fontText) changes.push(`Police du texte : ${after.fontText}`);
  if (before.fontTitle !== after.fontTitle) changes.push(`Police des titres : ${after.fontTitle}`);
  return changes;
}
