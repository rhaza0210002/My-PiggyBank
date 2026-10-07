-- =========================================================
-- Modèle de fonctions CRUD vides pour Supabase
-- Remplacez les noms de table et de colonnes par les vôtres.
-- =========================================================

create or replace function public.crud_create_budget(p_payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
begin
  -- TODO: remplacer "public.budgets" par votre vraie table
  -- TODO: insérer les données utiles ici
  -- Exemple :
  -- insert into public.budgets (name, amount, created_at)
  -- values (p_payload->>'name', (p_payload->>'amount')::numeric, now());

  return jsonb_build_object(
    'status', 'not_implemented',
    'message', 'Créer la logique INSERT ici.'
  );
end;
$$;

create or replace function public.crud_get_budget(p_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  -- TODO: sélectionner le budget correspondant à l'id
  -- Exemple :
  -- return to_jsonb((select * from public.budgets where id = p_id));

  return jsonb_build_object(
    'status', 'not_implemented',
    'message', 'Créer la logique SELECT ici.'
  );
end;
$$;

create or replace function public.crud_get_all_budgets()
returns setof jsonb
language plpgsql
security definer
as $$
begin
  -- TODO: retourner la liste complète des budgets
  -- Exemple :
  -- return query
  -- select to_jsonb(b)
  -- from public.budgets b;

  return;
end;
$$;

create or replace function public.crud_update_budget(p_id uuid, p_payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
begin
  -- TODO: mettre à jour le budget trouvé par p_id
  -- Exemple :
  -- update public.budgets
  -- set name = coalesce(p_payload->>'name', name),
  --     amount = coalesce((p_payload->>'amount')::numeric, amount)
  -- where id = p_id;

  return jsonb_build_object(
    'status', 'not_implemented',
    'message', 'Créer la logique UPDATE ici.'
  );
end;
$$;

create or replace function public.crud_delete_budget(p_id uuid)
returns jsonb
language plpgsql
security definer
as $$
begin
  -- TODO: supprimer le budget correspondant à l'id
  -- Exemple :
  -- delete from public.budgets where id = p_id;

  return jsonb_build_object(
    'status', 'not_implemented',
    'message', 'Créer la logique DELETE ici.'
  );
end;
$$;

-- =========================================================
-- Répétez ce schéma pour chaque table de votre base.
-- Exemple : crud_create_expense, crud_get_expense, ...
-- =========================================================
