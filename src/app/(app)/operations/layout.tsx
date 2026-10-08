import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import OperationsSteps from '@/components/layout/OperationsSteps';

export const metadata: Metadata = { title: 'Opérations' };

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col md:h-full">
      <OperationsSteps />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
