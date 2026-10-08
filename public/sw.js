// Service worker des rappels : n'affiche que le texte reçu (un nombre d'opérations, jamais de donnée bancaire)
// et n'ouvre que des chemins internes à l'application. Aucune mise en cache.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = typeof data.title === 'string' ? data.title : 'My PiggyBank';
  const body = typeof data.body === 'string' ? data.body : 'Des opérations t’attendent.';
  const url = typeof data.url === 'string' && data.url.startsWith('/') && !data.url.startsWith('//') ? data.url : '/';

  event.waitUntil(self.registration.showNotification(title, { body, data: { url }, tag: 'rappel-pointage' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => 'focus' in client);
      if (open) {
        open.navigate(url).catch(() => {});
        return open.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
