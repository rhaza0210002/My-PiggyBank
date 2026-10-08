"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/components/features/header/LogoutButton';
import { NAV_SECTIONS, ROUTES, getActiveSection } from '@/constants/routes';
import { NAV_LINK_BASE } from '@/components/layout/navLinkClasses';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile } from '@/services/userService';

export default function AppHeader() {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);
  const [userId, setUserId] = useState<string | null>(null);
  const [pseudo, setPseudo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    let isCurrent = true;
    getUserProfile(userId)
      .then((profile) => {
        if (isCurrent) setPseudo(profile?.pseudo ?? null);
      })
      .catch(() => {});

    return () => {
      isCurrent = false;
    };
  }, [userId]);

  return (
    <header className="sticky top-0 z-40 mx-2 mt-2 rounded-xl border-b border-[#E5C4B4] bg-[#FFF5EE] p-1.5 shadow-xs sm:mx-auto sm:w-[90%]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-xl border-[0.12rem] border-dashed border-[#E5C4B4] px-2">
        <Link
          href={ROUTES.dashboard}
          aria-label="My PiggyBank, retour à l'accueil"
          className="flex min-h-12 shrink-0 items-center gap-2 rounded-xl p-1 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]"
        >
          <span className="text-2xl" aria-hidden="true">🐷</span>
          <span className="whitespace-nowrap text-lg font-bold tracking-tight text-[#5A4D41] sm:text-xl">My PiggyBank</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_SECTIONS.map((section) => (
              <li key={section.id}>
                <Link
                  href={section.href}
                  aria-current={activeSection?.id === section.id ? 'page' : undefined}
                  className={`${NAV_LINK_BASE} min-h-12 px-2! text-sm font-semibold lg:px-3! focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d]`}
                >
                  <span aria-hidden="true">{section.icon}</span>
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {pseudo && (
            <span className="hidden max-w-[16rem] truncate text-sm font-medium text-[#6b574c] xl:inline">
              Bonjour, <strong className="text-[#5A4D41]">{pseudo}</strong>
            </span>
          )}
          {userId && <LogoutButton variant="compact" />}
        </div>
      </div>
    </header>
  );
}
