import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SectionTabs from '@/components/layout/SectionTabs';

export const metadata: Metadata = { title: 'Compte' };

export default function CompteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SectionTabs sectionId="account" />
      {children}
    </>
  );
}
