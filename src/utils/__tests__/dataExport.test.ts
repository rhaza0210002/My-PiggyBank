import { describe, expect, it } from 'vitest';
import { buildDataExport, exportFileName, type ExportInput } from '@/utils/dataExport';

const input: ExportInput = {
  exportedAt: new Date('2026-10-08T12:00:00Z'),
  profile: { email: 'a@b.fr', pseudo: 'Moi' },
  settings: { notify_reconcile: true, notify_budget_overrun: false },
  categoryGroups: [{ id: 1, label: 'decaissement', libelle: 'Décaissement services' }],
  categories: [{ id: 'loyer', label: 'Loyer', cat_group_key: 1 }],
  transactions: [
    { booked_on: '2026-10-02', label: 'VIR LOYER', amount: '-129.00', category_id: 'loyer', type: 'VIREMENT_SORTANT', reconciled_at: null },
    { booked_on: '2026-10-03', label: 'INCONNU', amount: 5, category_id: null, type: 'AUTRE', reconciled_at: '2026-10-04T00:00:00Z' },
  ],
  budgetEntries: [
    { category_id: 'loyer', month_index: 9, year: 2026, amount: '129.00' },
    { category_id: 'disparue', month_index: 0, year: 2026, amount: 10 },
  ],
  labelRules: [{ label: 'aldi', key: 'Alimentation', id_cat: 'absente' }],
};

describe('buildDataExport', () => {
  const result = buildDataExport(input);

  it('remplace les identifiants par des noms lisibles et convertit les montants', () => {
    expect(result.transactions[0]).toMatchObject({ libelle: 'VIR LOYER', montant: -129, categorie: 'Loyer' });
    expect(result.transactions[1].categorie).toBeNull();
  });

  it('numérote les mois de 1 à 12 et rattache le groupe', () => {
    expect(result.budget[0]).toEqual({ annee: 2026, mois: 10, groupe: 'Décaissement services', categorie: 'Loyer', montant: 129 });
    expect(result.budget[1].categorie).toBe('Catégorie supprimée');
  });

  it('garde le nom de catégorie de la règle quand la catégorie a disparu', () => {
    expect(result.reglesDeLibelle).toEqual([{ motCle: 'aldi', categorie: 'Alimentation' }]);
  });

  it('inclut le profil, les réglages et la date d’export', () => {
    expect(result.profile?.email).toBe('a@b.fr');
    expect(result.settings?.notify_budget_overrun).toBe(false);
    expect(result.exportedAt).toBe('2026-10-08T12:00:00.000Z');
  });
});

describe('exportFileName', () => {
  it('contient la date du jour', () => {
    expect(exportFileName(new Date('2026-10-08T12:00:00Z'))).toBe('my-piggybank-mes-donnees-2026-10-08.json');
  });
});
