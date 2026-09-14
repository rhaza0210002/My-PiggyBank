# Guide Supabase CRUD vide

Ce document permet de créer des fonctions SQL dans Supabase, prêtes à être complétées sans casser la base.

## 1. Créer la connexion Supabase

Dans votre projet Next.js, vérifiez que le fichier d’environnement contient bien :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

Le client est déjà configuré dans le projet :

```ts
import { supabase } from "@/lib/supabase";
```

## 2. Ouvrir le SQL Editor Supabase

1. Connectez-vous à votre projet Supabase.
2. Ouvrez l’onglet SQL Editor.
3. Copiez-collez le contenu du fichier `docs/supabase-crud-template.sql`.
4. Exécutez le script.

Les fonctions seront créées mais resteront vides tant que vous ajoutez la logique métier.

## 3. Structure attendue des fonctions

Les fonctions créées sont :

- `public.crud_create_budget(p_payload jsonb)`
- `public.crud_get_budget(p_id uuid)`
- `public.crud_get_all_budgets()`
- `public.crud_update_budget(p_id uuid, p_payload jsonb)`
- `public.crud_delete_budget(p_id uuid)`

Chaque fonction contient un bloc TODO pour la logique SQL réelle.

## 4. Utilisation côté Next.js

```ts
import { supabase } from "@/lib/supabase";

export async function createBudget() {
  const { data, error } = await supabase.rpc("crud_create_budget", {
    p_payload: {
      name: "Budget janvier",
      amount: 1500,
    },
  });

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}
```

### Lecture d’un budget

```ts
const { data, error } = await supabase.rpc("crud_get_budget", {
  p_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

### Lecture de tous les budgets

```ts
const { data, error } = await supabase.rpc("crud_get_all_budgets");
```

### Mise à jour

```ts
const { data, error } = await supabase.rpc("crud_update_budget", {
  p_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  p_payload: {
    name: "Budget février",
  },
});
```

### Suppression

```ts
const { data, error } = await supabase.rpc("crud_delete_budget", {
  p_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
});
```

## 5. Ce qu’il faut modifier ensuite

Remplacez les commentaires TODO par votre vraie logique SQL :

- `INSERT` pour la création
- `SELECT` pour la lecture
- `UPDATE` pour la modification
- `DELETE` pour la suppression

N’oubliez pas de remplacer :

- `public.budgets` par votre table réelle
- `uuid` par le type de clé adapté à votre table
- les champs JSON par les colonnes réelles

## 6. Bonnes pratiques

- Gardez les fonctions sécurisées avec `security definer` si besoin.
- Vérifiez les droits d’accès RLS sur les tables.
- Testez chaque fonction directement dans Supabase avant de l’appeler depuis le front.
- Ne laissez pas les fonctions en place sans logique métier, sinon elles ne feront rien.

## 7. Exemple de logique future

Une fonction finale peut ressembler à ceci :

```sql
create or replace function public.crud_create_budget(p_payload jsonb)
returns jsonb
language plpgsql
security definer
as $$
begin
  insert into public.budgets (name, amount, created_at)
  values (p_payload->>'name', (p_payload->>'amount')::numeric, now());

  return jsonb_build_object('status', 'success');
end;
$$;
```

Ce document est un point de départ propre, sûr et simple pour démarrer vos CRUD Supabase.
