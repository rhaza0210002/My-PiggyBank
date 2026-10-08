import { supabase } from '@/lib/supabaseClient';
import { SERVICE_WORKER_PATH } from '@/constants/routes';
import { urlBase64ToUint8Array } from '@/utils/pushKeys';

export type PushStatus = 'unsupported' | 'denied' | 'off' | 'on';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(SERVICE_WORKER_PATH);
}

/** Notifications bloquées dans le navigateur ? L'API des permissions est plus fiable que `Notification.permission`. */
async function isBlocked(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: 'notifications' });
    return status.state === 'denied';
  } catch {
    return Notification.permission === 'denied';
  }
}

/** État des rappels sur CET appareil (un abonnement par navigateur). */
export async function getPushStatus(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported';
  if (await isBlocked()) return 'denied';

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  return subscription ? 'on' : 'off';
}

/** Demande la permission, abonne l'appareil et enregistre l'abonnement (visible uniquement par son propriétaire). */
export async function enablePush(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported';

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error('Les rappels ne sont pas encore configurés sur ce serveur.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  const registration = await getRegistration();
  await navigator.serviceWorker.ready;
  let subscription: PushSubscription;
  try {
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
  } catch {
    throw new Error('Ce navigateur n’a pas pu activer les rappels. Essaie avec un autre navigateur ou vérifie ses réglages de notifications.');
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Abonnement aux rappels incomplet.');

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth }, { onConflict: 'endpoint' });
  if (error) {
    await subscription.unsubscribe().catch(() => {});
    throw new Error(`Activation des rappels impossible : ${error.message}`);
  }

  return 'on';
}

/** Coupe les rappels sur cet appareil : l'abonnement est supprimé côté navigateur ET côté base. */
export async function disablePush(): Promise<PushStatus> {
  if (!isSupported()) return 'unsupported';

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    if (error) throw new Error(`Désactivation des rappels impossible : ${error.message}`);
    await subscription.unsubscribe();
  }

  return 'off';
}
