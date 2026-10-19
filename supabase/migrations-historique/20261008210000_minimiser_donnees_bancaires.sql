-- Minimisation des données bancaires : plus aucun numéro de carte, IBAN, e-mail ni longue référence
-- dans les libellés stockés, et clé anti-doublon remplacée par son empreinte SHA-256 (même calcul que
-- l'application : un ré-import d'opérations déjà stockées reste reconnu comme doublon).
-- Idempotent : ne touche que les lignes pas encore traitées. Irréversible par nature (le texte masqué
-- n'est plus conservé), c'est le but.

update public.transactions
set label = trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(label, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '••@••', 'g'),
        '\y[A-Za-z]{2}\d{2}(\s?[A-Za-z0-9]{4}){3,7}(\s?[A-Za-z0-9]{1,4})?\y', 'IBAN ••••', 'g'),
      '\d{8,}', '••••', 'g'),
    '\yX\d{3,4}\y', 'X••••', 'gi')
)
where label ~* '(@|\d{8,}|\yX\d{3,4}\y|\y[A-Za-z]{2}\d{2}(\s?[A-Za-z0-9]{4}){3,7})';

update public.transactions
set dedupe_key = encode(sha256(convert_to(dedupe_key, 'UTF8')), 'hex')
where dedupe_key !~ '^[0-9a-f]{64}$';
