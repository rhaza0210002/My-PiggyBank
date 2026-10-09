interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** Texte lu par les lecteurs d'écran, ex. « 3 sur 12 opérations pointées ». */
  valueText?: string;
}

export default function ProgressBar({ value, max, label, valueText }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
      aria-valuetext={valueText}
      className="h-3 w-full overflow-hidden rounded-full border border-bordure bg-surface-douce"
    >
      <div
        className="grow h-full rounded-full bg-accent-fort transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
