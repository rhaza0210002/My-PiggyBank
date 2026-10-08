import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import SkipLink from '@/components/layout/SkipLink';

/**
 * L'application occupe exactement l'écran : l'en-tête et la barre du bas restent en place, chaque page
 * tient dans l'espace restant et ne défile en interne que si l'écran est vraiment trop petit.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SkipLink />
      <AppHeader />
      {/* pb : laisse la place à la barre du bas sur mobile. */}
      <main id="contenu" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto pb-[4.75rem] outline-none md:pb-2">
        {children}
      </main>
      <Footer variant="compact" />
      <BottomNav />
    </div>
  );
}
