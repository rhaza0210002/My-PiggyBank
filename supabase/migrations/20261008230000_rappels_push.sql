-- Rappels par notification (Web Push) : abonnements des appareils et sélection de qui rappeler.
-- Aucune donnée bancaire n'est jamais envoyée dans une notification : seulement un nombre d'opérations.

create table if not exists public.push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint         text not null unique,
  p256dh           text not null,
  auth             text not null,
  created_at       timestamptz not null default now(),
  -- Dernier rappel envoyé à cet appareil : garantit au plus un rappel par jour, jamais d'insistance.
  last_reminded_at timestamptz
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Appareils à rappeler maintenant : l'utilisateur a des opérations à pointer, n'a pas désactivé les rappels
-- (réglage « Opérations à rapprocher ») et n'a pas déjà été rappelé depuis p_min_hours heures.
-- Réservée au serveur (service_role) : aucun utilisateur ne peut lister les abonnements des autres.
create or replace function public.reminders_due(p_min_hours integer default 20)
returns table (
  subscription_id uuid,
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  pending_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select s.id, s.user_id, s.endpoint, s.p256dh, s.auth, p.pending_count
  from push_subscriptions s
  join lateral (
    select count(*) as pending_count
    from transactions t
    where t.user_id = s.user_id and t.reconciled_at is null
  ) p on p.pending_count > 0
  left join user_settings us on us.user_id = s.user_id
  where coalesce(us.notify_reconcile, true)
    and (s.last_reminded_at is null or s.last_reminded_at < now() - make_interval(hours => p_min_hours));
$$;

revoke all on function public.reminders_due(integer) from public, anon, authenticated;
grant execute on function public.reminders_due(integer) to service_role;
