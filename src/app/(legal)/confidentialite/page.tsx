import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument, { Placeholder } from '@/components/legal/LegalDocument';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Politique de confidentialité' };

const CELL = 'border border-[#d8b7a5] px-2 py-1.5 align-top text-left text-sm';

export default function ConfidentialitePage() {
  return (
    <LegalDocument
      title="Politique de confidentialité"
      intro="Cette page explique, simplement, quelles données personnelles My PiggyBank utilise, pourquoi, combien de temps, et comment tu gardes la main dessus."
    >
      <h2>1. Qui est responsable de tes données ?</h2>
      <p>
        {LEGAL.appName} est un projet pédagogique de démonstration, sans exploitation commerciale. Le responsable du
        traitement est l’éditeur du service :{' '}
        {LEGAL.publisherName.startsWith('[') ? <Placeholder>{LEGAL.publisherName}</Placeholder> : LEGAL.publisherName}
        . Contact pour toute question sur tes données :{' '}
        {LEGAL.contactEmail ? <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a> : <Placeholder>{LEGAL.contactEmailLabel}</Placeholder>}
        .
      </p>

      <h2>2. Quelles données, pour quoi faire ?</h2>
      <div className="mt-2 overflow-x-auto" role="region" aria-label="Tableau des données traitées" tabIndex={0}>
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="sr-only">Données traitées, finalités et bases légales</caption>
          <thead className="bg-[#f0d8c8]">
            <tr>
              <th scope="col" className={CELL}>Données</th>
              <th scope="col" className={CELL}>Finalité</th>
              <th scope="col" className={CELL}>Base légale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={CELL}>Adresse e-mail, pseudo, mot de passe (chiffré, jamais lisible)</th>
              <td className={CELL}>Créer ton compte, te connecter, sécuriser l’accès</td>
              <td className={CELL}>Exécution du service demandé (art. 6.1.b RGPD)</td>
            </tr>
            <tr>
              <th scope="row" className={CELL}>Opérations bancaires que tu importes (date, libellé, montant, catégorie)</th>
              <td className={CELL}>Suivre ton budget, rapprocher tes opérations, calculer ta progression</td>
              <td className={CELL}>Exécution du service demandé (art. 6.1.b)</td>
            </tr>
            <tr>
              <th scope="row" className={CELL}>Budgets, règles de libellé, réglages de notifications</th>
              <td className={CELL}>Personnaliser le service</td>
              <td className={CELL}>Exécution du service demandé (art. 6.1.b)</td>
            </tr>
            <tr>
              <th scope="row" className={CELL}>Données techniques de connexion (journaux, adresse IP)</th>
              <td className={CELL}>Sécurité, prévention des abus, dépannage</td>
              <td className={CELL}>Intérêt légitime à sécuriser le service (art. 6.1.f)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        {LEGAL.appName} ne se connecte pas à ta banque : seules les opérations que <strong>tu importes toi-même</strong>{' '}
        (fichier CSV) sont enregistrées. Le fichier lui-même est lu dans ton navigateur : il n’est jamais envoyé ni
        conservé. Avant l’enregistrement, les numéros de carte, IBAN, adresses e-mail et longues références sont
        masqués dans les libellés. Ceux-ci peuvent encore contenir le nom d’un tiers (un virement, un commerçant) :
        ils restent visibles uniquement par toi. Tu peux aussi, mois par mois, archiver un mois entièrement pointé : le détail
        des opérations est alors effacé et seuls les totaux par catégorie sont conservés.
      </p>
      <p>
        Si tu actives les rappels, l’adresse technique de notification de ton navigateur est enregistrée pour pouvoir t’envoyer
        un rappel par jour au maximum. Il ne contient jamais de montant ni de libellé, seulement un nombre d’opérations. Tu peux
        le couper à tout moment dans Paramètres ; il est supprimé avec ton compte.
      </p>
      <p>
        Nous ne collectons aucune donnée de santé ni aucune information sur ton état de santé. Aucune donnée n’est
        utilisée à des fins publicitaires, vendue ou cédée, et aucune décision automatisée produisant des effets
        juridiques n’est prise : les points et niveaux sont un simple calcul d’affichage.
      </p>

      <h2>3. Qui y a accès ?</h2>
      <ul>
        <li>Toi, uniquement : chaque compte est isolé des autres par des règles de sécurité au niveau de la base.</li>
        <li>
          Nos sous-traitants techniques : Supabase (base de données et authentification, hébergée dans l’Union
          européenne, région Francfort), Vercel Inc. (hébergement de l’application web) et, si tu choisis de te
          connecter avec Google, Google Ireland Limited (vérification de ton identité : nous recevons ton adresse
          e-mail et ton nom, jamais ton mot de passe Google).
        </li>
        <li>L’administrateur du service, uniquement pour gérer la liste des catégories (jamais tes opérations).</li>
      </ul>

      <h2>4. Transferts hors de l’Union européenne</h2>
      <p>
        Tes données sont stockées dans l’Union européenne (Francfort). Vercel Inc. étant une société américaine, le
        transit des pages par ses serveurs ou un accès à distance de ses équipes peut impliquer un transfert hors de
        l’Union ; il est alors encadré par des garanties appropriées (cadre de protection des données UE–États-Unis
        ou clauses contractuelles types).
      </p>

      <h2>5. Combien de temps ?</h2>
      <ul>
        <li>Tes données sont conservées tant que ton compte existe.</li>
        <li>
          Si tu supprimes ton compte, tout est effacé immédiatement de la base (profil, opérations, budgets, règles,
          réglages). Des copies techniques peuvent subsister dans les sauvegardes du prestataire pendant une durée
          limitée avant leur effacement automatique.
        </li>
        <li>Les journaux techniques sont conservés pour une durée limitée, conformément aux pratiques du prestataire.</li>
      </ul>

      <h2>6. Tes droits</h2>
      <p>
        Tu peux à tout moment accéder à tes données, les corriger, les récupérer dans un format lisible (portabilité),
        les faire effacer, limiter leur traitement ou t’y opposer.
      </p>
      <ul>
        <li>
          <strong>Directement dans l’application</strong> : la page{' '}
          <Link href={ROUTES.myData}>Mes données</Link> permet d’exporter tout ton contenu (fichier JSON) et de
          supprimer ton compte, sans démarche.
        </li>
        <li>Modifier ton pseudo ou ton mot de passe : page Profil.</li>
        <li>
          Pour toute autre demande, écris-nous
          {LEGAL.contactEmail ? <> à <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a></> : <> (adresse de contact à renseigner)</>}
          . Nous répondons dans un délai d’un mois.
        </li>
        <li>
          Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL :{' '}
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            cnil.fr/fr/plaintes<span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
          .
        </li>
      </ul>

      <h2>7. Sécurité</h2>
      <ul>
        <li>Connexion chiffrée (HTTPS) et mots de passe stockés sous forme chiffrée.</li>
        <li>Isolation des données par compte au niveau de la base (chaque requête est limitée à ton identifiant).</li>
        <li>Accès aux outils d’administration restreint et limité au strict nécessaire.</li>
        <li>Déconnexion qui efface la session et les données mises en cache sur ton appareil.</li>
      </ul>

      <h2>8. Cookies et stockage local</h2>
      <p>
        {LEGAL.appName} n’utilise que des cookies strictement nécessaires : aucun suivi publicitaire ni mesure
        d’audience. Détails sur la page <Link href={LEGAL_ROUTES.cookies}>Cookies</Link>.
      </p>

      <h2>9. Mineurs</h2>
      <p>Le service n’est pas destiné aux personnes de moins de 15 ans.</p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut évoluer. La date de dernière mise à jour figure en haut de page ; en cas de changement
        important, tu en seras informé dans l’application.
      </p>
    </LegalDocument>
  );
}
