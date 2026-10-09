"use client";

import { useId, useState, type FormEvent } from 'react';
import { saveImportedTransactionLabels } from '@/services/libelleTransactService';
import type { Category } from '@/services/transactionCategoryService';
import { checkRuleKeyword, suggestRuleKeyword } from '@/utils/labelMatching';

interface LabelRuleFormProps {
  transactionLabel: string;
  category: Category;
  onSaved: (message: string) => void;
  onCancel: () => void;
}

const PROBLEM_MESSAGES = {
  'too-short': 'Le mot-clé doit contenir au moins 3 lettres ou chiffres.',
  'not-in-label': "Le mot-clé doit apparaître dans le libellé de l'opération.",
} as const;

export default function LabelRuleForm({ transactionLabel, category, onSaved, onCancel }: LabelRuleFormProps) {
  const fieldId = useId();
  const [keyword, setKeyword] = useState(() => suggestRuleKeyword(transactionLabel));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const name = keyword.trim();
    const problem = checkRuleKeyword(name, transactionLabel);
    if (problem) {
      setError(PROBLEM_MESSAGES[problem]);
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const result = await saveImportedTransactionLabels([
        { label: name, key: category.label, categoryId: category.id },
      ]);
      onSaved(
        result.inserted + result.updated > 0
          ? `Règle enregistrée : « ${name} » → ${category.label}. Elle s'appliquera aux prochains imports.`
          : `La règle « ${name} » → ${category.label} existait déjà.`,
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer la règle.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-bordure-forte bg-surface/60 p-3 sm:flex-row sm:items-end"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-bold text-texte">
          Mot-clé du libellé à retenir pour « {category.label} »
        </label>
        <input
          id={fieldId}
          type="text"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          required
          autoComplete="off"
          aria-invalid={error !== null}
          aria-describedby={`${fieldId}-help${error ? ` ${fieldId}-error` : ''}`}
          className="min-h-11 rounded-xl border-2 border-bordure-forte bg-surface px-3 text-sm font-semibold text-texte"
        />
        <p id={`${fieldId}-help`} className="text-xs text-texte-doux">
          Les prochaines opérations dont le libellé contient ce mot seront classées automatiquement. Garde un mot
          précis (ex : ALDI) pour éviter les faux positifs.
        </p>
        {error && (
          <p id={`${fieldId}-error`} role="alert" className="text-sm font-semibold text-attention">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSaving}
          className="min-h-11 rounded-xl border-2 border-bordure bg-accent px-4 text-sm font-bold text-sur-accent disabled:opacity-60"
        >
          {isSaving ? 'Enregistrement…' : 'Enregistrer la règle'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-xl border border-bordure-forte bg-surface/70 px-4 text-sm font-bold text-texte"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
