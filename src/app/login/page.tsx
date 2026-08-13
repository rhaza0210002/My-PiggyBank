"use client";

import React, { useState } from 'react';
import AuthForm from '@/Components/Features/Forms/AuthForm';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successPseudo, setSuccessPseudo] = useState<string | null>(null);

  const handleLoginSubmit = (data: { email: string; password: string }) => {
    setIsLoading(true);
    console.log("Tentative de connexion :", data);

    setTimeout(() => {
      setIsLoading(false);

      // Extrait le pseudo de l'email (ex: "test@test.fr" -> "Test")
      const rawPseudo = data.email.split('@')[0];
      const pseudo = rawPseudo.charAt(0).toUpperCase() + rawPseudo.slice(1);

      // Déclenche l'affichage de la modale
      setSuccessPseudo(pseudo);
    }, 1000);
  };

  return (
    <main className="relative min-h-screen bg-[#ebcfc6] flex items-center justify-center px-4 py-8 overflow-hidden text-[#5b473d]">
      <AuthForm
        mode="login"
        onSubmit={handleLoginSubmit}
        isLoading={isLoading}
      />

      {/* Modale globale au premier plan (fixed z-50) */}
      {successPseudo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[400px] rounded-[2.2rem] bg-[#fff8f5] border-[3px] border-[#d8b6a5] p-6 text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e59a86] text-white shadow-md mb-2">
              🎉
            </div>
            <h2 className="text-[1.6rem] font-black text-[#5d4d44]">
              Connecté avec succès !
            </h2>
            <p className="text-[1.1rem] font-bold text-[#a36351]">
              Bonjour {successPseudo}
            </p>
            <p className="text-[0.95rem] text-[#8c7366]">
              Heureux de te revoir sur My PiggyBank.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] py-3 font-bold text-[#fff8f5] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-all hover:translate-y-[2px]"
            >
              Accéder à mon tableau de bord
            </button>
          </div>
        </div>
      )}
    </main>
  );
}