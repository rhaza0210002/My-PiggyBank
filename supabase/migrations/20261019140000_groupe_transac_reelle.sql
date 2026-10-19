-- Groupe « Transactions réelles » : les catégories créées au pointage (par un administrateur) pour ranger les
-- opérations du relevé qui ne correspondent à aucune ligne du budget prévu. Hors du budget à planifier.
insert into public.transac_cat_group (id, label, libelle) overriding system value values
  (4, 'transac_reelle', 'Transactions réelles')
on conflict (id) do nothing;

select setval(
  pg_get_serial_sequence('public.transac_cat_group', 'id'),
  greatest((select max(id) from public.transac_cat_group), 1)
);
