"use client";

import React, { useState } from 'react';
import Link from 'next/link';

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
}

export default function AuthForm({ mode, onSubmit, isLoading = false }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return false;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return false;
    }

    if (isRegister) {
      if (!pseudo.trim()) {
        setError("Veuillez renseigner un pseudo.");
        return false;
      }
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit({
      email: email.trim(),
      password,
      ...(isRegister ? { pseudo: pseudo.trim(), confirmPassword } : {}),
    });
  };

  return (
    <div className="relative w-full max-w-[440px] rounded-[2.2rem] bg-[#fff8f5] p-2 sm:p-5 shadow-[0_10px_30px_rgba(140,103,86,0.12)]">
      <div className="border-[3px] border-dashed border-[#d8b6a5] rounded-[2.2rem] p-6 shadow-[0_10px_30px_rgba(140,103,86,0.12)] space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e59a86] text-white shadow-md mb-2 animate-bounce duration-1000" aria-hidden="true">
            🐷
          </div>
          <h1 className="text-[1.8rem] font-black tracking-[-0.05em] text-[#5d4d44]">
            {isRegister ? "Crée ta tirelire" : "Connexion à My PiggyBank"}
          </h1>
          <p className="text-[0.95rem] text-[#8c7366]">
            {isRegister
              ? "Inscris-toi pour suivre tes dépenses et tes rapprochements."
              : "Retrouve ton budget en un clin d'œil."}
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl bg-red-100 border border-red-300 p-3 text-xs font-bold text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="auth-pseudo" className="block text-xs font-bold uppercase tracking-wider text-[#7a6255] px-1">
                Pseudo
              </label>
              <input
                id="auth-pseudo"
                type="text"
                value={pseudo}
                onChange={(e) => setPseudo(e.target.value)}
                placeholder="Ton pseudo"
                className="w-full rounded-[1.2rem] border-[2px] border-[#d7b59d] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#a68e81] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e59a86] transition-all"
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="auth-email" className="block text-xs font-bold uppercase tracking-wider text-[#7a6255] px-1">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@exemple.com"
              className="w-full rounded-[1.2rem] border-[2px] border-[#d7b59d] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#a68e81] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e59a86] transition-all"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="auth-password" className="block text-xs font-bold uppercase tracking-wider text-[#7a6255]">
                Mot de passe
              </label>
              {!isRegister && (
                <Link href="/forgot-password" className="text-xs font-semibold text-[#a36351] hover:underline">
                  Oublié ?
                </Link>
              )}
            </div>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[1.2rem] border-[2px] border-[#d7b59d] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#a68e81] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e59a86] transition-all"
            />
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label htmlFor="auth-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-[#7a6255] px-1">
                Confirmer le mot de passe
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-[1.2rem] border-[2px] border-[#d7b59d] bg-[#fcf9f6] px-4 py-3 text-[#5d4d44] placeholder-[#a68e81] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#e59a86] transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-[1.25rem] border-[3px] border-[#e4a58f] bg-[#e59a86] py-3.5 text-center text-[1rem] font-bold text-[#fff8f5] shadow-[0_4px_0_rgba(171,98,77,0.85)] transition-all hover:translate-y-[2px] hover:shadow-[0_2px_0_rgba(171,98,77,0.85)] active:translate-y-[4px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-[#5b473d] disabled:opacity-70"
          >
            {isLoading ? "Chargement..." : isRegister ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#d8b7a5]/30">
          <p className="text-[0.95rem] text-[#7a6255]">
            {isRegister ? "Déjà un compte ? " : "Pas encore de compte ? "}
            <Link href={isRegister ? "/login" : "/register"} className="font-black text-[#a36351] hover:underline transition-colors">
              {isRegister ? "Se connecter" : "Créer un compte"}
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}