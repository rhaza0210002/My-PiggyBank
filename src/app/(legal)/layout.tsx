import type { ReactNode } from 'react';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import SkipLink from '@/components/layout/SkipLink';
import { ROUTES } from '@/constants/routes';
import Pig from '@/components/ui/Pig';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <header className="border-b-2 border-bordure bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
          <Link
            href={ROUTES.dashboard}
            className="flex min-h-12 items-center gap-2 rounded-xl p-1 text-lg font-bold text-texte focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Pig className="size-8" /> My PiggyBank
          </Link>
          <Link
            href={ROUTES.dashboard}
            className="inline-flex min-h-11 items-center rounded-xl border border-bordure-forte bg-surface/70 px-4 text-sm font-bold text-texte hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Retour à l’application
          </Link>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
