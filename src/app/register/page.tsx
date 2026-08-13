"use client";

import React, { useState } from 'react';
import AuthForm from '@/Components/Features/Forms/AuthForm';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterSubmit = (data: { email: string; password: string; name?: string }) => {
    setIsLoading(true);

    // Simulation d'une requête d'inscription
    setTimeout(() => {
      setIsLoading(false);
      alert(`Compte créé avec succès pour ${data.name} (${data.email}) !`);
    }, 1500);
  };

  return (
    <main className="relative min-h-screen bg-[#ebcfc6] flex items-center justify-center px-4 py-8 overflow-hidden text-[#5b473d]">

      {/* Éléments de fond décoratifs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#e59a86]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#f2e6d8]/40 blur-3xl pointer-events-none" />

      {/* Formulaire en mode inscription avec le même style "couture" */}
      <AuthForm
        mode="register"
        onSubmit={handleRegisterSubmit}
        isLoading={isLoading}
      />

    </main>
  );
}