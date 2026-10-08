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
  // relative : les éléments absolus (textes réservés aux lecteurs d'écran) sont rognés par la coque et ne font pas défiler la page.
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <SkipLink />
      <AppHeader />
      <main id="contenu" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto pb-2 outline-none">
        {children}
      </main>
      <Footer variant="compact" />
      <BottomNav />
    </div>
  );
}
