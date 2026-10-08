"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  pseudo?: string;
}

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: AuthFormData) => void;
  isLoading?: boolean;
  /** Connexion / inscription avec Google ; absent = bouton masqué. */
  onGoogle?: () => void;
  /** Erreur renvoyée par le serveur (identifiants refusés, e-mail déjà utilisé...). */
  serverError?: string | null;
}

const MIN_PASSWORD_LENGTH = 8;
const INPUT_CLASS =
  'w-full min-h-12 rounded-[1.2rem] border-[2px] border-[#9c7560] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#7d685c] shadow-inner focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] aria-[invalid=true]:border-red-700';
const LABEL_CLASS = 'block px-1 text-sm font-bold text-[#5d4d44]';
const HINT_CLASS = 'px-1 text-xs text-[#6b574c]';

export default function AuthForm({ mode, onSubmit, isLoading = false, onGoogle, serverError = null }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const isRegister = mode === 'register';
  const error = validationError ?? serverError;

  // Annonce l'erreur au lecteur d'écran et place le focus dessus : on la lit sans chercher dans la page.
  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  const fail = (field: string, message: string) => {
    setInvalidField(field);
    setValidationError(message);
    return false;
  };

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (isRegister && !pseudo.trim()) return fail('pseudo', 'Renseigne un pseudo.');
    if (!emailRegex.test(email)) return fail('email', 'Entre une adresse e-mail valide, par exemple toi@exemple.com.');
    if (!password) return fail('password', 'Entre ton mot de passe.');
    if (isRegister && password.length < MIN_PASSWORD_LENGTH) {
      return fail('password', `Choisis un mot de passe d'au moins ${MIN_PASSWORD_LENGTH} caractères.`);
    }
    if (isRegister && password !== confirmPassword) {
      return fail('confirmPassword', 'Les deux mots de passe ne sont pas identiques.');
    }

    if (isRegister && !acceptedTerms) {
      return fail('terms', 'Coche la case pour accepter les conditions d’utilisation et la politique de confidentialité.');
    }

    setInvalidField(null);
    setValidationError(null);
    return true;
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      email: email.trim(),
      password,
      ...(isRegister ? { pseudo: pseudo.trim(), confirmPassword } : {}),
    });
  };

  // Sur l'inscription, Google crée aussi un compte : on demande donc d'abord d'accepter les conditions.
  const handleGoogle = () => {
    if (isRegister && !acceptedTerms) {
      fail('terms', 'Coche la case pour accepter les conditions d’utilisation et la politique de confidentialité.');
      return;
    }
    setInvalidField(null);
    setValidationError(null);
    onGoogle?.();
  };

  const fieldProps = (field: string) => ({
    'aria-invalid': invalidField === field ? true : undefined,
    'aria-describedby': invalidField === field ? 'auth-error' : undefined,
  });
  const passwordType = showPassword ? 'text' : 'password';

  return (
    <div className="relative w-full max-w-[440px] rounded-[2.2rem] bg-[#fff8f5] p-2 shadow-[0_10px_30px_rgba(140,103,86,0.12)] sm:p-5">
      <div className="space-y-6 rounded-[2.2rem] border-[3px] border-dashed border-[#d8b6a5] p-5 shadow-[0_10px_30px_rgba(140,103,86,0.12)] sm:p-6">

        <div className="space-y-2 text-center">
          <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e59a86] text-white shadow-md motion-safe:animate-bounce" aria-hidden="true">
            🐷
          </div>
          <h1 className="text-[1.8rem] font-black tracking-[-0.05em] text-[#5d4d44]">
            {isRegister ? "Crée ta tirelire" : "Connexion à My PiggyBank"}
          </h1>
          <p className="text-[0.95rem] text-[#6b574c]">
            {isRegister
              ? "Inscris-toi pour suivre tes dépenses et tes rapprochements."
              : "Retrouve ton budget en un clin d'œil."}
          </p>
        </div>

        {error && (
          <div
            id="auth-error"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className="rounded-xl border border-red-700 bg-red-50 p-3 text-center text-sm font-bold text-red-800 outline-none focus-visible:outline-3 focus-visible:outline-[#5b473d]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="auth-pseudo" className={LABEL_CLASS}>Pseudo</label>
              <input
                id="auth-pseudo"
                type="text"
                value={pseudo}
                onChange={(event) => setPseudo(event.target.value)}
                autoComplete="nickname"
                required
                placeholder="Ton pseudo"
                className={INPUT_CLASS}
                {...fieldProps('pseudo')}
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className={LABEL_CLASS}>Adresse e-mail</label>
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="toi@exemple.com"
              className={INPUT_CLASS}
              {...fieldProps('email')}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="auth-password" className={LABEL_CLASS}>Mot de passe</label>
            <input
              id="auth-password"
              type={passwordType}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              className={INPUT_CLASS}
              {...fieldProps('password')}
            />
            {isRegister ? (
              <p className={HINT_CLASS}>Au moins {MIN_PASSWORD_LENGTH} caractères.</p>
            ) : (
              <Link
                href={ROUTES.forgotPassword}
                className="mx-auto flex min-h-11 w-fit items-center px-1 text-sm font-bold text-[#8c4a38] underline underline-offset-4"
              >
                Mot de passe oublié ?
              </Link>
            )}
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="auth-confirm-password" className={LABEL_CLASS}>Confirmer le mot de passe</label>
              <input
                id="auth-confirm-password"
                type={passwordType}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                className={INPUT_CLASS}
                {...fieldProps('confirmPassword')}
              />
            </div>
          )}

          <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1 text-sm font-semibold text-[#5d4d44]">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="h-5 w-5 accent-[#a3452a]"
            />
            Afficher le mot de passe
          </label>

          {isRegister && (
            <div className="rounded-xl border border-[#d8b7a5] bg-[#fff8f2] p-3">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-semibold text-[#5d4d44]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#a3452a]"
                  {...fieldProps('terms')}
                />
                <span>
                  J’accepte les{' '}
                  <Link href={LEGAL_ROUTES.terms} target="_blank" className="font-black text-[#8c4a38] underline">
                    conditions d’utilisation<span className="sr-only"> (nouvel onglet)</span>
                  </Link>{' '}
                  et la{' '}
                  <Link href={LEGAL_ROUTES.privacy} target="_blank" className="font-black text-[#8c4a38] underline">
                    politique de confidentialité<span className="sr-only"> (nouvel onglet)</span>
                  </Link>
                  .
                </span>
              </label>
              <p className={`${HINT_CLASS} mt-1`}>
                Tes données restent à toi : tu peux les exporter ou supprimer ton compte à tout moment.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 min-h-12 w-full rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] py-3.5 text-center text-[1rem] font-bold text-[#3d2a21] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(171,98,77,0.85)] active:translate-y-[4px] active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-70"
          >
            {isLoading ? "Chargement…" : isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        {onGoogle && (
          <div className="space-y-3">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-[#6b574c]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#d8b7a5]" />
              ou
              <span className="h-px flex-1 bg-[#d8b7a5]" />
            </p>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[1.25rem] border-[2px] border-[#9c7560] bg-white py-3 font-bold text-[#3d2a21] transition-colors hover:bg-[#fcf9f6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#5b473d] disabled:opacity-70"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.5 5.8c4.4-4.1 7-10.1 7-17.5z" />
                <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
              {isRegister ? 'S’inscrire avec Google' : 'Continuer avec Google'}
            </button>
            {!isRegister && (
              <p className={`${HINT_CLASS} text-center`}>
                Si tu n’as pas encore de compte, il sera créé : tu acceptes alors les{' '}
                <Link href={LEGAL_ROUTES.terms} target="_blank" className="font-bold text-[#8c4a38] underline">
                  conditions<span className="sr-only"> (nouvel onglet)</span>
                </Link>{' '}
                et la{' '}
                <Link href={LEGAL_ROUTES.privacy} target="_blank" className="font-bold text-[#8c4a38] underline">
                  politique de confidentialité<span className="sr-only"> (nouvel onglet)</span>
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <div className="border-t border-[#d8b7a5]/60 pt-4 text-center">
          <p className="text-[0.95rem] text-[#5d4d44]">
            {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <Link
              href={isRegister ? ROUTES.login : ROUTES.register}
              className="inline-flex min-h-11 items-center font-black text-[#8c4a38] underline underline-offset-4"
            >
              {isRegister ? "Se connecter" : "Créer un compte"}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
