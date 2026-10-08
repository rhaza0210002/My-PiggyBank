-- =========================================================
-- Préférences de l'utilisateur (une ligne par utilisateur). 
-- Une absence de ligne = valeurs par défaut côté application. À exécuter une seule fois
-- (les politiques ne sont pas recréées si elles existent déjà).
-- =========================================================

create table if not exists public.user_settings (
  user_id               uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  notify_reconcile      boolean not null default true,
  notify_budget_overrun boolean not null default true,
  updated_at            timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own" on public.user_settings
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own" on public.user_settings
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
