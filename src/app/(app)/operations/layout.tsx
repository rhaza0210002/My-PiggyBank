import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SectionTabs from '@/components/layout/SectionTabs';

export const metadata: Metadata = { title: 'Opérations' };

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SectionTabs sectionId="operations" />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
