-- =========================================================
-- Transactions bancaires importées (une ligne par opération, par utilisateur).
-- À relire puis exécuter dans le SQL Editor Supabase. Idempotent.
--
-- dedupe_key : clé calculée côté application (date | montant | libellé brut |
-- n-ième occurrence dans le fichier). Elle permet de réimporter un même relevé,
-- ou un relevé qui chevauche le précédent, sans créer de doublons.
--
-- category_id est en text sans clé étrangère : le type de transac_cat.id n'est pas
-- versionné dans le dépôt. À remplacer par une FK vers transac_cat(id) une fois le
-- type confirmé.
-- =========================================================

create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  booked_on    date not null,
  label        text not null,
  amount       numeric(12, 2) not null,
  category_id  text,
  category_key text,
  type         text not null default 'AUTRE'
               check (type in ('VIREMENT_ENTRANT', 'VIREMENT_SORTANT', 'AUTRE')),
  dedupe_key   text not null,
  created_at   timestamptz not null default now(),
  constraint transactions_user_dedupe_key unique (user_id, dedupe_key)
);

create index if not exists transactions_user_booked_on_idx
  on public.transactions (user_id, booked_on desc);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Les tables créées en SQL ne sont pas toujours exposées à l'API : à vérifier dans
-- Settings > Data API. Si besoin :
-- grant select, insert, update, delete on public.transactions to authenticated;
