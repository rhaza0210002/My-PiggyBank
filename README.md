# My PiggyBank

Application de suivi de budget : budget annuel et mensuel, import de relevés CSV (Société Générale),
catégorisation automatique des transactions et comparaison budget / dépenses réelles.

Stack : Next.js 16 (App Router), React 19, Tailwind 4, Supabase (auth + base Postgres).

## Démarrer

```bash
yarn install
cp .env.example .env.local   # puis renseigner les deux variables
yarn dev
```

Variables d'environnement (`.env.local`, jamais commité) :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique (anon) du projet |

Scripts : `yarn dev`, `yarn build`, `yarn lint`, `yarn typecheck`, `yarn test`.

## Base de données (Supabase)

Les scripts SQL sont dans `supabase/` :

- `supabase/migrations/` : tables `transactions` et `user_settings` (avec RLS), colonne `reconciled_at`, règles de libellé par utilisateur. À relire puis exécuter dans l'ordre des noms de fichier, dans le SQL Editor.
- `supabase/seed-libelle-transacts.sql` : règles par défaut libellé → catégorie (`user_id` vide) utilisées par l'import CSV. Chaque utilisateur peut ajouter ses propres règles, qui l'emportent sur celles par défaut.

## Authentification

La session Supabase est stockée dans des cookies (`@supabase/ssr`). `src/proxy.ts` redirige vers
`/connexion` toute requête sans session valide ; seules `/connexion` et `/inscription` sont publiques.

### Administrateur

Les catégories (`transac_cat`) sont partagées entre tous les comptes : seul un utilisateur dont
`app_metadata.role` vaut `admin` peut en créer, modifier ou supprimer (politiques RLS via
`public.is_admin()`). Il les crée depuis la page Rapprochement. Pour nommer un administrateur, dans le
SQL Editor (puis se reconnecter, le rôle est lu dans le jeton) :

```sql
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
 where email = 'votre@email';
```

## Progression et récompenses

Pensée pour les personnes neuroatypiques (dont TDAH) : une seule action mise en avant par écran, des
étapes courtes, un retour immédiat. Les points, niveaux et badges sont **calculés** à partir des
opérations pointées (`src/utils/gamification.ts`), rien n'est stocké : on ne peut donc rien perdre.
Un mois manqué passe en « à rattraper » (sans pénalité) et le terminer plus tard rapporte un bonus.
Les astuces du tableau de bord sont dans `src/utils/tips.ts`.

## Tests et CI

`yarn test` lance Vitest sur la logique pure (parsing CSV, déduplication, regroupement par catégorie,
écarts budget/réel, totaux). Les tests sont dans des dossiers `__tests__` à côté du code testé.

La CI GitHub (`.github/workflows/ci.yml`) exécute sur chaque pull request et sur `main` :
`yarn lint`, `yarn typecheck`, `yarn test` puis `yarn build` (avec de fausses valeurs Supabase,
le build n'appelle pas la base).

## Déploiement

L'application est un projet Next.js standard, déployable sur Vercel :

1. Importer le dépôt GitHub dans Vercel (framework détecté : Next.js, commande `yarn build`).
2. Définir `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` pour Production et Preview.
3. Dans Supabase, Authentication > URL Configuration : mettre l'URL de production dans *Site URL* et
   ajouter les URL de preview dans *Redirect URLs*.
4. Vérifier que les migrations de `supabase/migrations/` ont été exécutées sur la base de production.

## Structure

```
src/app/          pages (dashboard, budgetmensual, budgetannual, csvUploader, depense-reelle, ...)
src/components/   composants (forms, header, tables, charts, homecards)
src/services/     accès Supabase et parseur CSV
src/hooks/        useBudget, useStorage
src/lib/          client Supabase navigateur
src/proxy.ts      protection des routes
```
