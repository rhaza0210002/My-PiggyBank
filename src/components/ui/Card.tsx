import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  as?: 'section' | 'div';
  className?: string;
}

/** Carte commune : fond surface, bordure douce, grands arrondis. */
export default function Card({ children, as: Tag = 'div', className = '' }: CardProps) {
  return <Tag className={`rounded-carte border-2 border-bordure bg-surface p-4 ${className}`}>{children}</Tag>;
}
