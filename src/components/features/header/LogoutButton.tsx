"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/services/authService';

interface LogoutButtonProps {
    variant?: 'icon' | 'text';
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
            router.replace('/login');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Déconnexion impossible.');
            setIsLoggingOut(false);
        }
    };

    if (variant === 'icon') {
        return (
            <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Se déconnecter"
                title={error ?? 'Se déconnecter'}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#D97757] bg-[#FFF5EE] text-[#5A4D41] ring-1 ring-[#E5C4B4] hover:bg-[#F8D5CB] disabled:opacity-60 shrink-0 ${className}`}
            >
                <span aria-hidden="true">{isLoggingOut ? '…' : '🚪'}</span>
            </button>
        );
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#E5C4B4] bg-[#F8D5CB] px-4 py-2 text-sm font-semibold text-[#C86445] transition-colors hover:bg-[#f2c4b6] focus:outline-hidden focus:ring-2 focus:ring-[#D97757] disabled:opacity-60"
            >
                <span aria-hidden="true">🚪</span>
                {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
            </button>
            {error && (
                <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>
            )}
        </div>
    );
}
