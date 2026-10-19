-- =========================================================
-- Règles de catégorisation par utilisateur.
--
-- user_id NULL  : règle par défaut (seed), lisible par tous, en lecture seule.
-- user_id = moi : règle personnelle, que seul son propriétaire peut lire et modifier ;
--                 elle l'emporte sur une règle par défaut de même libellé (côté application).
--
-- À exécuter une seule fois. Les règles existantes restent des règles par défaut.
-- La politique de lecture existante est modifiée (alter policy) plutôt que recréée.
-- =========================================================

alter table public.libelle_transacts
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

create unique index if not exists libelle_transacts_user_label_idx
  on public.libelle_transacts (user_id, lower(label))
  where user_id is not null;

alter policy "Lecture des libellés de transactions" on public.libelle_transacts
  using (user_id is null or user_id = (select auth.uid()));

create policy "libelle_transacts_insert_own" on public.libelle_transacts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "libelle_transacts_update_own" on public.libelle_transacts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "libelle_transacts_delete_own" on public.libelle_transacts
  for delete to authenticated
  using (user_id = (select auth.uid()));
