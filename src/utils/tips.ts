export interface Tip {
  id: string;
  title: string;
  text: string;
}

/** Astuces courtes, concrètes et sans culpabilisation, pensées pour une attention qui se disperse. */
export const TIPS: readonly Tip[] = [
  { id: 'five-minutes', title: 'Cinq minutes suffisent', text: 'Mets un minuteur de 5 minutes et pointe tout ce que tu peux. Quand il sonne, tu as le droit de t’arrêter : chaque opération pointée compte.' },
  { id: 'one-line', title: 'Une ligne à la fois', text: 'Ne regarde pas la pile entière. Prends l’opération du haut, choisis sa catégorie, pointe-la. Puis la suivante.' },
  { id: 'same-time', title: 'Un rendez-vous fixe', text: 'Choisis un moment qui revient déjà dans ta semaine (café du dimanche, trajet du mardi) et colle le pointage dessus.' },
  { id: 'remember-rule', title: 'Apprends-le une seule fois', text: 'Retiens le libellé d’un commerçant : la prochaine fois, l’import classera tout seul. Moins de décisions, moins de fatigue.' },
  { id: 'missed-month', title: 'Un mois manqué n’efface rien', text: 'Ton niveau et tes points ne baissent jamais. Rattraper un mois passé te rapporte même un bonus.' },
  { id: 'few-categories', title: 'Peu de catégories', text: 'Trop de choix fatigue. Garde les catégories essentielles ; tu pourras en ajouter plus tard si besoin.' },
  { id: 'good-enough', title: 'Assez bien, c’est très bien', text: 'Une catégorie un peu approximative vaut mieux qu’une opération jamais pointée.' },
  { id: 'reward', title: 'Prévois ta récompense', text: 'Après le pointage, fais quelque chose d’agréable (musique, boisson, pause). Ton cerveau associera la tâche au plaisir.' },
  { id: 'small-win', title: 'Fête les petites victoires', text: 'Dix opérations pointées, c’est déjà une victoire. Regarde ta barre de progression avancer.' },
  { id: 'pay-day', title: 'Le jour de paie, une seule action', text: 'Le jour où l’argent arrive, importe ton relevé. Rien d’autre : le pointage pourra attendre.' },
  { id: 'visible', title: 'Garde-le sous les yeux', text: 'Épingle My PiggyBank sur l’écran d’accueil de ton téléphone : ce qu’on ne voit pas, on l’oublie.' },
  { id: 'buffer', title: 'Un petit coussin', text: 'Mettre de côté ne serait-ce que quelques euros par mois crée une marge pour les imprévus et allège le stress.' },
  { id: 'impulse', title: 'La règle des 24 heures', text: 'Pour un achat non prévu, note-le et attends demain. Souvent l’envie retombe.' },
  { id: 'body-double', title: 'Pointer à deux', text: 'Fais ton pointage en même temps qu’un proche, même à distance : travailler « côte à côte » aide à s’y mettre.' },
  { id: 'noise', title: 'Un fond sonore', text: 'Une playlist ou un bruit de fond régulier aide certaines personnes à rester concentrées sur une tâche répétitive.' },
];

/** Astuce du jour : change chaque jour, la même toute la journée. `offset` permet d'en voir une autre. */
export function pickTip(date: Date, offset = 0): Tip {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return TIPS[(((dayNumber + offset) % TIPS.length) + TIPS.length) % TIPS.length];
}
