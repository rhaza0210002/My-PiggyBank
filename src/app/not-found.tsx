import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/constants/routes';
import Pig from '@/components/ui/Pig';

export const metadata: Metadata = { title: 'Page introuvable' };

export default function NotFound() {
  return (
    <>
      <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="max-w-md rounded-carte border-[3px] border-bordure bg-surface-douce p-6 text-center">
          <Pig mood="oups" className="mx-auto size-16" />
          <h1 className="mt-2 text-xl font-black text-texte">Page introuvable</h1>
          <p className="mt-2 text-sm text-texte-doux">Cette page n’existe pas ou a changé d’adresse.</p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-12 items-center rounded-carte border-[3px] border-bordure bg-accent px-5 font-bold text-sur-accent shadow-bonbon focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Retour à l’accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
