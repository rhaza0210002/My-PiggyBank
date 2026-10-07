import { supabase } from '@/lib/supabaseClient';

export interface ImportedTransactionLabel {
  label: string;
  key: string;
  categoryId: string;
}

export interface SaveTransactionLabelsResult {
  inserted: number;
  updated: number;
  skipped: number;
}

interface ExistingTransactionLabel {
  id: string;
  label: string;
  key: string;
  id_cat: string;
}

function normalize(value: string): string {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export async function saveImportedTransactionLabels(
  importedLabels: ImportedTransactionLabel[],
): Promise<SaveTransactionLabelsResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('Vous devez être connecté pour enregistrer les libellés.');
  }

  const { data: existingLabels, error: existingError } = await supabase
    .from('libelle_transacts')
    .select('id, label, key, id_cat');

  if (existingError) {
    throw new Error(`Lecture des libellés impossible : ${existingError.message}`);
  }

  const existingByLabel = new Map<string, ExistingTransactionLabel>(
    ((existingLabels ?? []) as ExistingTransactionLabel[]).map((entry) => [
      normalize(entry.label),
      entry,
    ]),
  );
  const uniqueLabels = new Map<string, ImportedTransactionLabel>();

  importedLabels.forEach((entry) => {
    const label = entry.label.trim();
    if (!label || !entry.key || !entry.categoryId) return;
    uniqueLabels.set(normalize(label), { ...entry, label });
  });

  const inserts: Array<{ label: string; key: string; id_cat: string }> = [];
  const updates: Array<{ id: string; label: string; key: string; id_cat: string }> = [];
  let skipped = 0;

  uniqueLabels.forEach((entry, normalizedLabel) => {
    if (!entry.categoryId) {
      skipped += 1;
      return;
    }

    const existing = existingByLabel.get(normalizedLabel);
    const record = { label: entry.label, key: entry.key, id_cat: entry.categoryId };

    if (existing) {
      if (existing.key !== record.key || existing.id_cat !== record.id_cat) {
        updates.push({ id: existing.id, ...record });
      }
      return;
    }

    inserts.push(record);
  });

  if (inserts.length > 0) {
    const { error } = await supabase.from('libelle_transacts').insert(inserts);
    if (error) {
      throw new Error(`Insertion des libellés impossible : ${error.message}`);
    }
  }

  const updateResults = await Promise.all(
    updates.map(({ id, ...record }) =>
      supabase.from('libelle_transacts').update(record).eq('id', id),
    ),
  );
  const updateError = updateResults.find((result) => result.error)?.error;
  if (updateError) {
    throw new Error(`Mise à jour des libellés impossible : ${updateError.message}`);
  }

  return {
    inserted: inserts.length,
    updated: updates.length,
    skipped,
  };
}