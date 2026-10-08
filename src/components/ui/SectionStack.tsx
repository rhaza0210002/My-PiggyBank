"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface StackSection {
  id: string;
  label: string;
  content: ReactNode;
  /** Le contenu porte déjà son propre titre visible : le titre du bloc reste lu par les lecteurs d'écran seulement. */
  hideTitle?: boolean;
}

interface SectionStackProps {
  sections: StackSection[];
  /** Nom de la barre de raccourcis, lu par les lecteurs d'écran. */
  label: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Plusieurs blocs à la suite, dans une seule zone qui défile. Une barre de raccourcis mène à chaque bloc
 * (défilement doux), indique celui qu'on lit, et chaque bloc apparaît quand on y arrive : le contenu n'est
 * monté qu'à ce moment, ce qui relance aussi les animations des graphiques.
 */
export default function SectionStack({ sections, label }: SectionStackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || typeof IntersectionObserver === 'undefined') {
      setRevealed(new Set(sections.map((section) => section.id)));
      return;
    }

    // Bureau : la zone de blocs défile elle-même ; mobile : c'est la page qui défile.
    const root = window.matchMedia('(min-width: 768px)').matches ? scroller : null;

    const revealObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => (entry.target as HTMLElement).dataset.sectionId!);
        if (visible.length === 0) return;
        setRevealed((previous) => new Set([...previous, ...visible]));
      },
      { root, rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );

    const activeObserver = new IntersectionObserver(
      (entries) => {
        const current = entries.find((entry) => entry.isIntersecting);
        if (current) setActiveId((current.target as HTMLElement).dataset.sectionId);
      },
      { root, rootMargin: '-10% 0px -70% 0px' },
    );

    Object.values(sectionRefs.current).forEach((element) => {
      if (!element) return;
      revealObserver.observe(element);
      activeObserver.observe(element);
    });

    return () => {
      revealObserver.disconnect();
      activeObserver.disconnect();
    };
  }, [sections]);

  // Sur mobile la rangée de puces défile : la puce de la partie lue reste visible.
  useEffect(() => {
    const nav = navRef.current;
    const chip = activeId ? chipRefs.current[activeId] : null;
    if (!nav || !chip || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [activeId]);

  const goTo = (id: string) => {
    const element = sectionRefs.current[id];
    if (!element) return;
    setRevealed((previous) => new Set([...previous, id]));
    setActiveId(id);
    element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    element.focus({ preventScroll: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        ref={navRef}
        aria-label={label}
        className="sticky top-0 z-10 flex shrink-0 flex-nowrap justify-start gap-1.5 overflow-x-auto bg-[#f2e6d8] pb-1 shadow-[0_6px_6px_-6px_rgba(93,77,68,0.25)] md:static md:flex-wrap md:justify-center md:overflow-visible md:shadow-none"
      >
        {sections.map((section) => (
          <button
            key={section.id}
            ref={(element) => {
              chipRefs.current[section.id] = element;
            }}
            type="button"
            onClick={() => goTo(section.id)}
            aria-current={activeId === section.id ? 'true' : undefined}
            className="min-h-11 shrink-0 rounded-full border-2 border-[#d8b7a5] bg-[#fff8f2] px-4 text-sm font-semibold text-[#5a4d41] transition hover:-translate-y-0.5 hover:bg-[#F8D5CB] motion-safe:hover:animate-[wiggle_0.4s_ease-in-out_1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] aria-[current=true]:border-[#a3452a] aria-[current=true]:bg-[#F8D5CB] aria-[current=true]:font-bold aria-[current=true]:text-[#7a2f1a]"
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div ref={scrollerRef} className="min-h-0 flex-1 space-y-4 scroll-smooth pt-1 motion-reduce:scroll-auto md:overflow-y-auto">
        {sections.map((section) => {
          const isRevealed = revealed.has(section.id);
          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={(element) => {
                sectionRefs.current[section.id] = element;
              }}
              data-section-id={section.id}
              aria-labelledby={`section-${section.id}-title`}
              tabIndex={-1}
              className="scroll-mt-1 outline-none"
            >
              <h2
                id={`section-${section.id}-title`}
                className={section.hideTitle ? 'sr-only' : 'mb-1 px-1 text-center text-base font-black text-[#5d4d44]'}
              >
                {section.label}
              </h2>
              <div
                className={`min-h-40 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
                  isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 motion-reduce:translate-y-0'
                }`}
              >
                {isRevealed ? section.content : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
