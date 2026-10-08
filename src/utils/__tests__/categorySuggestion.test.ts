import { describe, expect, it } from 'vitest';
import { significantWords, suggestCategory } from '@/utils/categorySuggestion';

const history = [
  { label: 'CARTE X•••• ALDI MARSEILLE 02/10', category_id: 'food' },
  { label: 'CARTE X•••• ALDI MARSEILLE 25/09', category_id: 'food' },
  { label: 'PRLV SEPA EDF CLIENTS PARTICULIERS', category_id: 'edf' },
  { label: 'CARTE X•••• ALDI NICE 01/09', category_id: 'food' },
  { label: 'CARTE X•••• TABAC PRESSE 03/10', category_id: 'tabac' },
];

describe('mots utiles d’un libellé', () => {
  it('retire carte masquée, dates, chiffres et mots de la banque', () => {
    expect(significantWords('CARTE X•••• ALDI MARSEILLE 06/10')).toEqual(['aldi', 'marseille']);
    expect(significantWords('PRLV SEPA Électricité de France 12345678')).toEqual(['electricite', 'france']);
  });
});

describe('catégorie suggérée', () => {
  it('reconnaît un libellé déjà pointé, même avec une autre date ou un autre numéro de carte', () => {
    const suggestion = suggestCategory('CARTE X•••• ALDI MARSEILLE 06/10', history);
    expect(suggestion).toEqual({ categoryId: 'food', kind: 'exact', count: 2 });
  });

  it('suggère une catégorie proche quand l’enseigne revient dans plusieurs pointages', () => {
    const suggestion = suggestCategory('CARTE X•••• ALDI LYON 07/10', history);
    expect(suggestion).toMatchObject({ categoryId: 'food', kind: 'similar' });
  });

  it('ne devine pas sur un seul indice', () => {
    expect(suggestCategory('CARTE X•••• TABAC DE LA GARE 04/10', history)).toBeUndefined();
  });

  it('ne propose rien pour un libellé inconnu ou vide de sens', () => {
    expect(suggestCategory('PAIEMENT 12345', history)).toBeUndefined();
    expect(suggestCategory('RESTAURANT LE SOLEIL', history)).toBeUndefined();
  });
});
