"use client";

import { useEffect, useRef, type RefObject } from 'react';
import { animateScroll, prefersReducedMotion, softSnapTarget } from '@/utils/scroll';

interface SoftSnapOptions {
  enabled: boolean;
  /** Débuts des cartes, en position de défilement de la zone (même repère que scrollTop). */
  starts: (scroller: HTMLElement) => number[];
  /** Hauteur réellement visible sous un bandeau collant (rangée de puces), en px. */
  stickyOffset?: (scroller: HTMLElement) => number;
  /** Non nul pendant un trajet lancé ailleurs (puce cliquée) : on ne s'en mêle pas. */
  busyRef?: RefObject<(() => void) | null>;
  /**
   * La zone contient une autre zone qui défile (détail du bilan) : en descendant, c'est elle qui avance d'abord,
   * jusqu'au bout ; ensuite seulement la molette fait défiler la zone intérieure.
   */
  outerFirst?: boolean;
}

const SETTLE_DELAY_MS = 180;

/**
 * Accroche douce, sur ordinateur seulement : une fois le défilement arrêté, si on est tout près du début d'une
 * carte, la zone glisse dessus ; au milieu d'une carte, elle ne bouge pas. Remplace l'accroche CSS, qui
 * ramenait en arrière à chaque petit cran de molette. Au bout de la zone, la page ne défile pas avec elle.
 */
export function useSoftSnap(scrollerRef: RefObject<HTMLElement | null>, options: SoftSnapOptions): void {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const { enabled } = options;

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!enabled || !scroller || !window.matchMedia('(min-width: 768px)').matches) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopGlide: (() => void) | null = null;

    const settle = () => {
      const { starts, stickyOffset, busyRef } = optionsRef.current;
      if (stopGlide || busyRef?.current) return;
      const offset = stickyOffset?.(scroller) ?? 0;
      const target = softSnapTarget(
        starts(scroller),
        scroller.scrollTop,
        scroller.clientHeight - offset,
        scroller.scrollHeight - scroller.clientHeight,
      );
      if (target === null) return;
      if (prefersReducedMotion()) {
        scroller.scrollTop = target;
        return;
      }
      stopGlide = animateScroll(scroller, () => target, () => {
        stopGlide = null;
      });
    };

    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(settle, SETTLE_DELAY_MS);
    };
    // Un geste coupe le glissé (voir animateScroll) : l'accroche redevient possible à l'arrêt suivant.
    const onGesture = () => {
      stopGlide = null;
    };
    const onWheelFirst = (event: WheelEvent) => {
      const room = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      if (!optionsRef.current.outerFirst || event.deltaY <= 0 || room <= 1 || event.ctrlKey) return;
      event.preventDefault();
      stopGlide?.();
      stopGlide = null;
      const lines = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 40 : 1;
      scroller.scrollTop += Math.min(room, event.deltaY * lines);
    };
    scroller.addEventListener('wheel', onWheelFirst, { passive: false, capture: true });

    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('wheel', onGesture, { passive: true });
    scroller.addEventListener('touchstart', onGesture, { passive: true });
    scroller.addEventListener('keydown', onGesture);
    return () => {
      clearTimeout(timer);
      stopGlide?.();
      scroller.removeEventListener('scroll', onScroll);
      scroller.removeEventListener('wheel', onGesture);
      scroller.removeEventListener('touchstart', onGesture);
      scroller.removeEventListener('keydown', onGesture);
      scroller.removeEventListener('wheel', onWheelFirst, { capture: true });
    };
  }, [enabled, scrollerRef]);
}

/** Débuts des enfants directs d'une zone, dans le repère de son défilement. */
export function childStarts(scroller: HTMLElement, selector = ':scope > *', offset = 0): number[] {
  const top = scroller.getBoundingClientRect().top;
  return [...scroller.querySelectorAll<HTMLElement>(selector)].map(
    (element) => element.getBoundingClientRect().top - top + scroller.scrollTop - offset,
  );
}
