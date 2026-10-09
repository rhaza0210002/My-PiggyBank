"use client";

import Button from '@/components/ui/Button';
import GoogleLogo from '@/components/features/forms/GoogleLogo';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';
import Pig from '@/components/ui/Pig';

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
  'w-full min-h-12 rounded-carte border-[2px] border-bordure-forte bg-surface px-4 py-3 text-texte placeholder-texte-doux shadow-inner focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus aria-[invalid=true]:border-depasse';
const LABEL_CLASS = 'block px-1 text-sm font-bold text-texte';
const HINT_CLASS = 'px-1 text-xs text-texte-doux';

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
    <div className="relative w-full max-w-[440px] rounded-carte border-[3px] border-texte bg-surface p-2 shadow-sticker sm:p-5">
      <div className="space-y-6 rounded-carte border-[3px] border-dashed border-bordure p-5 sm:p-6">

        <div className="space-y-2 text-center">
          <Pig className="mx-auto mb-2 size-16" />
          <h1 className="text-[1.8rem] font-black tracking-[-0.05em] text-texte">
            {isRegister ? "Crée ta tirelire" : "Connexion à My PiggyBank"}
          </h1>
          <p className="text-[0.95rem] text-texte-doux">
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
            className="rounded-xl border border-depasse bg-depasse-fond p-3 text-center text-sm font-bold text-depasse outline-none focus-visible:outline-3 focus-visible:outline-focus"
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
                className="mx-auto flex min-h-11 w-fit items-center px-1 text-sm font-bold text-accent-fort underline underline-offset-4"
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

          <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1 text-sm font-semibold text-texte">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="h-5 w-5 accent-accent-fort"
            />
            Afficher le mot de passe
          </label>

          {isRegister && (
            <div className="rounded-xl border border-bordure bg-surface p-3">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-semibold text-texte">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-accent-fort"
                  {...fieldProps('terms')}
                />
                <span>
                  J’accepte les{' '}
                  <Link href={LEGAL_ROUTES.terms} target="_blank" className="font-black text-accent-fort underline">
                    conditions d’utilisation<span className="sr-only"> (nouvel onglet)</span>
                  </Link>{' '}
                  et la{' '}
                  <Link href={LEGAL_ROUTES.privacy} target="_blank" className="font-black text-accent-fort underline">
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

          <Button type="submit" disabled={isLoading} className="mt-2 min-h-12 w-full">
            {isLoading ? "Chargement…" : isRegister ? "S'inscrire" : "Se connecter"}
          </Button>
        </form>

        {onGoogle && (
          <div className="space-y-3">
            <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-texte-doux" aria-hidden="true">
              <span className="h-px flex-1 bg-bordure" />
              ou
              <span className="h-px flex-1 bg-bordure" />
            </p>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-carte border-[2px] border-bordure-forte bg-surface py-3 font-bold text-sur-accent transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-70"
            >
              <GoogleLogo />
              {isRegister ? 'S’inscrire avec Google' : 'Continuer avec Google'}
            </button>
            {!isRegister && (
              <p className={`${HINT_CLASS} text-center`}>
                Si tu n’as pas encore de compte, il sera créé : tu acceptes alors les{' '}
                <Link href={LEGAL_ROUTES.terms} target="_blank" className="font-bold text-accent-fort underline">
                  conditions<span className="sr-only"> (nouvel onglet)</span>
                </Link>{' '}
                et la{' '}
                <Link href={LEGAL_ROUTES.privacy} target="_blank" className="font-bold text-accent-fort underline">
                  politique de confidentialité<span className="sr-only"> (nouvel onglet)</span>
                </Link>
                .
              </p>
            )}
          </div>
        )}

        <div className="border-t border-bordure/60 pt-4 text-center">
          <p className="text-[0.95rem] text-texte">
            {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <Link
              href={isRegister ? ROUTES.login : ROUTES.register}
              className="inline-flex min-h-11 items-center font-black text-accent-fort underline underline-offset-4"
            >
              {isRegister ? "Se connecter" : "Créer un compte"}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
