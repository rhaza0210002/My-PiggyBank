"use client";

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthCard, { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_LINK_CLASS } from '@/components/features/forms/AuthCard';
import { ROUTES } from '@/constants/routes';
import { supabase } from '@/lib/supabaseClient';
import { updatePassword } from '@/services/authService';

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(Boolean(data.session)));
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Choisis un mot de passe d'au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne sont pas identiques.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      router.push(ROUTES.dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Modification impossible.');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === null) {
    return (
      <AuthCard title="Nouveau mot de passe">
        <p role="status" className="text-center">Vérification du lien…</p>
      </AuthCard>
    );
  }

  if (!hasSession) {
    return (
      <AuthCard title="Lien expiré">
        <p role="alert" className="text-center text-texte">
          Ce lien n’est plus valable (il ne fonctionne qu’une fois, pendant une heure). Demande-en un nouveau.
        </p>
        <p className="text-center">
          <Link href={ROUTES.forgotPassword} className={AUTH_LINK_CLASS}>Recevoir un nouveau lien</Link>
        </p>
      </AuthCard>
    );
  }

  const type = showPassword ? 'text' : 'password';

  return (
    <AuthCard title="Nouveau mot de passe" intro="Choisis-en un que tu n’utilises nulle part ailleurs.">
      {error && (
        <div id="reset-error" role="alert" className="rounded-xl border-2 border-depasse bg-depasse-fond p-3 text-center text-sm font-bold text-depasse">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label htmlFor="reset-password" className={AUTH_LABEL_CLASS}>Nouveau mot de passe</label>
          <input
            id="reset-password"
            type={type}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={error ? 'reset-error' : undefined}
            className={AUTH_INPUT_CLASS}
          />
          <p className="px-1 text-xs text-texte-doux">Au moins {MIN_PASSWORD_LENGTH} caractères.</p>
        </div>
        <div className="space-y-1">
          <label htmlFor="reset-confirmation" className={AUTH_LABEL_CLASS}>Confirmer le mot de passe</label>
          <input
            id="reset-confirmation"
            type={type}
            autoComplete="new-password"
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1 text-sm font-semibold text-texte">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(event) => setShowPassword(event.target.checked)}
            className="h-5 w-5 accent-accent-fort"
          />
          Afficher le mot de passe
        </label>
        <button type="submit" disabled={isLoading} className={AUTH_BUTTON_CLASS}>
          {isLoading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </AuthCard>
  );
}
