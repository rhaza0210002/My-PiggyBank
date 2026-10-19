-- Données de la base locale (dev et test), rechargées à chaque `supabase db reset`. Jamais envoyées en prod.
-- 1. Données de référence copiées de la prod : groupes, catégories et règles partagées (user_id vide).
-- 2. Deux comptes fictifs et un petit budget, pour se connecter tout de suite.

insert into public.transac_cat_group (id, label, libelle) overriding system value values
  (1, 'decaissement', 'Décaissement services'),
  (2, 'reserve', 'Réserve de frais'),
  (3, 'revenus', 'Revenus');
select setval(pg_get_serial_sequence('public.transac_cat_group', 'id'), 3);

insert into public.transac_cat (id, label, cat_group_key, user_id) values
  ('0012debc-90d9-4bb9-bfd8-69002725bb3d', 'Internet', 1, null),
  ('6a9228c7-9389-44d3-805b-ffe7511a696d', 'Banque', 1, null),
  ('749b54b9-0d71-4e2d-bc4f-2edf660fa424', 'Loyer', 1, null),
  ('ad8890af-de2e-43c7-b980-b30b9847dc34', 'Téléphone & Internet', 1, null),
  ('b5a0be78-74a4-40f2-b5f6-68f1b418f72e', 'EDF', 1, null),
  ('d34e38d4-7493-44d9-be65-200c81389b0e', 'Assurance', 1, null),
  ('fd52c06a-0298-43e6-b8dc-6e9eda966423', 'Eau', 1, null),
  ('1ec0dd1a-52ac-47bb-ae4b-eaa1242f97bc', 'Tabac', 2, null),
  ('54766a6f-6da3-4efa-82a8-9e323e0e84c7', 'Epargne', 2, null),
  ('6231dca0-b465-4d41-822f-0bafeadc120a', 'Alimentation', 2, null),
  ('bc8570ac-a53b-4830-8d74-26578404ad8f', 'chabin', 2, null),
  ('c5920ff9-eae5-489f-ad1e-be7ff404de79', 'Loisir', 2, null),
  ('f4bd4d26-5a14-4e0e-9f29-d7e0e7a70859', 'Autres', 2, null),
  ('1bdbf686-6c39-46b5-9f9d-3bd4c1c46901', 'C.A.F', 3, null),
  ('65a91da4-8353-4e3b-8013-714b60cc99e3', 'Salaire', 3, null),
  ('83e41012-63aa-4349-8881-ebaf46bcd0b0', 'A.P.L', 3, null);

insert into public.libelle_transacts (label, key, id_cat, user_id) values
  ('acheel', 'Assurance', 'd34e38d4-7493-44d9-be65-200c81389b0e', null),
  ('arhvi', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('caf', 'C.A.F', '1bdbf686-6c39-46b5-9f9d-3bd4c1c46901', null),
  ('carrefour', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('chantilly', 'Tabac', '1ec0dd1a-52ac-47bb-ae4b-eaa1242f97bc', null),
  ('degand', 'Loyer', '749b54b9-0d71-4e2d-bc4f-2edf660fa424', null),
  ('e.leclerc', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('inter', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('jean-claude', 'Loyer', '749b54b9-0d71-4e2d-bc4f-2edf660fa424', null),
  ('lpv', 'Tabac', '1ec0dd1a-52ac-47bb-ae4b-eaa1242f97bc', null),
  ('orange', 'Téléphone & Internet', 'ad8890af-de2e-43c7-b980-b30b9847dc34', null),
  ('proxi', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('u express', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null),
  ('uber', 'Alimentation', '6231dca0-b465-4d41-822f-0bafeadc120a', null);

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
