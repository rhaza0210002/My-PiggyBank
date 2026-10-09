"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, isCurrentPage, type NavSection } from '@/constants/routes';

interface SectionTabsProps {
  sectionId: NavSection['id'];
}

/** Sous-navigation d'une section : toujours visible, retour à la ligne plutôt qu'un défilement caché. */
export default function SectionTabs({ sectionId }: SectionTabsProps) {
  const pathname = usePathname();
  const section = NAV_SECTIONS.find((item) => item.id === sectionId);

  if (!section || section.pages.length === 0) return null;

  return (
    <nav aria-label={`Pages de la section ${section.label}`} className="mx-auto w-full max-w-[1200px] shrink-0 px-3 pt-2 sm:px-5">
      <ul className="flex flex-wrap justify-center gap-2">
        {section.pages.map((page) => {
          const isCurrent = isCurrentPage(pathname, page.href);

          return (
            <li key={page.href}>
              <Link
                href={page.href}
                aria-current={isCurrent ? 'page' : undefined}
                className="flex min-h-11 items-center justify-center rounded-full border-[1.5px] border-bordure bg-surface px-4 text-sm font-semibold text-texte transition hover:-translate-y-0.5 hover:bg-accent-doux focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[current=page]:border-transparent aria-[current=page]:onglet-actif aria-[current=page]:font-bold"
              >
                {page.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
