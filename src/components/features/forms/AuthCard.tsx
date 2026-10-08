import type { ReactNode } from 'react';

/** Cadre commun des écrans de connexion : même identité que le formulaire de connexion. */
export default function AuthCard({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="relative flex w-full flex-1 items-center justify-center bg-[#ebcfc6] px-4 py-8 text-[#5b473d]">
      <div className="w-full max-w-[440px] rounded-[2.2rem] bg-[#fff8f5] p-2 shadow-[0_10px_30px_rgba(140,103,86,0.12)] sm:p-5">
        <div className="space-y-5 rounded-[2.2rem] border-[3px] border-dashed border-[#d8b6a5] p-5 sm:p-6">
          <div className="space-y-2 text-center">
            <h1 className="text-[1.6rem] font-black tracking-[-0.05em] text-[#5d4d44]">{title}</h1>
            {intro && <p className="text-[0.95rem] text-[#6b574c]">{intro}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export const AUTH_INPUT_CLASS =
  'w-full min-h-12 rounded-[1.2rem] border-[2px] border-[#9c7560] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#7d685c] shadow-inner focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]';
export const AUTH_LABEL_CLASS = 'block px-1 text-sm font-bold text-[#5d4d44]';
export const AUTH_BUTTON_CLASS =
  'min-h-12 w-full rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] py-3 text-center font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(171,98,77,0.85)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-70';
export const AUTH_LINK_CLASS = 'inline-flex min-h-11 items-center font-black text-[#8c4a38] underline underline-offset-4';
