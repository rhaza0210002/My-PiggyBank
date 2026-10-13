"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';

interface ScreenCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Mobile : la page s'allonge et défile avec l'écran, au lieu d'un petit cadre qui défile à l'intérieur. */
  flow?: boolean;
  /** La carte garde la hauteur de son contenu : une autre carte la suit plus bas (voir ScreenPanel). */
  fit?: boolean;
  /** Icône décorative dans une pastille, penchée comme un autocollant. */
  icon?: IconName;
}

const CARD = 'rounded-carte border-2 border-texte bg-surface-douce p-3 shadow-sticker sm:p-4';
const FRAME = 'mx-auto flex w-full max-w-[1200px] flex-col px-3 py-2 sm:px-5';

/**
 * Cadre d'une page : même identité (contour d'encre, coins arrondis) mais hauteur bornée à l'écran.
 * Le titre reste visible, seul le contenu défile si l'écran est trop petit.
 */
export default function ScreenCard({ title, subtitle, actions, children, flow = false, fit = false, icon }: ScreenCardProps) {
  const frameHeight = fit ? '' : `min-h-0 ${flow ? 'md:h-full' : 'h-full'}`;
  const cardHeight = fit ? '' : `min-h-0 ${flow ? 'md:flex-1' : 'flex-1'}`;
  const contentScroll = fit ? '' : flow ? 'md:min-h-0 md:flex-1 md:overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto';

  return (
    <div className={`${FRAME} ${frameHeight}`}>
      <div className={`flex flex-col gap-2 ${CARD} ${cardHeight}`}>
        <div className="flex flex-col items-center gap-1 px-1 text-center">
          <div className="flex items-center justify-center gap-2.5">
            {icon && (
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-texte bg-piece text-texte shadow-sticker-petit"
              >
                <Icon name={icon} className="size-5" />
              </span>
            )}
            <h1 className="text-[clamp(1.35rem,2.2vw,1.9rem)] font-extrabold leading-tight tracking-[-0.01em] text-texte">
              {title}
            </h1>
          </div>
          {subtitle && <p className="hidden max-w-xl text-sm sm:block text-texte-doux">{subtitle}</p>}
          {actions && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
        </div>
        <div className={contentScroll}>{children}</div>
      </div>
    </div>
  );
}

interface ScreenPanelProps {
  /** Nom de la région, lu par les lecteurs d'écran. */
  label: string;
  children: ReactNode;
  /** Hauteur voulue par la page (par exemple toute la zone visible sur ordinateur). */
  className?: string;
  id?: string;
}

/**
 * Carte à part entière qui suit une ScreenCard plus bas dans la page. Son contenu n'est monté qu'à l'arrivée
 * (il glisse doucement en place), ce qui lance aussi les animations des graphiques au bon moment.
 */
export function ScreenPanel({ label, children, className = '', id }: ScreenPanelProps) {
  const ref = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} id={id} aria-label={label} tabIndex={-1} className={`${FRAME} outline-none ${className}`}>
      <div
        className={`flex min-h-0 flex-1 flex-col ${CARD} transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
          isRevealed ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 motion-reduce:translate-y-0'
        }`}
      >
        {isRevealed ? children : null}
      </div>
    </section>
  );
}
