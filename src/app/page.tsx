import { redirect } from 'next/navigation';

export default function Home() {
  // TODO: Remplacer cette condition par la vraie vérification de session (ex: cookie, token, etc.)
  const isAuthenticated = false;

  if (isAuthenticated) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}