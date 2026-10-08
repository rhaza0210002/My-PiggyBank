/** Explication en une phrase de chaque groupe du budget, pour un nouvel utilisateur (le jargon seul ne dit rien). */
const GROUP_HINTS: Record<string, string> = {
  decaissement: 'Tes dépenses fixes, celles qui partent chaque mois : loyer, assurance, abonnements.',
  reserve: 'Ce que tu dépenses au quotidien ou mets de côté : courses, épargne, petits plaisirs.',
  revenus: 'Ce qui rentre chaque mois : salaire, aides, remboursements.',
};

export function getGroupHint(groupKey: string): string | undefined {
  return GROUP_HINTS[groupKey];
}
