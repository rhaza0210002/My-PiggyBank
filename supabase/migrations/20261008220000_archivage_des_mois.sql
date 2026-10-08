-- Archivage d'un mois pointé : on garde les TOTAUX RÉELS par catégorie et le nombre d'opérations
-- (pour les points), puis on efface le détail ligne par ligne des opérations bancaires.
-- Rien n'est archivé automatiquement : l'utilisateur déclenche l'archivage mois par mois.

create table if not exists public.archived_months (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  year             integer not null,
  month_index      integer not null check (month_index between 0 and 11),
  operations_count integer not null check (operations_count > 0),
  -- Dernier pointage du mois : sert à retrouver « mois bouclé » et « rattrapage » dans les récompenses.
  completed_at     timestamptz not null,
  archived_at      timestamptz not null default now(),
  primary key (user_id, year, month_index)
);

create table if not exists public.monthly_actuals (
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  year             integer not null,
  month_index      integer not null check (month_index between 0 and 11),
  category_id      uuid not null references public.transac_cat (id) on delete cascade,
  amount           numeric(12, 2) not null,
  operations_count integer not null check (operations_count > 0),
  primary key (user_id, year, month_index, category_id)
);

alter table public.archived_months enable row level security;
alter table public.monthly_actuals enable row level security;

drop policy if exists "archived_months_select_own" on public.archived_months;
create policy "archived_months_select_own" on public.archived_months
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "archived_months_insert_own" on public.archived_months;
create policy "archived_months_insert_own" on public.archived_months
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "monthly_actuals_select_own" on public.monthly_actuals;
create policy "monthly_actuals_select_own" on public.monthly_actuals
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "monthly_actuals_insert_own" on public.monthly_actuals;
create policy "monthly_actuals_insert_own" on public.monthly_actuals
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Archive un mois en une seule transaction : tout ou rien. SECURITY INVOKER : les politiques RLS
-- s'appliquent, un utilisateur ne peut archiver que ses propres opérations.
create or replace function public.archive_month(p_year integer, p_month_index integer)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
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
$$;

revoke all on function public.archive_month(integer, integer) from public, anon;
grant execute on function public.archive_month(integer, integer) to authenticated;
