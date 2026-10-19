-- =========================================================
-- Pointage des transactions : reconciled_at est renseignée quand l'utilisateur
-- valide une opération (rapprochement), NULL tant qu'elle reste à traiter.
-- Idempotent.
-- =========================================================

alter table public.transactions
  add column if not exists reconciled_at timestamptz;

create index if not exists transactions_user_unreconciled_idx
  on public.transactions (user_id, booked_on desc)
  where reconciled_at is null;
