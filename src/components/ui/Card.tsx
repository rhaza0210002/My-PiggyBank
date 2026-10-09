import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  as?: 'section' | 'div';
  className?: string;
}

/** Carte commune : fond surface, bordure douce, contour d'encre et ombre pleine (style autocollant). */
export default function Card({ children, as: Tag = 'div', className = '' }: CardProps) {
  return <Tag className={`rounded-carte border-2 border-texte bg-surface p-4 shadow-sticker-petit ${className}`}>{children}</Tag>;
}
