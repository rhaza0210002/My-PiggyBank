"use client";

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import AuthCard, { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_LINK_CLASS } from '@/components/features/forms/AuthCard';
import { ROUTES } from '@/constants/routes';
import { requestPasswordReset } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Entre une adresse e-mail valide, par exemple toi@exemple.com.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible pour le moment.');
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Vérifie ta boîte mail">
        <p role="status" className="text-center text-[#5d4d44]">
          Si un compte existe pour <strong>{email.trim()}</strong>, un lien pour choisir un nouveau mot de passe vient
          d’être envoyé. Pense à regarder dans les courriers indésirables. Le lien est valable une heure.
        </p>
        <p className="text-center">
          <Link href={ROUTES.login} className={AUTH_LINK_CLASS}>Retour à la connexion</Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Mot de passe oublié" intro="Pas de panique : on t’envoie un lien pour en choisir un nouveau.">
      {error && (
        <div id="forgot-error" role="alert" className="rounded-xl border border-red-700 bg-red-50 p-3 text-center text-sm font-bold text-red-800">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="forgot-email" className={AUTH_LABEL_CLASS}>Adresse e-mail</label>
          <input
            id="forgot-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="toi@exemple.com"
            aria-describedby={error ? 'forgot-error' : undefined}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={isLoading} className={AUTH_BUTTON_CLASS}>
          {isLoading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>
      <p className="border-t border-[#d8b7a5]/60 pt-3 text-center">
        <Link href={ROUTES.login} className={AUTH_LINK_CLASS}>Retour à la connexion</Link>
      </p>
    </AuthCard>
  );
}
