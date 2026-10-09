import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My PiggyBank',
    short_name: 'PiggyBank',
    description: 'Suivi budgétaire tout doux : pointe tes opérations, rien ne se perd.',
    lang: 'fr',
    start_url: '/tableau-de-bord',
    scope: '/',
    display: 'standalone',
    background_color: '#f2fbea',
    theme_color: '#8fd36f',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
