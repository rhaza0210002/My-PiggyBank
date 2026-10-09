"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES, isCurrentPage } from "@/constants/routes";

const STEPS = [
  { href: ROUTES.import, label: "Importer", hint: "ton relevé" },
  { href: ROUTES.reconciliation, label: "Pointer", hint: "les opérations" },
  { href: ROUTES.actualExpenses, label: "Bilan", hint: "du mois" },
] as const;

/** Le parcours des opérations en trois étapes : on voit où on est et ce qui suit. */
export default function OperationsSteps() {
  const pathname = usePathname();
  const listId = useId();
  const [isOpen, setIsOpen] = useState(false);
  // Sur le bilan, la page prend toute la place : les étapes se déplient à la demande.
  const isCollapsible = isCurrentPage(pathname, ROUTES.actualExpenses);
  const isShown = !isCollapsible || isOpen;

  return (
    <nav
      aria-label="Étapes des opérations"
      className="mx-auto w-full max-w-[1200px] shrink-0 px-3 pt-2 sm:px-5"
    >
      {isCollapsible && (
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={listId}
          className="flex min-h-11 w-full items-center justify-between gap-2 rounded-2xl border-2 border-bordure bg-surface px-3 text-sm font-bold text-texte transition hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <span>Étapes · 3 Bilan du mois</span>
          <span
            aria-hidden="true"
            className={`text-lg transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </button>
      )}
      {isShown && (
        <ol
          id={listId}
          className={`grid grid-cols-3 gap-1.5 ${isCollapsible ? "mt-1.5" : ""}`}
        >
          {STEPS.map((step, index) => {
            const isCurrent = isCurrentPage(pathname, step.href);
            return (
              <li key={step.href}>
                <Link
                  href={step.href}
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-bordure bg-surface px-2 text-sm font-semibold text-texte transition hover:-translate-y-0.5 hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=step]:border-accent-fort aria-[current=step]:bg-accent-doux aria-[current=step]:font-black aria-[current=step]:text-accent-fort"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-fort text-xs font-black text-surface"
                  >
                    {index + 1}
                  </span>
                  <span className="leading-tight">
                    {step.label}
                    <span className="hidden font-medium sm:inline">
                      {" "}
                      {step.hint}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
