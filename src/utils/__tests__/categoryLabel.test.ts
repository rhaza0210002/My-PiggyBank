import { describe, expect, it } from 'vitest';
import { categoryLabelError, normalizeCategoryLabel } from '@/utils/categoryLabel';

describe('categoryLabelError', () => {
  it('accepte les noms ordinaires, accents et ponctuation simple compris', () => {
    for (const name of ['Cadeaux', 'Téléphone & Internet', 'C.A.F', 'Œuvres (dons)', 'Sport / loisirs', 'Noël 2026', "Frais d'école", 'Frais d’école']) {
      expect(categoryLabelError(name), name).toBeNull();
    }
  });

  it('refuse le vide et les noms trop longs', () => {
    expect(categoryLabelError('   ')).toMatch(/obligatoire/);
    expect(categoryLabelError('a'.repeat(41))).toMatch(/40 caractères/);
    expect(categoryLabelError('a'.repeat(40))).toBeNull();
  });

  it('refuse toute tentative d’injection : balises, scripts, guillemets, SQL, caractères de contrôle', () => {
    for (const name of ['<script>alert(1)</script>', 'Loyer<img src=x>', 'a"b', "x'; drop table users; --", 'Loyer\u0000', 'Bip\u0007','a`b', 'a{b}', 'a$b']) {
      expect(categoryLabelError(name), JSON.stringify(name)).not.toBeNull();
    }
  });

  it('refuse un début de formule de tableur (=, +, -, @)', () => {
    for (const name of ['=SOMME(A1)', '+33', '-5', '@cmd']) {
      expect(categoryLabelError(name), name).toMatch(/commence par une lettre ou un chiffre/);
    }
  });
});

describe('normalizeCategoryLabel', () => {
  it('retire les espaces en trop, comme la base', () => {
    expect(normalizeCategoryLabel('  Petits   plaisirs ')).toBe('Petits plaisirs');
  });
});
