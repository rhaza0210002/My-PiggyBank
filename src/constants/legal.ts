/**
 * Informations d'identification de l'éditeur, affichées dans les pages légales.
 * Elles viennent de variables d'environnement : tant qu'elles ne sont pas renseignées, la page
 * affiche un repère « à renseigner » plutôt qu'une information inventée.
 */
const TO_FILL = (what: string) => `[${what} à renseigner]`;

export const LEGAL = {
  appName: 'My PiggyBank',
  publisherName: process.env.NEXT_PUBLIC_LEGAL_NAME || TO_FILL('Nom de l’éditeur'),
  publisherAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || TO_FILL('Adresse de l’éditeur'),
  publicationDirector: process.env.NEXT_PUBLIC_LEGAL_DIRECTOR || TO_FILL('Directeur de la publication'),
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  contactEmailLabel: process.env.NEXT_PUBLIC_CONTACT_EMAIL || TO_FILL('Adresse e-mail de contact'),
  /** Date de dernière mise à jour des documents légaux (à modifier à chaque évolution). */
  lastUpdate: '8 octobre 2026',
  year: new Date().getFullYear(),
} as const;

/** Version des conditions acceptées à l'inscription : à changer quand elles évoluent. */
export const TERMS_VERSION = '2026-10-08';

export const hasContactEmail = LEGAL.contactEmail.length > 0;
