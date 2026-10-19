-- Données de la base locale (dev et test), rechargées à chaque `supabase db reset`. Jamais envoyées en prod.
-- Les données de référence (groupes, catégories et règles partagées) viennent de la migration
-- 20261019130000_donnees_de_reference.sql. Ici : deux comptes fictifs et un petit budget, pour se connecter tout de suite.

-- Comptes fictifs (mots de passe de dev, sans valeur hors de cette base locale) :
--   dev@piggybank.local    / piggybank-dev     compte ordinaire, avec un petit budget
--   admin@piggybank.local  / piggybank-admin   administrateur (catégories partagées)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'dev@piggybank.local', extensions.crypt('piggybank-dev', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"pseudo":"Dev"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'admin@piggybank.local', extensions.crypt('piggybank-admin', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"],"role":"admin"}', '{"pseudo":"Admin"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), now(), now(), now()
from auth.users u
where u.email in ('dev@piggybank.local', 'admin@piggybank.local');

-- Budget du mois en cours et quelques opérations à pointer pour le compte dev.
with mois as (
  select extract(year from now())::smallint as y, (extract(month from now())::int - 1)::smallint as m,
         date_trunc('month', now())::date as debut
)
insert into public.budget_entries (user_id, category_id, month_index, year, amount)
select '11111111-1111-4111-8111-111111111111', c.id, mois.m, mois.y, b.montant
from mois, (values
  ('Salaire', 1800.00), ('Loyer', 650.00), ('EDF', 60.00), ('Téléphone & Internet', 35.00),
  ('Alimentation', 300.00), ('Loisir', 80.00), ('Epargne', 150.00)
) as b(categorie, montant)
join public.transac_cat c on c.label = b.categorie and c.user_id is null;

with mois as (select date_trunc('month', now())::date as debut)
insert into public.transactions (user_id, booked_on, label, amount, category_id, type, dedupe_key, reconciled_at)
select '11111111-1111-4111-8111-111111111111', mois.debut + o.jour, o.libelle, o.montant, c.id, o.type,
       'seed-' || o.jour || '-' || o.libelle, case when o.pointee then now() end
from mois, (values
  (0, 'VIR SALAIRE ENTREPRISE FICTIVE', 1800.00, 'Salaire', 'VIREMENT_ENTRANT', true),
  (1, 'PRLV LOYER', -650.00, 'Loyer', 'VIREMENT_SORTANT', true),
  (3, 'CARTE CARREFOUR CITY', -42.30, 'Alimentation', 'AUTRE', true),
  (5, 'PRLV ORANGE', -34.99, 'Téléphone & Internet', 'AUTRE', false),
  (7, 'CARTE U EXPRESS', -18.75, 'Alimentation', 'AUTRE', false),
  (9, 'CARTE CINEMA', -11.50, 'Loisir', 'AUTRE', false)
) as o(jour, libelle, montant, categorie, type, pointee)
join public.transac_cat c on c.label = o.categorie and c.user_id is null;
