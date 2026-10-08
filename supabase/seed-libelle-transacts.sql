-- Règles par défaut (user_id NULL) : lisibles par tous les utilisateurs, modifiables seulement ici.
-- Chaque utilisateur peut ensuite ajouter ses propres règles depuis /csvUploader ; elles priment.
WITH mappings(label, key, category_label) AS (
  VALUES
    ('acheel', 'assurance', 'Assurance'),
    ('orange', 'phone', 'Téléphone'),
    ('carrefour', 'alimentation', 'Alimentation'),
    ('u express', 'alimentation', 'Alimentation'),
    ('inter', 'alimentation', 'Alimentation'),
    ('pharmacie', 'health', 'Santé'),
    ('caf', 'salaires', 'Salaires'),
    ('apl', 'salaires', 'Salaires'),
    ('proxi', 'alimentation', 'Alimentation'),
    ('e.leclerc', 'alimentation', 'Alimentation'),
    ('arhvi', 'alimentation', 'Alimentation'),
    ('amazon', 'ecommerce', 'E-commerce'),
    ('uber', 'alimentation', 'Alimentation'),
    ('steam', 'hobbies', 'Hobbies'),
    ('sogessur', 'bank', 'Banque'),
    ('jazz', 'bank', 'Banque'),
    ('sncf', 'transport', 'Transport'),
    ('chantilly', 'tabac', 'Tabac'),
    ('lpv', 'tabac', 'Tabac'),
    ('jean-claude', 'loyer', 'Loyer')
)
INSERT INTO public.libelle_transacts (label, key, id_cat)
SELECT mappings.label, mappings.key, category.id
FROM mappings
JOIN public.transac_cat category
  ON lower(trim(category.label)) = lower(trim(mappings.category_label))
WHERE NOT EXISTS (
  SELECT 1
  FROM public.libelle_transacts existing
  WHERE lower(trim(existing.label)) = lower(trim(mappings.label))
);
