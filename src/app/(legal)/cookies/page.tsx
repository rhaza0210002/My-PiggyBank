import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument from '@/components/legal/LegalDocument';
import ClearDeviceStorageButton from '@/components/legal/ClearDeviceStorageButton';
import { DEVICE_STORAGE } from '@/constants/deviceStorage';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Cookies et stockage local' };

const CELL = 'border-[1.5px] border-bordure px-2 py-1.5 align-top text-left text-sm';

export default function CookiesPage() {
  return (
    <LegalDocument
      title="Cookies et stockage local"
      intro="Bonne nouvelle : My PiggyBank n’utilise que l’essentiel. Aucun cookie publicitaire, aucune mesure d’audience, aucun outil de suivi : il n’y a donc pas de bandeau à accepter."
    >
      <h2>Ce qui peut être enregistré sur ton appareil</h2>
      <div className="mt-2 overflow-x-auto" role="region" aria-label="Tableau des cookies et du stockage local" tabIndex={0}>
        <table className="w-full min-w-[40rem] border-collapse">
          <caption className="sr-only">Cookies et éléments de stockage local utilisés</caption>
          <thead className="bg-surface-douce">
            <tr>
              <th scope="col" className={CELL}>Nom</th>
              <th scope="col" className={CELL}>Où</th>
              <th scope="col" className={CELL}>Rôle</th>
              <th scope="col" className={CELL}>Durée</th>
              <th scope="col" className={CELL}>Type</th>
            </tr>
          </thead>
          <tbody>
            {DEVICE_STORAGE.map((entry) => (
              <tr key={entry.name}>
                <th scope="row" className={`${CELL} whitespace-nowrap`}>{entry.name}</th>
                <td className={CELL}>{entry.kind}</td>
                <td className={CELL}>{entry.role}</td>
                <td className={CELL}>{entry.duration}</td>
                <td className={CELL}>{entry.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Seul le cookie de session est posé dès la connexion. Les éléments de stockage local n’apparaissent que si tu
        utilises la fonction concernée, ne quittent jamais ton navigateur et ne sont lus par personne d’autre que toi.
      </p>

      <h2>Pourquoi pas de bandeau ?</h2>
      <p>
        Les traceurs strictement nécessaires au service, ou qui gardent un réglage que tu as toi-même demandé, sont
        exemptés de consentement. Nous n’en utilisons pas d’autres. Si cela change un jour, un choix clair et refusable
        aussi facilement qu’acceptable te sera proposé avant tout dépôt.
      </p>

      <h2>Aucune collecte en arrière-plan</h2>
      <p>
        {LEGAL.appName} ne charge aucun service tiers : ni mesure d’audience, ni publicité, ni réseau social, ni police
        de caractères hébergée ailleurs. En naviguant, ton navigateur ne parle qu’à {LEGAL.appName} et à son hébergeur
        de données, qui conserve ton compte et ton budget.
      </p>

      <h2>Les supprimer ou les bloquer</h2>
      <p>
        Te déconnecter efface le cookie de session, les données mises en cache et le mode exemple. Tes réglages
        d’accessibilité et la forme de tes relevés restent sur l’appareil pour t’éviter de tout refaire : tu peux les
        effacer ici.
      </p>
      <ClearDeviceStorageButton />
      <p>
        Tu peux aussi supprimer ou bloquer les cookies dans les réglages de ton navigateur, mais tu ne pourras alors plus
        rester connecté.
      </p>
      <p>
        Pour en savoir plus sur tes données : <Link href={LEGAL_ROUTES.privacy}>politique de confidentialité</Link>.
      </p>
    </LegalDocument>
  );
}
