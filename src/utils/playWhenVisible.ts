/** Lance `play` une seule fois, au moment où `element` est réellement visible à l'écran (et non seulement monté). */
export function playWhenVisible(element: Element, play: () => void, visibleShare = 0.35): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    play();
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { threshold: visibleShare },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
