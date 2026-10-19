-- Alerte de dépassement de budget par notification. Même définition que l'écran « Notifications » :
-- une catégorie dépasse quand son budget du mois est > 0 et que ses dépenses réelles (opérations négatives) le dépassent.
-- Une alerte n'est envoyée que lorsqu'il y a PLUS de catégories en dépassement que lors de la dernière alerte du mois
-- (jamais deux fois la même chose), et la notification ne cite que le nombre de catégories, pas leur nom.

alter table public.push_subscriptions
  add column if not exists overrun_alerted_month text,
  add column if not exists overrun_alerted_count integer not null default 0;

create or replace function public.budget_overruns_due()
returns table (
  subscription_id uuid,
  user_id uuid,
  endpoint text,
  p256dh text,
  auth text,
  overrun_count bigint,
  month_key text
)
language sql
stable
security invoker
set search_path = public
as $$
  with cur as (
    select
      extract(year from (now() at time zone 'Europe/Paris'))::int as y,
      extract(month from (now() at time zone 'Europe/Paris'))::int - 1 as m,
      to_char(now() at time zone 'Europe/Paris', 'YYYY-MM') as key,
      date_trunc('month', now() at time zone 'Europe/Paris')::date as start_d,
      (date_trunc('month', now() at time zone 'Europe/Paris') + interval '1 month')::date as next_d
  ),
  budgets as (
    select b.user_id, b.category_id, sum(b.amount) as budget
    from budget_entries b, cur
    where b.year = cur.y and b.month_index = cur.m
    group by b.user_id, b.category_id
    having sum(b.amount) > 0
  ),
  spent as (
    select t.user_id, t.category_id, sum(-t.amount) as spent
    from transactions t, cur
    where t.amount < 0
      and t.category_id is not null
      and t.booked_on >= cur.start_d
      and t.booked_on < cur.next_d
    group by t.user_id, t.category_id
  ),
  over as (
    select b.user_id, count(*) as n
    from budgets b
    join spent s on s.user_id = b.user_id and s.category_id = b.category_id
    where s.spent > b.budget
    group by b.user_id
  )
  select s.id, s.user_id, s.endpoint, s.p256dh, s.auth, o.n, cur.key
  from push_subscriptions s
  join over o on o.user_id = s.user_id
  cross join cur
  left join user_settings us on us.user_id = s.user_id
  where coalesce(us.notify_budget_overrun, true)
    and (s.overrun_alerted_month is distinct from cur.key or o.n > s.overrun_alerted_count);
$$;

revoke all on function public.budget_overruns_due() from public, anon, authenticated;
grant execute on function public.budget_overruns_due() to service_role;
