-- =========================================================
-- 1. Administrateur : seul un utilisateur dont app_metadata.role = 'admin' peut créer,
--    modifier ou supprimer des catégories (transac_cat est partagée entre tous les comptes).
--    app_metadata n'est modifiable que côté serveur (contrairement à user_metadata).
--    Le rôle est lu dans le JWT : il est pris en compte à la prochaine connexion.
--    Pour nommer un administrateur :
--      update auth.users
--         set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--       where email = '<email>';
-- Idempotent.
-- =========================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

alter policy "Activer l'insertion pour les utilisateurs authentifiés sur tra" on public.transac_cat
  with check ((select public.is_admin()));

alter policy "Activer la modification pour les utilisateurs authentifiés sur" on public.transac_cat
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

alter policy "Activer la suppression pour les utilisateurs authentifiés sur " on public.transac_cat
  using ((select public.is_admin()));

-- Une catégorie par nom et par groupe (insensible à la casse).
create unique index if not exists transac_cat_group_label_uidx
  on public.transac_cat (cat_group_key, lower(label));

-- =========================================================
-- 2. « Téléphone » et « Internet » ne forment plus qu'une catégorie « Téléphone & Internet » :
--    budgets additionnés, transactions et règles de libellé rattachées à la catégorie conservée.
-- =========================================================
do $$
declare
  tel uuid;
  net uuid;
begin
  select id into tel from public.transac_cat where label in ('Téléphone', 'Téléphone & Internet') order by label limit 1;
  select id into net from public.transac_cat where label = 'Internet' limit 1;

  if tel is not null and net is not null then
    update public.budget_entries t
       set amount = t.amount + n.amount
      from public.budget_entries n
     where t.category_id = tel and n.category_id = net
       and n.user_id = t.user_id and n.year = t.year and n.month_index = t.month_index;

    insert into public.budget_entries (user_id, category_id, month_index, year, amount)
    select n.user_id, tel, n.month_index, n.year, n.amount
      from public.budget_entries n
     where n.category_id = net
       and not exists (
         select 1 from public.budget_entries t
          where t.category_id = tel and t.user_id = n.user_id
            and t.year = n.year and t.month_index = n.month_index
       );

    delete from public.budget_entries where category_id = net;
    update public.transactions set category_id = tel where category_id = net;
    update public.libelle_transacts set id_cat = tel where id_cat = net;
    delete from public.transac_cat where id = net;
  end if;

  if tel is not null then
    update public.transac_cat set label = 'Téléphone & Internet' where id = tel;
  end if;
end $$;
