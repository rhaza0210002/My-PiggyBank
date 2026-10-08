import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument from '@/components/legal/LegalDocument';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Cookies et stockage local' };

const CELL = 'border border-[#d8b7a5] px-2 py-1.5 align-top text-left text-sm';

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookies et stockage local"
      intro="Bonne nouvelle : My PiggyBank n’utilise aucun cookie publicitaire ni de mesure d’audience. Il n’y a donc pas de bandeau à accepter."
    >
      <h2>Ce qui est enregistré sur ton appareil</h2>
      <div className="mt-2 overflow-x-auto" role="region" aria-label="Tableau des cookies et du stockage local" tabIndex={0}>
        <table className="w-full min-w-[34rem] border-collapse">
          <caption className="sr-only">Cookies et éléments de stockage local utilisés</caption>
          <thead className="bg-[#f0d8c8]">
            <tr>
              <th scope="col" className={CELL}>Nom</th>
              <th scope="col" className={CELL}>Rôle</th>
              <th scope="col" className={CELL}>Durée</th>
              <th scope="col" className={CELL}>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" className={CELL}>sb-…-auth-token</th>
              <td className={CELL}>Cookie de session : te garde connecté de façon sécurisée</td>
              <td className={CELL}>Jusqu’à ta déconnexion (au plus 400 jours)</td>
              <td className={CELL}>Strictement nécessaire</td>
            </tr>
            <tr>
              <th scope="row" className={CELL}>bilanAnnualData (stockage local)</th>
              <td className={CELL}>Garde en mémoire l’affichage du budget pour aller plus vite</td>
              <td className={CELL}>Effacé à ta déconnexion</td>
              <td className={CELL}>Strictement nécessaire (confort d’affichage)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Pourquoi pas de bandeau ?</h2>
      <p>
        Les traceurs strictement nécessaires au fonctionnement du service demandé sont exemptés de consentement. Nous
        n’en utilisons pas d’autres. Si cela change un jour, un choix clair et refusable aussi facilement qu’acceptable
        te sera proposé avant tout dépôt.
      </p>

      <h2>Polices et ressources externes</h2>
      <p>
        Les polices de caractères sont servies par {LEGAL.appName} lui-même : aucune requête n’est envoyée à un service
        tiers de polices ou de publicité lorsque tu navigues.
      </p>

      <h2>Les supprimer ou les bloquer</h2>
      <p>
        Te déconnecter efface le cookie de session et les données mises en cache. Tu peux aussi supprimer ou bloquer les
        cookies dans les réglages de ton navigateur, mais tu ne pourras alors plus rester connecté.
      </p>
      <p>
        Pour en savoir plus sur tes données : <Link href={LEGAL_ROUTES.privacy}>politique de confidentialité</Link>.
      </p>
    </LegalDocument>
  );
}
