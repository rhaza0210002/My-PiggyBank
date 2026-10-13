/** Premier ancêtre qui défile réellement (jamais le cadre de l'écran, qui est en overflow: hidden). */
export function findScrollParent(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = window.getComputedStyle(parent);
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) return parent;
  }
  return null;
}

/**
 * Amène un élément en haut de sa zone de défilement, sans faire bouger le reste de la page :
 * sur ordinateur seule la zone intérieure défile, sur mobile c'est la page.
 */
export function scrollIntoZone(element: HTMLElement, behavior: ScrollBehavior): void {
  const parent = findScrollParent(element);
  if (!parent) {
    element.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  const top = element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;
  parent.scrollTo({ top, behavior });
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SCROLL_DURATION_MS = 650;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Défilement animé (départ et arrivée en douceur). La cible est recalculée à chaque image : les blocs qui
 * apparaissent en chemin ne font pas sauter l'animation. Un geste de l'utilisateur la coupe aussitôt.
 */
export function animateScroll(parent: HTMLElement, getTargetTop: () => number, onDone: () => void): () => void {
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
 * Amène un élément en haut de sa zone avec le même glissé doux que les puces des blocs. L'accroche de la zone
 * est suspendue pendant le trajet (elle se battrait avec l'animation) ; mouvement réduit : saut direct.
 */
export function glideIntoZone(element: HTMLElement): void {
  const parent = findScrollParent(element);
  if (!parent) {
    element.scrollIntoView({ block: 'start' });
    return;
  }
  const getTargetTop = () => element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;
  if (prefersReducedMotion()) {
    parent.scrollTop = getTargetTop();
    return;
  }
  // Un geste de l'utilisateur coupe l'animation : l'accroche revient aussi dans ce cas.
  const release = () => {
    parent.style.scrollSnapType = '';
  };
  parent.style.scrollSnapType = 'none';
  parent.addEventListener('wheel', release, { once: true, passive: true });
  parent.addEventListener('touchstart', release, { once: true, passive: true });
  animateScroll(parent, getTargetTop, release);
}