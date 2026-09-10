
"use client";
import React, { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
    userName?: string;
}

export default function Header({ userName = 'Mallaury' }: HeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const navLinks = [
        {
            name: "Paramètres",
            href: "/settings",
            icon: "⚙️",
            isActive: false,
            ariaLabel: "Accéder aux paramètres du compte et d'accessibilité"
        },
        {
            name: "Notifications",
            href: "/notifications",
            icon: "🔔",
            isActive: false,
            ariaLabel: "Accéder aux notifications"
        },
        {
            name: "Profil",
            href: "/profile",
            icon: "👤",
            isActive: false,
            ariaLabel: "Accéder au profil"
        },
        {
            name: "Bilan",
            href: "/budgetannual",
            icon: "📊",
            isActive: true,
            ariaLabel: "Accéder au bilan financier"
        },
        {
            name: "CSV",
            href: "/csvUploader",
            icon: "📂",
            isActive: true,
            ariaLabel: "Accéder à l'import de fichiers CSV"
        },

    ];

    return (
        <header className="w-[90%] mx-auto mt-2 p-1.5 rounded-xl bg-[#FFF5EE] border-b border-[#E5C4B4] shadow-xs sticky top-0 z-50">
            <div className="max-w-6xl rounded-xl mx-auto border-[0.12rem] border-[#E5C4B4] border-dashed flex items-center justify-between relative">

                {/* Logo / Nom de l'app */}
                <Link
                    href="/"
                    className="flex items-center gap-3 group focus:outline-hidden focus:ring-2 focus:ring-[#D97757] rounded-xl p-1"
                >
                    <span className="text-2xl" role="img" aria-label="Tirelire">
                        🐷
                    </span>
                    <span className="text-xl font-bold text-[#5A4D41] tracking-tight group-hover:text-[#D97757] transition-colors">
                        My PiggyBank
                    </span>
                </Link>

                {/* Message d'accueil / Navigation rapide */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-sm font-medium text-[#8C7A6B] hidden lg:inline">
                        Coucou, <strong className="text-[#5A4D41]">{userName}</strong> ! 👋
                    </span>

                    <nav aria-label="Navigation secondaire" className="hidden lg:flex items-center gap-2">
                        {navLinks
                            .filter((item) => item.isActive)
                            .map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-label={item.ariaLabel}
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#D97757] bg-[#F8D5CB] text-[#C86445] ring-1 ring-[#D97757]"
                                >
                                    <span aria-hidden="true">{item.icon}</span>
                                </Link>
                            ))}
                    </nav>

                    <div className="lg:hidden relative flex items-center">
                        <button
                            type="button"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-expanded={isOpen}
                            aria-label="Menu de navigation"
                            className="w-12 h-12 rounded-full bg-[#F8D5CB] border-2 border-[#E5C4B4] flex items-center justify-center text-[#C86445] shadow-md hover:scale-105 transition-transform z-10"
                        >
                            <span className="text-xl">{isOpen ? '✕' : '📂'}</span>
                        </button>

                        <div
                            className={`absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-3 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-w-[300px] opacity-100' : 'max-w-0 opacity-0 pointer-events-none'}`}
                        >
                            {navLinks.map((item, index) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-label={item.ariaLabel}
                                    style={{
                                        transitionDelay: `${isOpen ? index * 50 : (navLinks.length - 1 - index) * 50}ms`
                                    }}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full bg-[#FFF5EE] border border-[#E5C4B4] text-[#5A4D41] shadow-xs hover:bg-[#F8D5CB] transition-all transform duration-300 shrink-0 ${isOpen ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-8 opacity-0 scale-75'}`}
                                >
                                    <span role="img" aria-hidden="true">{item.icon}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}