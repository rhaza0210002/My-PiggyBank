import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Mot de passe oublié' };

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
