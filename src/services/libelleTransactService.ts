import { supabase } from '@/lib/supabaseClient';
import { requireUserId } from '@/lib/currentUser';
import {
  planRuleChanges,
  type ExistingRule,
  type ImportedRule,
} from '@/utils/labelRulePlanning';

export type ImportedTransactionLabel = ImportedRule;

export interface SaveTransactionLabelsResult {
  inserted: number;
  updated: number;
  /** Règles déjà présentes à l'identique (par défaut ou personnelles). */
  skipped: number;
}

/**
 * Enregistre les règles libellé → catégorie reconnues à l'import, en tant que règles personnelles
 * de l'utilisateur connecté. Les règles par défaut ne sont jamais modifiées.
 */
export async function saveImportedTransactionLabels(
  importedLabels: ImportedTransactionLabel[],
): Promise<SaveTransactionLabelsResult> {
  const userId = await requireUserId('Vous devez être connecté pour enregistrer les libellés.');

  const { data: existingLabels, error: existingError } = await supabase
    .from('libelle_transacts')
    .select('id, label, key, id_cat, user_id');

  if (existingError) {
    throw new Error(`Lecture des libellés impossible : ${existingError.message}`);
  }

  const plan = planRuleChanges(
    importedLabels,
    (existingLabels ?? []) as ExistingRule[],
    userId,
  );

  if (plan.inserts.length > 0) {
    const rows = plan.inserts.map((record) => ({ ...record, user_id: userId }));
    const { error } = await supabase.from('libelle_transacts').insert(rows);
    if (error) {
      throw new Error(`Insertion des libellés impossible : ${error.message}`);
    }
  }

  const updateResults = await Promise.all(
    plan.updates.map(({ id, ...record }) =>
      supabase.from('libelle_transacts').update(record).eq('id', id),
    ),
  );
  const updateError = updateResults.find((result) => result.error)?.error;
  if (updateError) {
    throw new Error(`Mise à jour des libellés impossible : ${updateError.message}`);
  }

  return {
    inserted: plan.inserts.length,
    updated: plan.updates.length,
    skipped: plan.unchanged,
  };
}
