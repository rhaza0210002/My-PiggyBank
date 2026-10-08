import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SectionTabs from '@/components/layout/SectionTabs';

export const metadata: Metadata = { title: 'Compte' };

export default function CompteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SectionTabs sectionId="account" />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
