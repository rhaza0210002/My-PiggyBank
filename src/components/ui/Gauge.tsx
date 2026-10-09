interface GaugeProps {
  value: number;
  max: number;
  label: string;
  /** Texte lu par les lecteurs d'écran, ex. « 3 sur 12 opérations pointées ». */
  valueText?: string;
}

/** Jauge commune (remplace ProgressBar) : se remplit de la gauche vers la droite, plafonnée à 100 %. */
export default function Gauge({ value, max, label, valueText }: GaugeProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className="h-4 w-full overflow-hidden rounded-bonbon border-2 border-texte bg-surface"
    >
      <div
        className="grow h-full rounded-bonbon border-r-2 border-texte bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
