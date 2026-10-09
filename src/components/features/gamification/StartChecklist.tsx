import Link from 'next/link';
import { getNextStep, type StartStep } from '@/utils/startSteps';

interface StartChecklistProps {
  steps: StartStep[];
}

/** Encart « 3 pas pour commencer » : un seul pas mis en avant à la fois, les autres restent lisibles. */
export default function StartChecklist({ steps }: StartChecklistProps) {
  const next = getNextStep(steps);
  if (!next) return null;
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section
      aria-labelledby="start-title"
      className="shrink-0 rounded-3xl border-[3px] border-dashed border-[#e4a58f] bg-[#fff1ea] p-3 text-center shadow-sm sm:p-4"
    >
      <h2 id="start-title" className="text-sm font-bold uppercase tracking-[0.15em] text-[#a3452a]">
        Pour commencer · {doneCount} sur {steps.length}
      </h2>
      <ol className="mt-2 grid gap-2 md:grid-cols-3">
        {steps.map((step, index) => {
          const isNext = step.id === next.id;
          return (
            <li
              key={step.id}
              aria-current={isNext ? 'step' : undefined}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 ${
                step.done
                  ? 'border-[#a8d0b9] bg-[#eaf5ee]'
                  : isNext
                    ? 'border-[#a3452a] bg-white'
                    : 'border-[#e5c4b4] bg-white/60'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
                  step.done ? 'bg-[#3f7f66] text-white' : 'bg-[#a3452a] text-white'
                }`}
              >
                {step.done ? '✓' : index + 1}
              </span>
              <p className="font-bold text-[#5a4d41]">
                {step.title}
                {step.done && <span className="sr-only"> : fait</span>}
              </p>
              {!step.done && <p className="text-xs text-[#6b574c]">{step.hint}</p>}
              {isNext && (
                <Link
                  href={step.href}
                  className="mt-1 inline-flex min-h-11 items-center rounded-carte border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 font-black text-[#3d2a21] shadow-bonbon transition-transform hover:translate-y-[2px] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
                >
                  C’est parti
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
