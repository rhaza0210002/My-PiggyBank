-- =========================================================
-- 1. Catégories personnelles
--
-- user_id NULL  : catégorie commune (créée par l'administrateur), visible par tous.
-- user_id = moi : catégorie personnelle, visible et modifiable par son propriétaire seulement.
--
-- Limites, vérifiées par la base (impossible à contourner depuis le navigateur) :
--   - 30 catégories personnelles au plus par compte ;
--   - nom de 1 à 40 caractères : lettres (accents compris), chiffres, espaces et & ' ’ ( ) . , / + - ;
--   - le nom commence par une lettre ou un chiffre (pas de formule de tableur du type =, +, -, @) ;
--   - pas de doublon avec une catégorie commune ou personnelle du même groupe ;
--   - une catégorie ne change jamais de propriétaire.
-- Idempotent.
-- =========================================================

alter table public.transac_cat
  add column if not exists user_id uuid default auth.uid() references auth.users (id) on delete cascade;

-- Les catégories existantes restent communes.
-- (Le défaut auth.uid() ne s'applique qu'aux nouvelles lignes.)

drop index if exists public.transac_cat_group_label_uidx;
create unique index if not exists transac_cat_shared_label_uidx
  on public.transac_cat (cat_group_key, lower(label)) where user_id is null;
create unique index if not exists transac_cat_own_label_uidx
  on public.transac_cat (user_id, cat_group_key, lower(label)) where user_id is not null;
create index if not exists transac_cat_user_id_idx on public.transac_cat (user_id);

create or replace function public.transac_cat_validate()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  own_count integer;
begin
  new.label := btrim(regexp_replace(coalesce(new.label, ''), '\s+', ' ', 'g'));

  if char_length(new.label) < 1 or char_length(new.label) > 40 then
    raise exception 'Le nom de la catégorie doit faire entre 1 et 40 caractères.' using errcode = '22023';
  end if;

  if new.label !~ '^[A-Za-z0-9À-ÖØ-öø-ÿŒœ][A-Za-z0-9À-ÖØ-öø-ÿŒœ ''’&().,/+-]*$' then
    raise exception 'Le nom de la catégorie ne peut contenir que des lettres, des chiffres, des espaces et & '' ’ ( ) . , / + -.'
      using errcode = '22023';
  end if;

  if tg_op = 'UPDATE' and new.user_id is distinct from old.user_id then
    raise exception 'Une catégorie ne change pas de propriétaire.' using errcode = '42501';
  end if;

  if new.user_id is not null then
    if exists (
      select 1 from public.transac_cat c
       where c.user_id is null and c.cat_group_key = new.cat_group_key and lower(c.label) = lower(new.label)
    ) then
      raise exception 'Cette catégorie existe déjà.' using errcode = '23505';
    end if;

    if tg_op = 'INSERT' then
      -- Verrou par compte : deux ajouts simultanés ne dépassent pas la limite.
      perform pg_advisory_xact_lock(hashtext('transac_cat:' || new.user_id::text));
      select count(*) into own_count from public.transac_cat c where c.user_id = new.user_id;
      if own_count >= 30 then
        raise exception 'Tu as atteint la limite de 30 catégories personnelles.' using errcode = '54000';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transac_cat_validate on public.transac_cat;
create trigger transac_cat_validate
  before insert or update on public.transac_cat
  for each row execute function public.transac_cat_validate();

-- Politiques : on repart de zéro (les anciennes avaient des noms tronqués et une lecture ouverte à tous).
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'transac_cat' loop
    execute format('drop policy %I on public.transac_cat', p.policyname);
  end loop;
end $$;

alter table public.transac_cat enable row level security;

create policy "transac_cat_select" on public.transac_cat
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "transac_cat_insert" on public.transac_cat
  for insert to authenticated
  with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));

create policy "transac_cat_update" on public.transac_cat
  for update to authenticated
  using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())))
  with check (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));

create policy "transac_cat_delete" on public.transac_cat
  for delete to authenticated
  using (user_id = (select auth.uid()) or (user_id is null and (select public.is_admin())));

-- =========================================================
-- 2. Garde-fous sur tous les textes saisis ou importés
--
-- Les requêtes passent par l'API Supabase, toujours paramétrée : pas d'injection SQL possible.
-- Ces contraintes ajoutent une limite de taille et refusent les caractères de contrôle
-- (retours chariot cachés, caractère nul…), quel que soit le chemin d'écriture.
-- NOT VALID : les lignes déjà présentes ne sont pas revérifiées, toutes les nouvelles le sont.
-- =========================================================

alter table public.users drop constraint if exists users_pseudo_safe;
alter table public.users add constraint users_pseudo_safe
  check (pseudo is null or (char_length(pseudo) between 1 and 40 and pseudo !~ '[[:cntrl:]]')) not valid;

alter table public.transactions drop constraint if exists transactions_label_safe;
alter table public.transactions add constraint transactions_label_safe
  check (char_length(label) between 1 and 300 and label !~ '[[:cntrl:]]') not valid;

alter table public.transactions drop constraint if exists transactions_dedupe_key_safe;
alter table public.transactions add constraint transactions_dedupe_key_safe
  check (char_length(dedupe_key) <= 500) not valid;

alter table public.transactions drop constraint if exists transactions_category_key_safe;
alter table public.transactions add constraint transactions_category_key_safe
  check (category_key is null or char_length(category_key) <= 80) not valid;

alter table public.libelle_transacts drop constraint if exists libelle_transacts_label_safe;
alter table public.libelle_transacts add constraint libelle_transacts_label_safe
  check (char_length(btrim(label)) between 2 and 80 and label !~ '[[:cntrl:]]') not valid;
