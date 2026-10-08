"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/features/forms/AuthForm';
import { ROUTES } from '@/constants/routes';
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
      router.push(ROUTES.dashboard);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-[#ebcfc6] px-4 py-8 text-[#5b473d]">
      <AuthForm mode="login" onSubmit={handleLoginSubmit} isLoading={isLoading} serverError={errorMessage} />
    </div>
  );
}
