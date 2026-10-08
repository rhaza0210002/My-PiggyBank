import type { ReactNode } from 'react';

interface ScreenCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Mobile : la page s'allonge et défile avec l'écran, au lieu d'un petit cadre qui défile à l'intérieur. */
  flow?: boolean;
}

/**
 * Cadre d'une page : même identité (bordure crème, coins arrondis) mais hauteur bornée à l'écran.
 * Le titre reste visible, seul le contenu défile si l'écran est trop petit.
 */
export default function ScreenCard({ title, subtitle, actions, children, flow = false }: ScreenCardProps) {
  return (
    <div className={`mx-auto flex min-h-0 w-full ${flow ? 'md:h-full' : 'h-full'} max-w-[1200px] flex-col px-3 py-2 sm:px-5`}>
      <div className={`flex min-h-0 flex-col gap-2 rounded-[1.6rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-3 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.18)] sm:rounded-[2rem] sm:p-4 ${flow ? 'md:flex-1' : 'flex-1'}`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1">
          <div className="min-w-0">
            <h1 className="text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight tracking-[-0.04em] text-[#5d4d44]">
              {title}
            </h1>
            {subtitle && <p className="hidden text-sm text-[#6b574c] sm:block">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        <div className={flow ? 'md:min-h-0 md:flex-1 md:overflow-y-auto' : 'min-h-0 flex-1 overflow-y-auto'}>{children}</div>
      </div>
    </div>
  );
}
