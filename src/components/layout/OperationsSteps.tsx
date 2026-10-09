"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES, isCurrentPage } from '@/constants/routes';

const STEPS = [
  { href: ROUTES.import, label: 'Importer', hint: 'ton relevé' },
  { href: ROUTES.reconciliation, label: 'Pointer', hint: 'les opérations' },
  { href: ROUTES.actualExpenses, label: 'Bilan', hint: 'du mois' },
] as const;

/** Le parcours des opérations en trois étapes : on voit où on est et ce qui suit. */
export default function OperationsSteps() {
  const pathname = usePathname();

  return (
    <nav aria-label="Étapes des opérations" className="mx-auto w-full max-w-[1200px] shrink-0 px-3 pt-2 sm:px-5">
      <ol className="grid grid-cols-3 gap-1.5">
        {STEPS.map((step, index) => {
          const isCurrent = isCurrentPage(pathname, step.href);
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                aria-current={isCurrent ? 'step' : undefined}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-bordure bg-surface px-2 text-sm font-semibold text-texte transition hover:-translate-y-0.5 hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=step]:border-accent-fort aria-[current=step]:bg-accent-doux aria-[current=step]:font-black aria-[current=step]:text-accent-fort"
              >
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-fort text-xs font-black text-white"
                >
                  {index + 1}
                </span>
                <span className="leading-tight">
                  {step.label}
                  <span className="hidden font-medium sm:inline"> {step.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
