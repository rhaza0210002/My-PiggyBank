"use client";

import { useId, useState, type FormEvent } from 'react';
import {
  createCategory,
  type Category,
  type CategoryGroup,
} from '@/services/transactionCategoryService';

interface NewCategoryFormProps {
  groups: CategoryGroup[];
  categories: Category[];
  onCreated: (category: Category) => void;
}

export default function NewCategoryForm({ groups, categories, onCreated }: NewCategoryFormProps) {
  const formId = useId();
  const [label, setLabel] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedGroupId = groupId || String(groups[0]?.id ?? '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = label.trim();
    const group = groups.find((item) => String(item.id) === selectedGroupId);
    if (!name || !group || isSubmitting) return;

    setError(null);
    setStatus(null);

    const alreadyExists = categories.some(
      (category) => category.cat_group_key === group.id && category.label.trim().toLowerCase() === name.toLowerCase(),
    );
    if (alreadyExists) {
      setError(`« ${name} » existe déjà dans « ${group.libelle} ».`);
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCategory(name, group.id);
      onCreated(created);
      setLabel('');
      setStatus(`Catégorie « ${created.label} » créée dans « ${group.libelle} ».`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible de créer la catégorie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className="rounded-[2rem] border-[3px] border-dashed border-[#d7b59d] bg-[#f5eadf] p-3 shadow-[0_3px_0_rgba(140,103,86,0.12)] sm:p-4"
    >
      <h2 id={`${formId}-title`} className="px-2 text-[1.2rem] font-black text-[#5d4d44]">
        Nouvelle catégorie
        <span className="ml-2 rounded-full bg-[#5b473d] px-2 py-0.5 align-middle text-xs font-bold text-[#fff8f2]">
          Administrateur
        </span>
      </h2>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={`${formId}-group`} className="text-sm font-bold text-[#5d4d44]">
            Groupe
          </label>
          <select
            id={`${formId}-group`}
            value={selectedGroupId}
            onChange={(event) => setGroupId(event.target.value)}
            className="min-h-11 rounded-xl border-2 border-[#9c7560] bg-white px-3 text-sm font-semibold text-[#54433d]"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label htmlFor={`${formId}-label`} className="text-sm font-bold text-[#5d4d44]">
            Nom de la catégorie
          </label>
          <input
            id={`${formId}-label`}
            type="text"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            required
            maxLength={60}
            autoComplete="off"
            aria-invalid={error !== null}
            aria-describedby={error ? `${formId}-error` : undefined}
            placeholder="Ex : Transport"
            className="min-h-11 rounded-xl border-2 border-[#9c7560] bg-white px-3 text-sm font-semibold text-[#54433d] placeholder:text-[#7d685c]"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || label.trim() === ''}
          className="min-h-11 rounded-xl border-2 border-[#e4a58f] bg-[#e59a86] px-5 text-sm font-bold text-[#3d2a21] shadow-[0_3px_0_rgba(171,98,77,0.85)] transition-transform hover:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Création…' : 'Créer la catégorie'}
        </button>
      </form>

      {error && (
        <p id={`${formId}-error`} role="alert" className="mt-3 text-sm font-semibold text-[#8a4a1c]">
          {error}
        </p>
      )}
      {status && (
        <p role="status" className="mt-3 text-sm font-semibold text-[#2f5d32]">
          {status}
        </p>
      )}
    </section>
  );
}
