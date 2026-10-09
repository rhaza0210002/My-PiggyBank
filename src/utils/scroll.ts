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
