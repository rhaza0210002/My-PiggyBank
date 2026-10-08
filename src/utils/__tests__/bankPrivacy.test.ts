import { describe, expect, it } from 'vitest';
import { fingerprint, sanitizeBankLabel } from '@/utils/bankPrivacy';

describe('libellé bancaire minimisé', () => {
  it('masque le numéro de carte partiel mais garde l’enseigne', () => {
    expect(sanitizeBankLabel('CARTE X3076 ALDI MARSEILLE 06/10')).toBe('CARTE X•••• ALDI MARSEILLE 06/10');
  });

  it('masque IBAN, e-mail et longues références', () => {
    const label = 'VIR M DUPONT FR76 3000 6000 0112 3456 7890 189 jean@mail.fr REF 12345678901';
    const result = sanitizeBankLabel(label);
    expect(result).not.toMatch(/FR76|3000|jean@|12345678901/);
    expect(result).toContain('M DUPONT');
  });

  it('laisse intacts les libellés ordinaires et les dates courtes', () => {
    expect(sanitizeBankLabel('PRLV EDF 05/10')).toBe('PRLV EDF 05/10');
  });
});

describe('empreinte anti-doublon', () => {
  it('est stable, hexadécimale sur 64 caractères et sans texte lisible', async () => {
    const value = '2026-10-06|-34.52|carte x3076 aldi marseille 06/10|1';
    const first = await fingerprint(value);
    expect(first).toBe(await fingerprint(value));
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toContain('aldi');
  });

  it('correspond à la valeur SHA-256 connue', async () => {
    expect(await fingerprint('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
