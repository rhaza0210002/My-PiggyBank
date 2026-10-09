import Link from 'next/link';
import { getNextStep, type StartStep } from '@/utils/startSteps';

interface StartChecklistProps {
  steps: StartStep[];
}

/** Encart « 3 pas pour commencer » : un seul pas mis en avant à la fois, les autres restent lisibles. Il reste affiché une fois tout fait, pour garder le parcours en tête. */
export default function StartChecklist({ steps }: StartChecklistProps) {
  const next = getNextStep(steps);
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section
      aria-labelledby="start-title"
      className="shrink-0 rounded-3xl border-2 border-dashed border-bordure bg-surface p-3 text-center shadow-sm sm:p-4"
    >
      <h2 id="start-title" className="text-sm font-bold uppercase tracking-[0.15em] text-accent-fort">
        Pour commencer · {doneCount} sur {steps.length}
      </h2>
      <ol className="mt-2 grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => {
          const isNext = step.id === next?.id;
          return (
            <li
              key={step.id}
              aria-current={isNext ? 'step' : undefined}
              className={`flex flex-col items-center gap-1 rounded-2xl border-[1.5px] p-3 ${
                step.done
                  ? 'border-bordure bg-ok-fond'
                  : isNext
                    ? 'border-accent-fort bg-surface'
                    : 'border-bordure bg-surface/60'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
                  step.done ? 'bg-ok text-surface' : 'bg-accent-fort text-surface'
                }`}
              >
                {step.done ? '✓' : index + 1}
              </span>
              <p className="font-bold text-texte">
                {step.title}
                {step.done && <span className="sr-only"> : fait</span>}
              </p>
              {!step.done && <p className="text-xs text-texte-doux">{step.hint}</p>}
              {step.done && step.edit.note && <p className="text-xs text-texte-doux">{step.edit.note}</p>}
              {isNext ? (
                <Link
                  href={step.href}
                  className="mt-1 inline-flex min-h-11 items-center rounded-carte border-2 border-bordure bg-accent px-5 font-black text-sur-accent shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  C’est parti
                </Link>
              ) : step.done ? (
                <Link href={step.href} aria-label={step.edit.ariaLabel} className="mt-1 inline-flex min-h-11 items-center rounded-carte border-2 border-texte bg-surface px-5 font-black text-texte shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {step.edit.label}
                </Link>
              ) : (
                <Link href={step.href} className="mt-1 inline-flex min-h-11 items-center rounded-carte border-2 border-texte bg-surface px-5 font-black text-texte shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus">
                  {step.action}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
