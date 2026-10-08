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

Scripts : `yarn dev`, `yarn build`, `yarn lint`.

## Base de données (Supabase)

Les scripts SQL sont dans `supabase/` :

- `supabase/migrations/` : RLS et politiques d'accès, à relire puis exécuter dans le SQL Editor.
- `supabase/seed-libelle-transacts.sql` : règles libellé → catégorie utilisées par l'import CSV.

## Authentification

La session Supabase est stockée dans des cookies (`@supabase/ssr`). `src/proxy.ts` redirige vers
`/login` toute requête sans session valide ; seules `/login` et `/register` sont publiques.

## Structure

```
src/app/          pages (dashboard, budgetmensual, budgetannual, csvUploader, depense-reelle, ...)
src/components/   composants (forms, header, tables, charts, homecards)
src/services/     accès Supabase et parseur CSV
src/hooks/        useBudget, useStorage
src/lib/          client Supabase navigateur
src/proxy.ts      protection des routes
```
