"use client";

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/features/forms/AuthForm';
import { ROUTES } from '@/constants/routes';
import { loginUser, resendConfirmationEmail, signInWithGoogle } from '@/services/authService';

const LINK_ERROR = 'Ce lien n’est plus valable ou a déjà servi. Connecte-toi, ou demande un nouveau lien.';

function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('erreur') === 'lien' ? LINK_ERROR : null,
  );
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setUnconfirmedEmail(null);
    setResent(false);

    try {
      await loginUser(data);
      router.push(ROUTES.dashboard);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connexion impossible.';
      setErrorMessage(message);
      if (message.includes('pas encore confirmée')) setUnconfirmedEmail(data.email);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Connexion avec Google impossible.');
    }
  };

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    try {
      await resendConfirmationEmail(unconfirmedEmail);
      setResent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Envoi impossible.');
    }
  };

  return (
    <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-[#ebcfc6] px-4 py-8 text-[#5b473d]">
      <div className="w-full max-w-[440px]">
        <AuthForm mode="login" onSubmit={handleLoginSubmit} onGoogle={handleGoogle} isLoading={isLoading} serverError={errorMessage} />
        {unconfirmedEmail && (
          <p className="mt-2 text-center">
            {resent ? (
              <span role="status" className="text-sm font-bold">Nouvel e-mail envoyé à {unconfirmedEmail}.</span>
            ) : (
              <button type="button" onClick={handleResend} className="min-h-11 text-sm font-black text-[#8c4a38] underline underline-offset-4">
                Renvoyer l’e-mail de confirmation
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
