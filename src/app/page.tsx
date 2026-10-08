import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

// Le proxy envoie déjà chaque visiteur au bon endroit ; ceci couvre le cas où il ne passerait pas.
export default function Home() {
  redirect(ROUTES.login);
}
