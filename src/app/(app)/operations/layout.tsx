import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SectionTabs from '@/components/layout/SectionTabs';

export const metadata: Metadata = { title: 'Opérations' };

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SectionTabs sectionId="operations" />
      {children}
    </>
  );
}
