import webpush from 'web-push';
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdmin';
import { buildOverrunPayload, buildReminderPayload, isAuthorizedCron, isGoneSubscription } from '@/utils/reminder';

/** Heures minimum entre deux rappels pour un même appareil : au plus un par jour, jamais d'insistance. */
const MIN_HOURS_BETWEEN_REMINDERS = 20;

interface DueReminder {
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  pending_count: number | string;
}

interface DueOverrun {
  subscription_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  overrun_count: number | string;
  month_key: string;
}

/**
 * Tâche planifiée (Vercel Cron, voir vercel.json) : envoie un rappel aux appareils dont l'utilisateur a des
 * opérations à pointer. Protégée par CRON_SECRET (Vercel l'envoie en `Authorization: Bearer`).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? (process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : undefined);
  if (!publicKey || !privateKey || !subject) {
    return NextResponse.json({ error: 'Rappels non configurés.' }, { status: 503 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('reminders_due', { p_min_hours: MIN_HOURS_BETWEEN_REMINDERS });
  if (error) return NextResponse.json({ error: 'Lecture des rappels impossible.' }, { status: 500 });

  const due = (data ?? []) as DueReminder[];
  const sentIds: string[] = [];
  const goneIds: string[] = [];

  const push = async (
    target: { subscription_id: string; endpoint: string; p256dh: string; auth: string },
    payload: unknown,
  ): Promise<boolean> => {
    try {
      await webpush.sendNotification(
        { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 },
      );
      return true;
    } catch (sendError) {
      if (isGoneSubscription((sendError as { statusCode?: number }).statusCode)) goneIds.push(target.subscription_id);
      return false;
    }
  };

  await Promise.all(
    due.map(async (reminder) => {
      if (await push(reminder, buildReminderPayload(Number(reminder.pending_count)))) sentIds.push(reminder.subscription_id);
    }),
  );

  if (sentIds.length > 0) {
    await admin.from('push_subscriptions').update({ last_reminded_at: new Date().toISOString() }).in('id', sentIds);
  }

  // Alertes de dépassement : jamais le même jour qu'un rappel de pointage sur le même appareil (pas d'accumulation),
  // et seulement quand il y a plus de catégories en dépassement que lors de la dernière alerte.
  const { data: overrunData } = await admin.rpc('budget_overruns_due');
  const overruns = ((overrunData ?? []) as DueOverrun[]).filter((overrun) => !sentIds.includes(overrun.subscription_id));
  let overrunAlerts = 0;

  await Promise.all(
    overruns.map(async (overrun) => {
      const count = Number(overrun.overrun_count);
      if (!(await push(overrun, buildOverrunPayload(count)))) return;
      overrunAlerts += 1;
      await admin
        .from('push_subscriptions')
        .update({ overrun_alerted_month: overrun.month_key, overrun_alerted_count: count })
        .eq('id', overrun.subscription_id);
    }),
  );

  if (goneIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', goneIds);
  }

  return NextResponse.json({ due: due.length, sent: sentIds.length, overrunAlerts, removed: goneIds.length });
}
