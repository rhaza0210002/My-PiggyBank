import { ROUTES } from '@/constants/routes';

export interface StartStep {
  id: 'import' | 'budget' | 'reconcile';
  title: string;
  hint: string;
  href: string;
  done: boolean;
  /** Une fois le pas fait, il reste modifiable : libellé du lien et précision sur la portée du changement. */
  edit?: { label: string; note: string };
}

interface StartState {
  hasOperations: boolean;
  hasBudget: boolean;
  reconciledOperations: number;
}

/** Les trois premiers pas d'un nouvel utilisateur ; tout est dérivé des données, rien n'est stocké. */
export function getStartSteps({ hasOperations, hasBudget, reconciledOperations }: StartState): StartStep[] {
  return [
    {
      id: 'budget',
      title: 'Prévoir mon budget',
      hint: 'Quelques montants suffisent pour commencer, tu pourras affiner.',
      href: ROUTES.budgetMonthly,
      done: hasBudget,
      edit: { label: 'Modifier', note: 'Ne change que les mois suivants.' },
    },
    {
      id: 'import',
      title: 'Importer mon relevé',
      hint: 'Le fichier CSV de ta banque : les opérations sont rangées pour toi.',
      href: ROUTES.import,
      done: hasOperations,
    },
    {
      id: 'reconcile',
      title: 'Pointer mes opérations',
      hint: 'Commence par une seule, pour voir comment ça marche : chaque pointage rapporte des points.',
      href: ROUTES.reconciliation,
      done: reconciledOperations > 0,
    },
  ];
}

/** Prochain pas à faire, ou undefined quand tout est fait (l'encart reste, sans bouton « C'est parti »). */
export function getNextStep(steps: StartStep[]): StartStep | undefined {
  return steps.find((step) => !step.done);
}
