"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/features/forms/AuthForm';
import { ROUTES } from '@/constants/routes';
import { supabase } from '@/lib/supabaseClient';
import { registerUser, resendConfirmationEmail, signInWithGoogle } from '@/services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sent' | 'error'>('idle');

  const handleRegisterSubmit = async (data: { email: string; password: string; pseudo?: string }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await registerUser({ email: data.email, password: data.password, pseudo: data.pseudo });

      // Selon la configuration Supabase, le compte est connecté tout de suite ou après confirmation par e-mail.
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        router.push(ROUTES.dashboard);
      } else {
        setNeedsConfirmation(data.email);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Inscription avec Google impossible.');
    }
  };

  const handleResend = async () => {
    if (!needsConfirmation) return;
    try {
      await resendConfirmationEmail(needsConfirmation);
      setResendState('sent');
    } catch {
      setResendState('error');
    }
  };

  if (needsConfirmation) {
    return (
      <div className="relative flex w-full flex-1 items-center justify-center bg-[#ebcfc6] px-4 py-8 text-[#5b473d]">
        <div role="status" className="w-full max-w-[440px] space-y-3 rounded-[2.2rem] border-[3px] border-dashed border-[#d8b6a5] bg-[#fff8f5] p-6 text-center">
          <h1 className="text-[1.6rem] font-black tracking-[-0.05em] text-[#5d4d44]">Compte créé</h1>
          <p className="text-[#5d4d44]">
            Vérifie ta boîte mail : un lien de confirmation vient d&apos;être envoyé à <strong>{needsConfirmation}</strong>.
            Une fois confirmé, tu seras connecté. Pense aux courriers indésirables.
          </p>
          {resendState === 'sent' && <p role="status" className="text-sm font-bold">Nouvel e-mail envoyé.</p>}
          {resendState === 'error' && <p role="alert" className="text-sm font-bold text-red-800">Envoi impossible pour le moment, réessaie dans quelques minutes.</p>}
          <button type="button" onClick={handleResend} className="min-h-11 text-sm font-black text-[#8c4a38] underline underline-offset-4">
            Renvoyer l&apos;e-mail
          </button>
          <Link
            href={ROUTES.login}
            className="inline-flex min-h-12 items-center rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] px-6 font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)]"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-[#ebcfc6] px-4 py-8 text-[#5b473d]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#e59a86]/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#f2e6d8]/40 blur-3xl" aria-hidden="true" />

      <AuthForm mode="register" onSubmit={handleRegisterSubmit} onGoogle={handleGoogle} isLoading={isLoading} serverError={errorMessage} />
    </div>
  );
}
