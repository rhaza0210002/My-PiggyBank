"use client";

import { useEffect, useState, type FormEvent } from 'react';
import LogoutButton from '@/components/features/header/LogoutButton';
import Link from 'next/link';
import ScreenCard from '@/components/ui/ScreenCard';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';
import { supabase } from '@/lib/supabaseClient';
import { updatePassword } from '@/services/authService';
import { getUserProfile, updateUserProfile } from '@/services/userService';

const CARD = 'rounded-3xl border border-[#e5c4b4] bg-[#fff8f2] p-4 shadow-sm';
const INPUT = 'mt-1 min-h-11 w-full rounded-xl border-2 border-[#9c7560] bg-white px-3 text-[#5a4d41]';
const BUTTON =
  'mx-auto flex min-h-11 items-center justify-center rounded-2xl border border-[#E5C4B4] bg-[#F8D5CB] px-4 py-2 text-sm font-semibold text-[#8f3d24] transition-colors hover:bg-[#f2c4b6] focus:outline-hidden focus:ring-2 focus:ring-[#5b473d] disabled:opacity-60';
const MIN_PASSWORD_LENGTH = 8;

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

function FeedbackMessage({ feedback }: { feedback: Feedback | null }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.tone === 'error' ? 'alert' : 'status'}
      className={`mt-3 text-sm font-semibold ${feedback.tone === 'error' ? 'text-red-700' : 'text-green-800'}`}
    >
      {feedback.message}
    </p>
  );
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [profileFeedback, setProfileFeedback] = useState<Feedback | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const user = data.user;
        if (!user || !isCurrent) return;
        const profile = await getUserProfile(user.id);
        if (!isCurrent) return;
        setUserId(user.id);
        setEmail(user.email ?? profile?.email ?? '');
        setPseudo(profile?.pseudo ?? '');
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setProfileFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Impossible de charger ton profil.',
        });
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);
    try {
      const updated = await updateUserProfile(userId, { pseudo: pseudo.trim() || null });
      setPseudo(updated.pseudo ?? '');
      setProfileFeedback({ tone: 'success', message: 'Profil mis à jour.' });
    } catch (error) {
      setProfileFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Mise à jour impossible.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFeedback(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setPasswordFeedback({ tone: 'error', message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` });
      return;
    }
    if (password !== confirmation) {
      setPasswordFeedback({ tone: 'error', message: 'Les deux mots de passe ne correspondent pas.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmation('');
      setPasswordFeedback({ tone: 'success', message: 'Mot de passe modifié.' });
    } catch (error) {
      setPasswordFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Modification impossible.',
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <ScreenCard title="Ton espace personnel" icon="🧸">
      <div className="grid gap-3 md:grid-cols-2">

      <section aria-labelledby="identity-title" className={CARD}>
        <h2 id="identity-title" className="text-center text-lg font-bold text-[#5a4d41]">Identité</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-[#6b574c]" role="status">Chargement…</p>
        ) : (
          <form onSubmit={handleProfileSubmit} className="mx-auto mt-2 max-w-md space-y-2">
            <label className="block text-sm font-semibold text-[#5a4d41]">
              Adresse e-mail
              <input type="email" value={email} readOnly className={`${INPUT} bg-[#f5eadf] text-[#6b574c]`} />
            </label>
            <label className="block text-sm font-semibold text-[#5a4d41]">
              Pseudo
              <input
                type="text"
                value={pseudo}
                onChange={(event) => setPseudo(event.target.value)}
                maxLength={40}
                className={INPUT}
              />
            </label>
            <button type="submit" disabled={isSavingProfile || !userId} className={BUTTON}>
              {isSavingProfile ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <FeedbackMessage feedback={profileFeedback} />
          </form>
        )}
      </section>

      <section aria-labelledby="password-title" className={CARD}>
        <h2 id="password-title" className="text-center text-lg font-bold text-[#5a4d41]">Mot de passe</h2>
        <form onSubmit={handlePasswordSubmit} className="mx-auto mt-2 max-w-md space-y-2">
          <label className="block text-sm font-semibold text-[#5a4d41]">
            Nouveau mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className={INPUT}
            />
          </label>
          <label className="block text-sm font-semibold text-[#5a4d41]">
            Confirmer le mot de passe
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              className={INPUT}
            />
          </label>
          <button type="submit" disabled={isSavingPassword} className={BUTTON}>
            {isSavingPassword ? 'Modification…' : 'Modifier le mot de passe'}
          </button>
          <FeedbackMessage feedback={passwordFeedback} />
        </form>
      </section>

      <section aria-labelledby="session-title" className={CARD}>
        <h2 id="session-title" className="text-center text-lg font-bold text-[#5a4d41]">Session</h2>
        <p className="mt-1 text-center text-sm text-[#6b574c]">
          Termine ta session sur cet appareil. Tu devras te reconnecter pour accéder à tes budgets.
        </p>
        <LogoutButton className="mt-4 flex flex-col items-center" />
      </section>

      <section aria-labelledby="legal-title" className={`${CARD} md:col-span-2`}>
        <h2 id="legal-title" className="text-center text-lg font-bold text-[#5a4d41]">Données et informations légales</h2>
        <ul className="mt-2 grid gap-x-4 sm:grid-cols-3">
          {[
            [ROUTES.myData, 'Mes données (exporter, supprimer)'],
            [LEGAL_ROUTES.privacy, 'Politique de confidentialité'],
            [LEGAL_ROUTES.cookies, 'Cookies'],
            [LEGAL_ROUTES.terms, 'Conditions d’utilisation'],
            [LEGAL_ROUTES.legalNotice, 'Mentions légales'],
            [LEGAL_ROUTES.accessibility, 'Accessibilité'],
          ].map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="inline-flex min-h-11 items-center text-sm font-semibold text-[#8c4a38] underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      </div>
    </ScreenCard>
  );
}
