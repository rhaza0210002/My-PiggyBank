/** « de mai », « d’octobre », « d’avril », « d’août » : le nom du mois en minuscules, avec l'élision. */
export function ofMonth(monthLabel: string): string {
  const name = monthLabel.toLowerCase();
  return /^[aeiouyéèêàâh]/.test(name) ? `d’${name}` : `de ${name}`;
}
