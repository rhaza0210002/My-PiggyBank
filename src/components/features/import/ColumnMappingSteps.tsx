"use client";

import { useState } from 'react';
import { MONTHS } from '@/constants/tableStyles';
import { signedEuroFormatter } from '@/utils/formatEuro';
import { applyMapping } from '@/utils/statementImport/applyMapping';
import {
  answerAmountShape,
  answerColumn,
  answerDateOrder,
  buildQuestions,
  columnFor,
  doubtReason,
  missingParts,
  selectableColumns,
  type ColumnRole,
  type Question,
} from '@/utils/statementImport/mappingQuestions';
import type { ColumnMapping, CsvTable, Doubt } from '@/utils/statementImport/types';

interface ColumnMappingStepsProps {
  table: CsvTable;
  initialMapping: ColumnMapping;
  doubts: Doubt[];
  onConfirm: (mapping: ColumnMapping) => void;
  /** Question affichée en premier (0 par défaut). */
  initialStep?: number;
}

const COLUMN_TITLES: Record<ColumnRole, string> = {
  date: 'Clique sur la colonne de la date.',
  label: 'Clique sur la colonne du libellé.',
  amount: 'Clique sur la colonne du montant.',
  debit: 'Clique sur la colonne des sorties d’argent (débit).',
  credit: 'Clique sur la colonne des entrées d’argent (crédit).',
};

const CHOICE =
  'min-h-11 rounded-2xl border-2 border-texte px-4 py-2 text-left text-sm font-bold text-texte transition-colors hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-pressed:bg-accent motion-reduce:transition-none';
const ACTION =
  'min-h-11 rounded-full border-2 border-texte px-5 text-sm font-black text-texte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-55';

/** « le 6 juillet » pour une date jj/mm lue dans un sens donné. */
function readAs(sample: string, order: 'dmy' | 'mdy'): string {
  const [first, second] = sample.split(/[/.-]/).map(Number);
  const [day, month] = order === 'dmy' ? [first, second] : [second, first];
  return `le ${day} ${MONTHS[month - 1].label.toLowerCase()}`;
}

function QuestionTitle({ question }: { question: Question }) {
  if (question.kind === 'amountShape') return <>Ta banque met-elle les sorties et les entrées dans la même colonne ?</>;
  if (question.kind === 'dateOrder') {
    return (
      <>
        « {question.sample} », c’est {readAs(question.sample, 'dmy')} ou {readAs(question.sample, 'mdy')} ?
      </>
    );
  }
  return <>{COLUMN_TITLES[question.role]}</>;
}

/**
 * Étape « associer les colonnes » : affichée seulement quand la lecture a un doute. Une question à la fois,
 * la supposition déjà choisie, et l'aperçu des premières opérations qui suit chaque réponse.
 */
export default function ColumnMappingSteps({ table, initialMapping, doubts, onConfirm, initialStep = 0 }: ColumnMappingStepsProps) {
  const [mapping, setMapping] = useState(initialMapping);
  const [step, setStep] = useState(initialStep);

  const questions = buildQuestions(doubts, mapping, table);
  const index = Math.min(step, questions.length - 1);
  const question = questions[index];
  const isLast = index === questions.length - 1;
  const missing = missingParts(mapping);
  const preview = applyMapping(table, mapping).lines.slice(0, 3);

  const columnRole = question?.kind === 'column' ? question.role : null;
  const selected = columnRole ? columnFor(mapping, columnRole) : null;
  const clickable = columnRole ? selectableColumns(table, columnRole) : [];

  const cellTone = (column: number) => (column === selected ? 'bg-accent' : '');

  return (
    <section aria-labelledby="associer-titre" className="space-y-4 rounded-carte border-2 border-texte bg-surface p-4 shadow-sticker-petit">
      <p className="rounded-xl bg-attention-fond px-4 py-2.5 text-sm font-semibold text-attention">{doubtReason(doubts)}</p>

      {question && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-texte-doux">
            Question {index + 1} sur {questions.length}
          </p>
          <h2 id="associer-titre" className="text-lg font-black text-texte">
            <QuestionTitle question={question} />
          </h2>

          {question.kind === 'amountShape' && (
            <div role="group" aria-labelledby="associer-titre" className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={mapping.amount.kind === 'split'}
                onClick={() => setMapping(answerAmountShape(mapping, 'split'))}
                className={CHOICE}
              >
                Non, deux colonnes séparées
              </button>
              <button
                type="button"
                aria-pressed={mapping.amount.kind === 'single'}
                onClick={() => setMapping(answerAmountShape(mapping, 'single'))}
                className={CHOICE}
              >
                Oui, une seule colonne avec des « - »
              </button>
            </div>
          )}

          {question.kind === 'dateOrder' && (
            <div role="group" aria-labelledby="associer-titre" className="flex flex-wrap gap-2">
              {(['dmy', 'mdy'] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  aria-pressed={mapping.dateOrder === order}
                  onClick={() => setMapping(answerDateOrder(mapping, order))}
                  className={CHOICE}
                >
                  C’est {readAs(question.sample, order)}
                </button>
              ))}
            </div>
          )}

          {columnRole && (
            <p className="text-sm text-texte-doux">
              Notre supposition est surlignée. Clique sur une autre colonne pour changer.
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border-[1.5px] border-bordure-forte">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Les 5 premières lignes de ton fichier</caption>
          <thead className="bg-surface-douce">
            <tr>
              {table.headers.map((header, column) => (
                <th key={column} scope="col" className={`whitespace-nowrap px-3 py-2 text-left font-bold text-texte ${cellTone(column)}`}>
                  {columnRole && clickable.includes(column) ? (
                    <button
                      type="button"
                      aria-label={`Choisir la colonne ${header}`}
                      aria-pressed={column === selected}
                      onClick={() => setMapping(answerColumn(mapping, columnRole, column))}
                      className="-mx-2 rounded-lg px-2 py-1 text-left font-bold underline decoration-2 underline-offset-4 hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {header}
                    </button>
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-bordure">
                {table.headers.map((_, column) => (
                  <td
                    key={column}
                    onClick={columnRole && clickable.includes(column) ? () => setMapping(answerColumn(mapping, columnRole, column)) : undefined}
                    className={`whitespace-nowrap px-3 py-2 text-texte ${cellTone(column)} ${columnRole && clickable.includes(column) ? 'cursor-pointer' : ''}`}
                  >
                    {row[column] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div aria-live="polite" className="space-y-1.5">
        <h3 className="text-base font-black text-texte">Voilà ce que ça donnera</h3>
        {missing.length > 0 ? (
          <p className="rounded-xl bg-depasse-fond px-4 py-2 text-sm font-semibold text-depasse">
            Il manque encore : {missing.join(', ')}.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {preview.map((line, lineIndex) => (
              <li key={lineIndex} className="flex justify-between gap-3 rounded-xl border-[1.5px] border-bordure bg-surface px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-texte">
                  {line.date} · <strong>{line.label}</strong>
                  {line.detail && <span className="text-texte-doux"> · {line.detail}</span>}
                </span>
                <span className={`shrink-0 font-black tabular-nums ${line.amount < 0 ? 'text-depasse' : 'text-ok'}`}>
                  {signedEuroFormatter.format(line.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {index > 0 && (
          <button type="button" onClick={() => setStep(index - 1)} className={`${ACTION} bg-surface`}>
            Retour
          </button>
        )}
        {isLast || !question ? (
          <button type="button" disabled={missing.length > 0} onClick={() => onConfirm(mapping)} className={`${ACTION} bg-accent`}>
            Importer
          </button>
        ) : (
          <button type="button" onClick={() => setStep(index + 1)} className={`${ACTION} bg-accent`}>
            C’est ça
          </button>
        )}
      </div>
    </section>
  );
}
