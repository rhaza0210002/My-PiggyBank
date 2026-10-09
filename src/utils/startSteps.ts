import { ROUTES } from '@/constants/routes';

export interface StartStep {
  id: 'import' | 'budget' | 'reconcile';
  title: string;
  hint: string;
  href: string;
  done: boolean;
  /** Bouton d'un pas pas encore fait (quand ce n'est pas le prochain, qui affiche « C'est parti »). */
  action: string;
  /** Une fois le pas fait, il reste accessible : libellé du lien, nom complet pour les lecteurs d'écran, précision éventuelle. */
  edit: { label: string; ariaLabel: string; note?: string };
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
      action: 'Prévoir',
      edit: {
        label: 'Modifier',
        ariaLabel: 'Modifier mon budget : ne change que les mois suivants',
        note: 'Ne change que les mois suivants.',
      },
    },
    {
      id: 'import',
      title: 'Importer mon relevé',
      hint: 'Le fichier CSV de ta banque : les opérations sont rangées pour toi.',
      href: ROUTES.import,
      done: hasOperations,
      action: 'Importer',
      edit: { label: 'Nouveau relevé', ariaLabel: 'Importer un nouveau relevé' },
    },
    {
      id: 'reconcile',
      title: 'Pointer mes opérations',
      hint: 'Commence par une seule, pour voir comment ça marche : chaque pointage rapporte des points.',
      href: ROUTES.reconciliation,
      done: reconciledOperations > 0,
      action: 'Pointer',
      edit: { label: 'Continuer', ariaLabel: 'Continuer à pointer mes opérations' },
    },
  ];
}

/** Prochain pas à faire, ou undefined quand tout est fait (l'encart reste, sans bouton « C'est parti »). */
export function getNextStep(steps: StartStep[]): StartStep | undefined {
  return steps.find((step) => !step.done);
}
