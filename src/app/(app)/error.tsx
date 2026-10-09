"use client";

import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import Pig from '@/components/ui/Pig';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex h-full max-w-xl items-center justify-center px-4">
      <div role="alert" className="w-full rounded-carte border-[3px] border-bordure bg-surface-douce p-6 text-center">
        <Pig mood="oups" className="mx-auto size-16" />
        <h1 className="mt-2 text-xl font-black text-texte">Oups, quelque chose s’est mal passé</h1>
        <p className="mt-2 text-sm text-texte-doux">
          Ce n’est pas ta faute et tes données n’ont pas été touchées. Tu peux réessayer ou revenir à l’accueil.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="min-h-12 rounded-carte border-[3px] border-bordure bg-accent px-5 font-bold text-sur-accent shadow-bonbon focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Réessayer
          </button>
          <Link
            href={ROUTES.dashboard}
            className="inline-flex min-h-12 items-center rounded-carte border-2 border-bordure-forte bg-surface/70 px-5 font-bold text-texte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Retour à l’accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
