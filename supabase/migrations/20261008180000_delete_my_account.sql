-- =========================================================
-- RGPD, droit à l'effacement (art. 17) : l'utilisateur supprime lui-même son compte.
-- Toutes les tables de l'application référencent auth.users avec ON DELETE CASCADE : supprimer
-- l'utilisateur efface son profil, ses transactions, son budget, ses règles et ses paramètres.
-- SECURITY DEFINER est nécessaire pour écrire dans auth.users ; la fonction ne supprime QUE le compte
-- de l'appelant (auth.uid()) et n'est exécutable que par les utilisateurs connectés.
-- Idempotent.
-- =========================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'Utilisateur non connecté' using errcode = '28000';
  end if;

  delete from auth.users where id = caller;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
