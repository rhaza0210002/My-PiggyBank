import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SectionTabs from '@/components/layout/SectionTabs';

export const metadata: Metadata = { title: 'Budget' };

export default function BudgetLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SectionTabs sectionId="budget" />
      {children}
    </>
  );
}
