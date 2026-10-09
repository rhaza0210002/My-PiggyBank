import type { ReactNode } from 'react';
import Icon, { type IconName } from '@/components/ui/Icon';

interface ScreenCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Mobile : la page s'allonge et défile avec l'écran, au lieu d'un petit cadre qui défile à l'intérieur. */
  flow?: boolean;
  /** Icône décorative dans une pastille, penchée comme un autocollant. */
  icon?: IconName;
}

/**
 * Cadre d'une page : même identité (contour d'encre, coins arrondis) mais hauteur bornée à l'écran.
 * Le titre reste visible, seul le contenu défile si l'écran est trop petit.
 */
export default function ScreenCard({ title, subtitle, actions, children, flow = false, icon }: ScreenCardProps) {
  return (
    <div className={`mx-auto flex min-h-0 w-full ${flow ? 'md:h-full' : 'h-full'} max-w-[1200px] flex-col px-3 py-2 sm:px-5`}>
      <div className={`flex min-h-0 flex-col gap-2 rounded-carte border-2 border-texte bg-surface-douce p-3 shadow-sticker sm:p-4 ${flow ? 'md:flex-1' : 'flex-1'}`}>
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
        <div className={flow ? 'md:min-h-0 md:flex-1 md:overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto'}>{children}</div>
      </div>
    </div>
  );
}
