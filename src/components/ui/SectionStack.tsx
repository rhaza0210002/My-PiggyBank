"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { findScrollParent } from '@/utils/scroll';

export interface StackSection {
  id: string;
  label: string;
  content: ReactNode;
  /** Le contenu porte déjà son propre titre visible : le titre du bloc reste lu par les lecteurs d'écran seulement. */
  hideTitle?: boolean;
  /** Bloc court (un formulaire) : il garde la hauteur de son contenu au lieu de remplir la zone. */
  fit?: boolean;
}

interface SectionStackProps {
  sections: StackSection[];
  /** Nom de la barre de raccourcis, lu par les lecteurs d'écran. */
  label: string;
  /** Fond de la rangée de puces collante (doit être celui du conteneur pour ne pas former de bande). */
  background?: 'surface' | 'surface-douce';
  /**
   * Sur ordinateur, la zone a une hauteur fixe (le cadre de l'écran) : chaque bloc devient une carte de cette
   * hauteur, avec accroche douce. À laisser éteint quand la zone s'étire avec son contenu (import de relevé).
   */
  fillZone?: boolean;
}

/** Le premier bloc est toujours monté : sur l'import, les blocs n'arrivent qu'après le choix d'un fichier. */
export function withFirstRevealed(previous: ReadonlySet<string>, sections: StackSection[]): ReadonlySet<string> {
  const first = sections[0]?.id;
  return first && !previous.has(first) ? new Set([...previous, first]) : previous;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SCROLL_DURATION_MS = 650;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Défilement animé (départ et arrivée en douceur). La cible est recalculée à chaque image : les blocs qui
 * apparaissent en chemin ne font pas sauter l'animation. Un geste de l'utilisateur la coupe aussitôt.
 */
function animateScroll(parent: HTMLElement, getTargetTop: () => number, onDone: () => void): () => void {
  const startTop = parent.scrollTop;
  const startTime = performance.now();
  let frame = 0;

  const stop = () => {
    cancelAnimationFrame(frame);
    parent.removeEventListener('wheel', stop);
    parent.removeEventListener('touchstart', stop);
    parent.removeEventListener('keydown', stop);
  };

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / SCROLL_DURATION_MS);
    parent.scrollTop = startTop + (getTargetTop() - startTop) * easeInOutCubic(progress);
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      stop();
      onDone();
    }
  };

  parent.addEventListener('wheel', stop, { passive: true });
  parent.addEventListener('touchstart', stop, { passive: true });
  parent.addEventListener('keydown', stop);
  frame = requestAnimationFrame(step);
  return stop;
}

/**
 * Plusieurs blocs à la suite, dans une seule zone qui défile. Une barre de raccourcis mène à chaque bloc
 * (défilement doux), indique celui qu'on lit, et chaque bloc apparaît quand on y arrive : le contenu n'est
 * monté qu'à ce moment, ce qui relance aussi les animations des graphiques.
 */
const BACKGROUND_CLASSES = { surface: 'bg-surface', 'surface-douce': 'bg-surface-douce' } as const;

export default function SectionStack({ sections, label, background = 'surface-douce', fillZone = false }: SectionStackProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement>(null);
  const cancelScrollRef = useRef<(() => void) | null>(null);
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  // Calculé à l'affichage : le premier bloc est visible dès qu'il existe, sans attendre l'observateur.
  const shownSections = withFirstRevealed(revealed, sections);
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
      // Bureau : une carte remplit la zone, elle n'apparaît (et ses animations ne partent) qu'une fois bien entrée.
      { root, rootMargin: root ? '0px 0px -30% 0px' : '0px 0px -10% 0px', threshold: root ? 0 : 0.05 },
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

  // La rangée de puces défile à l'horizontale, sans barre : la molette (verticale) et le doigt la font avancer.
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const updateFade = () => setFadeRight(nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 4);
    const onWheel = (event: WheelEvent) => {
      if (nav.scrollWidth <= nav.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const next = Math.max(0, Math.min(nav.scrollWidth - nav.clientWidth, nav.scrollLeft + event.deltaY));
      // Au bout de la rangée, la molette reprend son rôle normal (faire défiler la page).
      if (next === nav.scrollLeft) return;
      event.preventDefault();
      nav.scrollLeft = next;
    };

    updateFade();
    nav.addEventListener('scroll', updateFade, { passive: true });
    nav.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', updateFade);
    return () => {
      nav.removeEventListener('scroll', updateFade);
      nav.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', updateFade);
    };
  }, [sections.length]);

  // Hauteur réelle de la rangée de puces (elle peut passer sur deux lignes) : une carte remplit le reste de la zone.
  useEffect(() => {
    const nav = navRef.current;
    const scroller = scrollerRef.current;
    if (!nav || !scroller || typeof ResizeObserver === 'undefined') return;
    const update = () => scroller.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
    update();
    // L'accroche a pu se caler pendant que la page se mettait en place : on repart du haut, une fois stable.
    const settle = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (fillZone) scroller.scrollTop = 0;
    }));
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => {
      cancelAnimationFrame(settle);
      observer.disconnect();
    };
  }, [fillZone]);

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
    setActiveId(id);
    // Tous les blocs jusqu'à la cible sont montés d'avance : la distance à parcourir ne change plus en route.
    const targetIndex = sections.findIndex((section) => section.id === id);
    setRevealed((previous) => new Set([...previous, ...sections.slice(0, targetIndex + 1).map((section) => section.id)]));

    const parent = findScrollParent(element);
    cancelScrollRef.current?.();
    if (parent) {
      // La rangée de puces collante masque le haut de la zone : on s'arrête juste dessous.
      const getTargetTop = () => {
        const stickyOffset = navRef.current?.offsetHeight ?? 0;
        return element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop - stickyOffset;
      };
      if (prefersReducedMotion()) parent.scrollTop = getTargetTop();
      else {
        // L'accroche reprend la main une fois arrivé : pendant l'animation elle se battrait avec elle.
        parent.style.scrollSnapType = 'none';
        const release = () => {
          parent.style.scrollSnapType = '';
        };
        const stop = animateScroll(parent, getTargetTop, () => {
          release();
          cancelScrollRef.current = null;
        });
        cancelScrollRef.current = () => {
          stop();
          release();
        };
      }
    }
    element.focus({ preventScroll: true });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">

      <div
        ref={scrollerRef}
        className={`min-h-0 flex-1 space-y-4 md:overflow-y-auto ${
          fillZone ? 'md:snap-y md:snap-proximity md:[container-type:size] md:[scroll-padding-top:var(--nav-h)]' : ''
        }`}
      >
        <nav
          ref={navRef}
          aria-label={label}
          style={{
            ...(fadeRight ? { maskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent)' } : {}),
          }}
          className={`${BACKGROUND_CLASSES[background]} sticky top-0 z-10 flex shrink-0 flex-nowrap justify-start gap-1.5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center md:overflow-visible md:py-2`}
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
              className="min-h-11 shrink-0 rounded-full border-[1.5px] border-bordure bg-surface px-4 text-sm font-semibold text-texte transition hover:-translate-y-0.5 hover:bg-accent-doux motion-safe:hover:animate-[wiggle_0.4s_ease-in-out_1] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=true]:border-transparent aria-[current=true]:onglet-actif aria-[current=true]:font-bold"
            >
              {section.label}
            </button>
          ))}
        </nav>

        {sections.map((section) => {
          const isRevealed = shownSections.has(section.id);
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
              className={`scroll-mt-1 outline-none ${fillZone ? `md:snap-start ${section.fit ? '' : 'md:min-h-[calc(100cqh-var(--nav-h))]'}` : ''}`}
            >
              <h2
                id={`section-${section.id}-title`}
                className={section.hideTitle ? 'sr-only' : 'mb-1 px-1 text-center text-base font-black text-texte'}
              >
                {section.label}
              </h2>
              <div
                className={`${section.fit && isRevealed ? '' : 'min-h-40'} transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
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
