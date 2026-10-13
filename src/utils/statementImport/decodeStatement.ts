/**
 * Texte d'un relevé lu en octets. Les banques exportent en UTF-8 ou en windows-1252 : on tente l'UTF-8 strict,
 * et s'il est invalide on relit en windows-1252 (sinon les accents deviennent « Ã© »). Le BOM est retiré.
 */
export function decodeStatement(bytes: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('windows-1252').decode(bytes);
  }
  return text.replace(/^﻿/, '');
}
