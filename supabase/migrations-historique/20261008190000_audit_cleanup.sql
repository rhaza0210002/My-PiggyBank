-- =========================================================
-- Nettoyage issu de l'audit : performance RLS, index, doublon, profil à l'inscription, clés de règles.
-- Idempotent.
-- =========================================================

-- 1. RLS : (select auth.uid()) est évalué une seule fois par requête au lieu d'une fois par ligne.
alter policy "Users can view own profile" on public.users using ((select auth.uid()) = id);
alter policy "Users can update own profile" on public.users
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
alter policy "Users can insert own profile" on public.users with check ((select auth.uid()) = id);

alter policy "Utilisateurs - Lecture budget_entries" on public.budget_entries using ((select auth.uid()) = user_id);
alter policy "Utilisateurs - Insertion budget_entries" on public.budget_entries with check ((select auth.uid()) = user_id);
alter policy "Utilisateurs - Modification budget_entries" on public.budget_entries
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy "Utilisateurs - Suppression budget_entries" on public.budget_entries using ((select auth.uid()) = user_id);

-- 2. Index sur les clés étrangères.
create index if not exists budget_entries_category_id_idx on public.budget_entries (category_id);
create index if not exists libelle_transacts_id_cat_idx on public.libelle_transacts (id_cat);

-- 3. Clé étrangère en double sur libelle_transacts.id_cat (les deux sont identiques).
alter table public.libelle_transacts drop constraint if exists fk_libelle_transacts_cat;

-- 4. Profil public créé par la base à l'inscription (plus d'écriture côté client, qui échouait sans session
--    quand la confirmation par e-mail est active).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, pseudo)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'pseudo', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profils manquants pour les comptes existants.
insert into public.users (id, email, pseudo)
select a.id, a.email, nullif(a.raw_user_meta_data ->> 'pseudo', '')
from auth.users a
where not exists (select 1 from public.users u where u.id = a.id)
on conflict (id) do nothing;

-- 5. libelle_transacts.key recopie le nom de la catégorie : il suit désormais ses renommages.
create or replace function public.sync_label_rule_keys()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.label is distinct from old.label then
    update public.libelle_transacts set key = new.label where id_cat = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists transac_cat_sync_rule_keys on public.transac_cat;
create trigger transac_cat_sync_rule_keys
  after update of label on public.transac_cat
  for each row execute function public.sync_label_rule_keys();

update public.libelle_transacts l
   set key = c.label
  from public.transac_cat c
 where c.id = l.id_cat and l.key is distinct from c.label;
