"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/features/forms/AuthForm';
import { loginUser } from '@/services/authService';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLoginSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginUser(data);
      router.push('/dashboard');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#ebcfc6] flex items-center justify-center px-4 py-8 overflow-hidden text-[#5b473d]">
      <AuthForm
        mode="login"
        onSubmit={handleLoginSubmit}
        isLoading={isLoading}
      />

      {errorMessage && (
        <p role="alert" className="mt-4 text-center font-semibold text-red-700">{errorMessage}</p>
      )}
    </main>
  );
}