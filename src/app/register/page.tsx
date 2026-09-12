"use client";

import React, { useState } from 'react';
import AuthForm from '@/components/features/forms/AuthForm';
import { registerUser } from '@/services/authService';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegisterSubmit = async (data: { email: string; password: string; pseudo?: string }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        pseudo: data.pseudo , // Use pseudo if provided, otherwise use name
      });

      alert(`Compte créé avec succès pour ${data.pseudo || data.email} !`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Une erreur est survenue lors de l'inscription.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#ebcfc6] flex items-center justify-center px-4 py-8 overflow-hidden text-[#5b473d]">
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#e59a86]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#f2e6d8]/40 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-4">
        {errorMessage && (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-100 p-3 text-sm font-semibold text-red-700 text-center">
            {errorMessage}
          </div>
        )}

        <AuthForm
          mode="register"
          onSubmit={handleRegisterSubmit}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}