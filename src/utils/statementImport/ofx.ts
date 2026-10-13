import type { StatementLine } from './types';

export function isOfx(text: string): boolean {
  return /<OFX>/i.test(text) || /^\s*OFXHEADER/i.test(text);
}

const pad = (value: string) => value.padStart(2, '0');

/** Valeur d'un champ, que la balise soit fermée (XML) ou non (SGML, valeur jusqu'à la fin de ligne). */
function field(block: string, name: string): string {
  const match = new RegExp(`<${name}>([^<\\r\\n]*)`, 'i').exec(block);
  return match ? match[1].trim() : '';
}

/** Opérations d'un relevé OFX : chaque bloc <STMTTRN> donne date (DTPOSTED), montant (TRNAMT), libellé (NAME) et détail (MEMO). */
export function parseOfx(text: string): StatementLine[] {
  const blocks = text.split(/<STMTTRN>/i).slice(1).map((block) => block.split(/<\/STMTTRN>|<\/BANKTRANLIST>/i)[0]);

  return blocks.flatMap((block): StatementLine[] => {
    const posted = /^(\d{4})(\d{2})(\d{2})/.exec(field(block, 'DTPOSTED'));
    const amount = Number(field(block, 'TRNAMT').replace(',', '.'));
    const label = field(block, 'NAME') || field(block, 'MEMO');
    if (!posted || !Number.isFinite(amount) || field(block, 'TRNAMT') === '' || !label) return [];

    const detail = field(block, 'NAME') ? field(block, 'MEMO') : '';
    return [{ date: `${pad(posted[3])}/${pad(posted[2])}/${posted[1]}`, label, detail, amount }];
  });
}
