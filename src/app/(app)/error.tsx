"use client";

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-xl items-center justify-center px-4">
      <div role="alert" className="w-full rounded-carte border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-6 text-center">
        <p className="text-4xl" aria-hidden="true">🐷</p>
        <h1 className="mt-2 text-xl font-black text-[#5d4d44]">Oups, quelque chose s’est mal passé</h1>
        <p className="mt-2 text-sm text-[#6b574c]">
          Ce n’est pas ta faute et tes données n’ont pas été touchées. Tu peux réessayer ou revenir à l’accueil.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 rounded-carte border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 font-bold text-[#3d2a21] shadow-bonbon focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            Réessayer
          </button>
          <Link
            href={ROUTES.dashboard}
            className="inline-flex min-h-12 items-center rounded-carte border border-[#b88f78] bg-white/70 px-5 font-bold text-[#5d4d44] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
