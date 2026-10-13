import { describe, expect, it } from 'vitest';
import { isOfx, parseOfx } from '@/utils/statementImport/ofx';
import { OFX_EMPTY, OFX_SGML, OFX_XML, SG_CSV } from './fixtures';

const expected = [
  { date: '02/09/2026', label: 'CARREFOUR', detail: 'CB 01/09', amount: -54.2 },
  { date: '03/09/2026', label: 'VIR SALAIRE', detail: '', amount: 1850 },
];

describe('OFX', () => {
  it('reconnaît un OFX, ancien ou récent, et pas un CSV', () => {
    expect(isOfx(OFX_SGML)).toBe(true);
    expect(isOfx(OFX_XML)).toBe(true);
    expect(isOfx(SG_CSV)).toBe(false);
  });

  it('lit les opérations d’un OFX 1.x (balises non fermées)', () => {
    expect(parseOfx(OFX_SGML)).toEqual(expected);
  });

  it('lit les opérations d’un OFX 2.x (XML)', () => {
    expect(parseOfx(OFX_XML)).toEqual(expected);
  });

  it('rend une liste vide quand il n’y a aucune opération', () => {
    expect(parseOfx(OFX_EMPTY)).toEqual([]);
  });
});
