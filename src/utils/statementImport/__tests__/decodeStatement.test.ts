import { describe, expect, it } from 'vitest';
import { decodeStatement } from '@/utils/statementImport/decodeStatement';

const bytes = (buffer: Buffer): ArrayBuffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

describe('decodeStatement : ouvrir le fichier de la banque', () => {
  it('lit l’UTF-8', () => {
    expect(decodeStatement(bytes(Buffer.from('Opération;Débit', 'utf8')))).toBe('Opération;Débit');
  });

  it('retire la marque invisible de début de fichier (BOM)', () => {
    const text = decodeStatement(bytes(Buffer.from('﻿Date;Libellé', 'utf8')));
    expect(text).toBe('Date;Libellé');
    expect(text.startsWith('﻿')).toBe(false);
  });

  it('bascule en windows-1252 quand l’UTF-8 est invalide : plus de « Ã© »', () => {
    expect(decodeStatement(bytes(Buffer.from('Opération;Débit', 'latin1')))).toBe('Opération;Débit');
  });

  it('rend une chaîne vide pour un fichier vide', () => {
    expect(decodeStatement(new ArrayBuffer(0))).toBe('');
  });
});
