import type { ReactNode } from 'react';
import SkipLink from '@/components/layout/SkipLink';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      {/* Pas de menu sur les pages publiques : une seule tâche, se connecter ou s'inscrire. */}
      <main id="contenu" tabIndex={-1} className="flex flex-1 items-center justify-center outline-none">
        {children}
      </main>
    </>
  );
}
