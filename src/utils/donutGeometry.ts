export const DONUT_CENTER = 110;
export const DONUT_RADIUS = 82;

/** Tracé d'un arc de cercle (en % du tour) sur un anneau de rayon DONUT_RADIUS, départ à midi. */
export function createArcPath(startShare: number, share: number): string {
  const center = DONUT_CENTER;
  const radius = DONUT_RADIUS;

  if (share >= 99.999) {
    return `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center} ${center + radius} A ${radius} ${radius} 0 1 1 ${center} ${center - radius}`;
  }

  const startAngle = -Math.PI / 2 + (startShare / 100) * Math.PI * 2;
  const endAngle = startAngle + (share / 100) * Math.PI * 2;
  const startX = center + radius * Math.cos(startAngle);
  const startY = center + radius * Math.sin(startAngle);
  const endX = center + radius * Math.cos(endAngle);
  const endY = center + radius * Math.sin(endAngle);
  const largeArcFlag = share > 50 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}
