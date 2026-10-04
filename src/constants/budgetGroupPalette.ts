export interface BudgetGroupPalette {
  section: string;
  border: string;
  table: string;
  header: string;
  rowEven: string;
  rowOdd: string;
}

const palettes: BudgetGroupPalette[] = [
  {
    section: 'bg-[#fff5ef]',
    border: 'border-[#dca58d]',
    table: 'bg-[#fffaf7]',
    header: 'bg-[#f0d1c1]',
    rowEven: 'bg-[#fffaf7]',
    rowOdd: 'bg-[#f8e5da]',
  },
  {
    section: 'bg-[#f7f4e8]',
    border: 'border-[#b8a567]',
    table: 'bg-[#fbfaf4]',
    header: 'bg-[#eee3bb]',
    rowEven: 'bg-[#fbfaf4]',
    rowOdd: 'bg-[#f1ecd7]',
  },
  {
    section: 'bg-[#eef7f4]',
    border: 'border-[#83b5a6]',
    table: 'bg-[#f7fcf9]',
    header: 'bg-[#d2e9df]',
    rowEven: 'bg-[#f7fcf9]',
    rowOdd: 'bg-[#e7f3ed]',
  },
  {
    section: 'bg-[#eff4f8]',
    border: 'border-[#8faabd]',
    table: 'bg-[#f8fbfd]',
    header: 'bg-[#d5e4ee]',
    rowEven: 'bg-[#f8fbfd]',
    rowOdd: 'bg-[#e7f0f5]',
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export function getBudgetGroupPalette(key: string, title: string): BudgetGroupPalette {
  const normalizedKey = normalize(key);
  const normalizedTitle = normalize(title);
  const groupName = `${normalizedKey} ${normalizedTitle}`;

  if (groupName.includes('reserve') || groupName.includes('frais')) {
    return palettes[1];
  }
  if (groupName.includes('revenu') || groupName.includes('income') || groupName.includes('salaire')) {
    return palettes[2];
  }
  if (groupName.includes('decaissement') || groupName.includes('service') || groupName.includes('depense')) {
    return palettes[0];
  }

  const stableHash = [...normalizedKey].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  return palettes[stableHash % palettes.length];
}