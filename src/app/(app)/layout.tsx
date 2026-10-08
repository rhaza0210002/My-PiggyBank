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
      {/*
        Le pied de page suit le contenu dans la zone qui défile : il n'apparaît qu'en bas de page (collé à la barre
        d'onglets sur mobile). La page garde exactement la hauteur de l'écran, le pied de page est juste en dessous.
      */}
      <main id="contenu" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none">
        <div className="min-h-full pb-2 md:h-full">{children}</div>
        <Footer variant="compact" />
      </main>
      <BottomNav />
    </div>
  );
}
