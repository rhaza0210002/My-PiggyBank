-- =========================================================
-- RLS : à RELIRE puis exécuter dans le SQL Editor Supabase.
-- Idempotent (drop policy if exists), sans effet sur les données.
--
-- Modèle appliqué (déduit du code de src/services/) :
--   users              -> chaque utilisateur ne voit/modifie que sa ligne
--   budget_entries     -> chaque utilisateur ne voit/modifie que ses lignes
--   transac_cat_group  -> référentiel partagé, lecture seule, connectés uniquement
--   transac_cat        -> référentiel partagé, lecture + ajout pour les connectés
--   libelle_transacts  -> référentiel partagé, lecture + écriture pour les connectés
--
-- DÉCISION À PRENDRE : transac_cat et libelle_transacts n'ont pas de user_id.
-- Tout utilisateur connecté peut donc modifier les règles de tous les autres.
-- OK pour un usage solo ; en multi-utilisateur, ajouter user_id (default auth.uid())
-- et remplacer les policies ci-dessous par une règle de propriété.
--
-- ATTENTION inscription : registerUser() fait un upsert dans users juste après
-- signUp(). Si la confirmation par e-mail est activée, il n'y a pas encore de
-- session à ce moment-là et la policy ci-dessous refusera l'écriture. Dans ce cas,
-- créer la ligne users via un trigger sur auth.users plutôt que depuis le client.
-- =========================================================

-- ---------- users ----------
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------- budget_entries ----------
alter table public.budget_entries enable row level security;

drop policy if exists "budget_entries_select_own" on public.budget_entries;
create policy "budget_entries_select_own" on public.budget_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "budget_entries_insert_own" on public.budget_entries;
create policy "budget_entries_insert_own" on public.budget_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "budget_entries_update_own" on public.budget_entries;
create policy "budget_entries_update_own" on public.budget_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "budget_entries_delete_own" on public.budget_entries;
create policy "budget_entries_delete_own" on public.budget_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------- transac_cat_group (lecture seule) ----------
alter table public.transac_cat_group enable row level security;

drop policy if exists "transac_cat_group_select_authenticated" on public.transac_cat_group;
create policy "transac_cat_group_select_authenticated" on public.transac_cat_group
  for select to authenticated
  using (true);

-- ---------- transac_cat (lecture + ajout) ----------
alter table public.transac_cat enable row level security;

drop policy if exists "transac_cat_select_authenticated" on public.transac_cat;
create policy "transac_cat_select_authenticated" on public.transac_cat
  for select to authenticated
  using (true);

drop policy if exists "transac_cat_insert_authenticated" on public.transac_cat;
create policy "transac_cat_insert_authenticated" on public.transac_cat
  for insert to authenticated
  with check (true);

-- ---------- libelle_transacts (lecture + écriture) ----------
alter table public.libelle_transacts enable row level security;

drop policy if exists "libelle_transacts_select_authenticated" on public.libelle_transacts;
create policy "libelle_transacts_select_authenticated" on public.libelle_transacts
  for select to authenticated
  using (true);

drop policy if exists "libelle_transacts_insert_authenticated" on public.libelle_transacts;
create policy "libelle_transacts_insert_authenticated" on public.libelle_transacts
  for insert to authenticated
  with check (true);

drop policy if exists "libelle_transacts_update_authenticated" on public.libelle_transacts;
create policy "libelle_transacts_update_authenticated" on public.libelle_transacts
  for update to authenticated
  using (true)
  with check (true);
