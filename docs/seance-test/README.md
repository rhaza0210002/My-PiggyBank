# Séance de test entre amis

## Pour moi (avant la séance)

1. Une seule fois : `winget install Cloudflare.cloudflared`.
2. Une seule fois, dans Supabase › Authentication › URL Configuration › Redirect URLs, ajouter
   `https://*.trycloudflare.com/**` (sinon « mot de passe oublié » renvoie au mauvais endroit).
3. Le PC reste allumé, branché, sans veille, pendant toute la séance.
4. `yarn seance-test` : le lien s'affiche et il est déjà copié. Je l'envoie avec le message ci-dessous.
   Seulement le Wi-Fi de la maison : `yarn seance-test --wifi`.
5. Après : lire `.superpowers/retours/retours.jsonl` (une ligne par retour), ou demander à Claude de le résumer.

Le lien change à chaque lancement et cesse de marcher dès que j'arrête (Ctrl+C).
Les comptes créés par mes amis sont de vrais comptes dans la base : je pourrai les supprimer après.

## Le message à envoyer

> Coucou ! Je fabrique **My PiggyBank**, une app pour tenir son budget sans prise de tête.
> Tu veux bien essayer de la **casser** ? Plus tu trouves de bugs, mieux c'est 😄
>
> 👉 **Le lien** : (je colle le lien ici) — il marche tant que mon PC est allumé, aujourd'hui seulement.
>
> - Crée-toi un compte avec un vrai e-mail (tu recevras un lien de confirmation). **N'écris aucune vraie donnée bancaire.**
> - Quand quelque chose est bizarre, moche, pas clair ou cassé : bouton **« Signaler un souci »** en bas à gauche.
>   Dis ce que tu faisais et ce qui s'est passé. Les plantages, eux, me parviennent tout seuls.
>
> **Tes missions** (dans l'ordre que tu veux) :
> 1. Inscription, déconnexion, reconnexion, puis « mot de passe oublié ».
> 2. Remplis ton budget du mois. Essaie des montants absurdes : négatifs, énormes, avec des lettres, des virgules, des points.
> 3. Crée tes propres catégories avec des noms tordus : très longs, avec des emojis, des symboles, du code.
> 4. Importe les relevés piégés que je t'envoie (3 fichiers `.csv`) et pointe les dépenses.
> 5. Change ton pseudo, puis va voir les paramètres et l'accessibilité (la fleur).
> 6. Fais tout ça sur ton téléphone, en le tournant, en zoomant, en revenant en arrière.
> 7. Mode chaos : clique partout très vite, double-clique, ouvre deux onglets, coupe le Wi-Fi au milieu d'un envoi.
>
> Merci ❤️

## Les fichiers piégés

| Fichier | Ce qu'il teste |
| --- | --- |
| `releve-piege-1-injections.csv` | Code HTML, formules de tableur, injection SQL, emojis dans les libellés |
| `releve-piege-2-bizarre.csv` | Dates impossibles, montants vides ou en lettres, doublons, guillemets, libellé géant |
| `releve-piege-3-pas-un-releve.csv` | Un fichier qui n'est pas un relevé du tout |

Attendu : rien ne s'exécute, rien ne plante, et l'app explique ce qu'elle refuse.
