import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import DemoBanner from '@/components/layout/DemoBanner';
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
        Mobile : le pied de page suit le contenu dans la zone qui défile (collé à la barre d'onglets).
        Ordinateur et tablette : il tient dans la hauteur de l'écran, sous la carte. La page elle-même ne défile
        donc pas (sinon une seconde barre de défilement de 41 px apparaissait à côté de celle des cartes).
      */}
      <main id="contenu" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto outline-none md:flex md:flex-col">
        <DemoBanner />
        <div className="min-h-full pb-2 md:min-h-0 md:flex-1">{children}</div>
        <Footer variant="compact" />
      </main>
      <BottomNav />
    </div>
  );
}
