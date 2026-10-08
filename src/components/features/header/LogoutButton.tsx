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
                className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E5C4B4] bg-[#F8D5CB] font-semibold text-[#7a2f1a] transition-colors hover:bg-[#f2c4b6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-60 ${isCompact ? 'min-h-10 px-3 text-xs' : 'min-h-11 px-4 text-sm'}`}
            >
                <span aria-hidden="true">🚪</span>
                <span>
                    {isLoggingOut ? 'Déconnexion…' : isCompact ? 'Déconnexion' : 'Se déconnecter'}
                </span>
            </button>
            {error && (
                <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>
            )}
        </div>
    );
}
