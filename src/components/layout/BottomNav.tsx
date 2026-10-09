"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_SECTIONS, getActiveSection } from '@/constants/routes';
import { NAV_LINK_BASE } from '@/components/layout/navLinkClasses';

/** Barre fixe en bas de l'écran sur mobile (zone du pouce), masquée dès la tablette où l'en-tête prend le relais. */
export default function BottomNav() {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  return (
    <nav
      aria-label="Navigation principale"
      className="shrink-0 border-t-2 border-bordure bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {NAV_SECTIONS.map((section) => (
          <li key={section.id}>
            <Link
              href={section.href}
              aria-current={activeSection?.id === section.id ? 'page' : undefined}
              className={`${NAV_LINK_BASE} min-h-16 flex-col gap-0.5 rounded-none py-2 text-xs font-semibold focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-focus`}
            >
              <span className="text-xl" aria-hidden="true">{section.icon}</span>
              {section.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
