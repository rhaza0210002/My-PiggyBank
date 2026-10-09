import type { ReactNode } from 'react';

/** Cadre commun des écrans de connexion : même identité que le formulaire de connexion. */
export default function AuthCard({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="relative flex w-full flex-1 items-center justify-center bg-fond px-4 py-8 text-texte">
      <div className="w-full max-w-[440px] rounded-carte bg-surface p-2 shadow-doux sm:p-5">
        <div className="space-y-5 rounded-carte border-2 border-dashed border-bordure p-5 sm:p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-[1.6rem] font-black tracking-[-0.05em] text-texte">{title}</h1>
            {intro && <p className="text-[0.95rem] text-texte-doux">{intro}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export const AUTH_INPUT_CLASS =
  'w-full min-h-12 rounded-carte border-[1.5px] border-bordure-forte bg-surface px-4 py-3 text-texte placeholder-texte-doux shadow-inner focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';
export const AUTH_LABEL_CLASS = 'block px-1 text-sm font-bold text-texte';
export const AUTH_BUTTON_CLASS =
  'min-h-12 w-full rounded-carte border-2 border-bordure bg-accent py-3 text-center font-bold text-sur-accent shadow-bonbon transition-all hover:translate-y-[2px] hover:shadow-bonbon focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-70';
export const AUTH_LINK_CLASS = 'inline-flex min-h-11 items-center font-black text-accent-fort underline underline-offset-4';
