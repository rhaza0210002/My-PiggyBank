export interface ImportedRule {
  label: string;
  key: string;
  categoryId: string;
}

export interface ExistingRule {
  id: string;
  label: string;
  key: string;
  id_cat: string | null;
  /** NULL : règle par défaut partagée ; sinon propriétaire de la règle. */
  user_id: string | null;
}

export interface RulePlan {
  inserts: Array<{ label: string; key: string; id_cat: string }>;
  updates: Array<{ id: string; label: string; key: string; id_cat: string }>;
  /** Règles déjà couvertes (identiques à une règle existante). */
  unchanged: number;
}

export function normalizeRuleLabel(value: string): string {
  return value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Décide quoi écrire pour les règles reconnues à l'import. Une règle par défaut ne se modifie pas :
 * si elle diffère, on crée une règle personnelle qui prend le dessus. Une règle personnelle déjà
 * présente est mise à jour si elle a changé.
 */
export function planRuleChanges(imported: ImportedRule[], existing: ExistingRule[], userId: string): RulePlan {
  const own = new Map<string, ExistingRule>();
  const defaults = new Map<string, ExistingRule>();

  existing.forEach((rule) => {
    const normalized = normalizeRuleLabel(rule.label);
    if (rule.user_id === userId) own.set(normalized, rule);
    else if (rule.user_id === null) defaults.set(normalized, rule);
  });

  const unique = new Map<string, ImportedRule>();
  imported.forEach((rule) => {
    const label = rule.label.trim();
    if (!label || !rule.key || !rule.categoryId) return;
    unique.set(normalizeRuleLabel(label), { ...rule, label });
  });

  const plan: RulePlan = { inserts: [], updates: [], unchanged: 0 };

  unique.forEach((rule, normalized) => {
    const record = { label: rule.label, key: rule.key, id_cat: rule.categoryId };
    const personal = own.get(normalized);
    const fallback = defaults.get(normalized);

    if (personal) {
      if (personal.key === record.key && personal.id_cat === record.id_cat) plan.unchanged += 1;
      else plan.updates.push({ id: personal.id, ...record });
      return;
    }

    if (fallback && fallback.key === record.key && fallback.id_cat === record.id_cat) {
      plan.unchanged += 1;
      return;
    }

    plan.inserts.push(record);
  });

  return plan;
}
