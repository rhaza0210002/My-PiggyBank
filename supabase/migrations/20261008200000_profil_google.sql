-- Connexion Google : le pseudo du profil retombe sur le nom Google (puis sur le début de l'e-mail).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, pseudo)
  values (
    new.id,
    new.email,
    left(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'pseudo', ''),
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'name', ''),
        split_part(new.email, '@', 1)
      ),
      40
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
