"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { logoutUser } from '@/services/authService';

interface LogoutButtonProps {
    /** `compact` : en-tête (libellé raccourci sur mobile) ; `text` : pleine largeur de libellé. */
    variant?: 'compact' | 'text';
    className?: string;
}

export default function LogoutButton({ variant = 'text', className = '' }: LogoutButtonProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setError(null);

        try {
            await logoutUser();
            router.replace(ROUTES.login);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Déconnexion impossible.');
            setIsLoggingOut(false);
        }
    };

    const isCompact = variant === 'compact';

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`inline-flex items-center justify-center gap-1.5 rounded-full border-[3px] border-texte bg-piece font-bold text-sur-corail transition-colors hover:bg-corail-clair focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${isCompact ? 'min-h-11 px-3 text-xs sm:text-sm' : 'min-h-11 px-4 text-sm'}`}
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5V3h4" />
                    <path d="M16 17l5-5-5-5" />
                    <path d="M21 12H9" />
                </svg>
                <span>
                    {isLoggingOut ? 'Déconnexion…' : isCompact ? 'Déconnexion' : 'Se déconnecter'}
                </span>
            </button>
            {error && (
                <p role="alert" className="mt-2 text-sm font-semibold text-depasse">{error}</p>
            )}
        </div>
    );
}
