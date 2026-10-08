import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import BottomNav from '@/components/layout/BottomNav';
import SkipLink from '@/components/layout/SkipLink';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <AppHeader />
      {/* pb-24 : laisse la place à la barre du bas sur mobile. */}
      <main id="contenu" tabIndex={-1} className="flex-1 pb-24 outline-none md:pb-8">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
