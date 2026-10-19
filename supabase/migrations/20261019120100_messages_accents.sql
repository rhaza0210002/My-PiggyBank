-- Corrige les messages d'erreur aux accents abîmés en prod (« connect├® » au lieu de « connecté ») :
-- archive_month et delete_my_account avaient été collés depuis une console Windows mal encodée.

create or replace function public.archive_month(p_year integer, p_month_index integer)
 returns integer
 language plpgsql
 set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_start date := make_date(p_year, p_month_index + 1, 1);
  v_next date := (make_date(p_year, p_month_index + 1, 1) + interval '1 month')::date;
  v_count integer;
  v_completed timestamptz;
begin
  if v_user is null then
    raise exception 'Vous devez être connecté.';
  end if;
  if p_month_index < 0 or p_month_index > 11 then
    raise exception 'Mois invalide.';
  end if;
  if exists (select 1 from archived_months where user_id = v_user and year = p_year and month_index = p_month_index) then
    raise exception 'Ce mois est déjà archivé.';
  end if;

  select count(*), max(reconciled_at) into v_count, v_completed
  from transactions
  where user_id = v_user and booked_on >= v_start and booked_on < v_next;

  if v_count = 0 then
    raise exception 'Aucune opération à archiver ce mois-ci.';
  end if;
  if exists (select 1 from transactions where user_id = v_user and booked_on >= v_start and booked_on < v_next and reconciled_at is null) then
    raise exception 'Pointe d’abord toutes les opérations du mois.';
  end if;
  if exists (select 1 from transactions where user_id = v_user and booked_on >= v_start and booked_on < v_next and category_id is null) then
    raise exception 'Catégorise d’abord toutes les opérations du mois.';
  end if;

  insert into monthly_actuals (user_id, year, month_index, category_id, amount, operations_count)
  select v_user, p_year, p_month_index, category_id, sum(amount), count(*)
  from transactions
  where user_id = v_user and booked_on >= v_start and booked_on < v_next
  group by category_id;

  insert into archived_months (user_id, year, month_index, operations_count, completed_at)
  values (v_user, p_year, p_month_index, v_count, v_completed);

  delete from transactions
  where user_id = v_user and booked_on >= v_start and booked_on < v_next;

  return v_count;
end;
$function$;

create or replace function public.delete_my_account()
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  caller uuid := (select auth.uid());
begin
  if caller is null then
    raise exception 'Utilisateur non connecté' using errcode = '28000';
  end if;

  delete from auth.users where id = caller;
end;
$function$;
