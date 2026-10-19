-- Données de référence dont l'app a besoin dans toute base (dev, test, prod) : groupes, catégories partagées
-- et règles d'import partagées (user_id vide, lisibles par tous, modifiables par un administrateur seulement).
-- Identifiants fixes pour que les liens restent les mêmes partout. Sans effet sur une base qui les a déjà.
-- Les règles aux noms personnels de la prod (« degand », « jean-claude », « chantilly », « lpv ») n'en font
-- pas partie : ce sont des règles d'un compte, pas des règles pour tout le monde.

insert into public.transac_cat_group (id, label, libelle) overriding system value values
  (1, 'decaissement', 'Décaissement services'),
  (2, 'reserve', 'Réserve de frais'),
  (3, 'revenus', 'Revenus')
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.transac_cat_group', 'id'),
  greatest((select max(id) from public.transac_cat_group), 1)
);

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
  ('83e41012-63aa-4349-8881-ebaf46bcd0b0', 'A.P.L', 3, null)
on conflict (id) do nothing;

-- Pas de contrainte d'unicité sur les règles partagées : on n'ajoute que celles qui manquent.
insert into public.libelle_transacts (label, key, id_cat, user_id)
select r.label, c.label, c.id, null
from (values
  ('acheel', 'Assurance'),
  ('arhvi', 'Alimentation'),
  ('caf', 'C.A.F'),
  ('carrefour', 'Alimentation'),
  ('e.leclerc', 'Alimentation'),
  ('inter', 'Alimentation'),
  ('orange', 'Téléphone & Internet'),
  ('proxi', 'Alimentation'),
  ('u express', 'Alimentation'),
  ('uber', 'Alimentation')
) as r(label, categorie)
join public.transac_cat c on c.label = r.categorie and c.user_id is null
where not exists (
  select 1 from public.libelle_transacts l where l.user_id is null and lower(l.label) = lower(r.label)
);
