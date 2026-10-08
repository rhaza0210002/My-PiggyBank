import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Page introuvable' };

export default function NotFound() {
  return (
    <>
      <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="max-w-md rounded-[1.6rem] border-[3px] border-[#d8b6a5] bg-[#f2e6d8] p-6 text-center">
          <p className="text-4xl" aria-hidden="true">🐷</p>
          <h1 className="mt-2 text-xl font-black text-[#5d4d44]">Page introuvable</h1>
          <p className="mt-2 text-sm text-[#6b574c]">Cette page n’existe pas ou a changé d’adresse.</p>
          <Link
            href={ROUTES.dashboard}
            className="mt-4 inline-flex min-h-12 items-center rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-5 font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
          >
            Retour à l’accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
