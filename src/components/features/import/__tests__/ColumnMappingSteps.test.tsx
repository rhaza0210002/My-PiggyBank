import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ColumnMappingSteps from '@/components/features/import/ColumnMappingSteps';
import { readCsvTable } from '@/utils/statementImport/csvTable';
import { detectMapping } from '@/utils/statementImport/detectMapping';
import { SG_CSV, TWO_AMOUNTS_CSV } from '@/utils/statementImport/__tests__/fixtures';

const twoAmounts = readCsvTable(TWO_AMOUNTS_CSV)!;
const sg = readCsvTable(SG_CSV)!;

describe('ColumnMappingSteps : une question à la fois', () => {
  const html = renderToStaticMarkup(
    <ColumnMappingSteps
      table={twoAmounts}
      initialMapping={detectMapping(twoAmounts).mapping}
      doubts={['montant']}
      onConfirm={() => {}}
    />,
  );

  it('dit pourquoi et où on en est', () => {
    expect(html).toContain('On n’est pas sûrs de la colonne du montant.');
    expect(html).toContain('Question 1 sur 3');
  });

  it('pose la question de forme avec des boutons à état', () => {
    expect(html).toContain('Ta banque met-elle les sorties et les entrées dans la même colonne ?');
    expect(html.match(/aria-pressed="(true|false)"/g)).toHaveLength(2);
  });

  it('montre l’aperçu dans une zone annoncée aux lecteurs d’écran', () => {
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toContain('Voilà ce que ça donnera');
    expect(html).toContain('CB CARREFOUR');
  });

  it('n’utilise que les couleurs du thème', () => {
    expect(html).not.toMatch(/(bg|text|border)-\[#/);
  });
});

describe('ColumnMappingSteps : question de colonne', () => {
  const html = renderToStaticMarkup(
    <ColumnMappingSteps
      table={sg}
      initialMapping={detectMapping(sg).mapping}
      doubts={['date']}
      onConfirm={() => {}}
    />,
  );

  it('fait de chaque en-tête un bouton nommé', () => {
    expect(html).toContain('aria-label="Choisir la colonne Libellé"');
    expect(html).toContain('Clique sur la colonne de la date.');
  });

  it('la dernière question propose d’importer', () => {
    expect(html).toContain('Importer');
  });
});

describe('ColumnMappingSteps : jamais le solde pour un montant', () => {
  const html = renderToStaticMarkup(
    <ColumnMappingSteps
      table={twoAmounts}
      initialMapping={detectMapping(twoAmounts).mapping}
      doubts={['montant']}
      initialStep={1}
      onConfirm={() => {}}
    />,
  );

  it('ne rend pas la colonne Solde cliquable', () => {
    expect(html).toContain('aria-label="Choisir la colonne Montant 2"');
    expect(html).not.toContain('aria-label="Choisir la colonne Solde"');
  });
});
