import type { Metadata } from 'next';
import LegalDocument, { Placeholder } from '@/components/legal/LegalDocument';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES } from '@/constants/routes';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Mentions légales' };

const isFilled = (value: string) => !value.startsWith('[');

function Value({ value }: { value: string }) {
  return isFilled(value) ? <>{value}</> : <Placeholder>{value}</Placeholder>;
}

export default function MentionsLegalesPage() {
  return (
    <LegalDocument title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        {LEGAL.appName} est édité par <Value value={LEGAL.publisherName} />, domicilié à{' '}
        <Value value={LEGAL.publisherAddress} />.
      </p>
      <p>
        Directeur de la publication : <Value value={LEGAL.publicationDirector} />.
      </p>
      <p>
        Contact : <Value value={LEGAL.contactEmailLabel} />.
      </p>

      <h2>Hébergement</h2>
      <ul>
        <li>
          Base de données et authentification : Supabase, sur l’infrastructure AWS, région Europe (Francfort,
          Allemagne).
        </li>
        <li>
          Application web : Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
            vercel.com<span className="sr-only"> (nouvelle fenêtre)</span>
          </a>
          ).
        </li>
      </ul>

      <h2>Nature du projet</h2>
      <p>
        {LEGAL.appName} est un <strong>projet pédagogique de démonstration</strong>, sans exploitation commerciale ni
        publicité. Il est proposé gratuitement, sans engagement de disponibilité.
      </p>

      <h2>Nature du service</h2>
      <p>
        {LEGAL.appName} est un outil de suivi budgétaire personnel. Ce n’est ni un établissement bancaire, ni un
        service de conseil en investissement : les informations affichées sont calculées à partir des données que tu
        saisis ou importes, à titre indicatif.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L’interface, les textes et le code de {LEGAL.appName} sont protégés. Tes données restent ta propriété : tu
        peux les exporter et les supprimer à tout moment depuis la page « Mes données ».
      </p>

      <h2>Responsabilité</h2>
      <p>
        Nous faisons au mieux pour que le service soit disponible et exact, sans garantie d’absence d’interruption ou
        d’erreur. Vérifie toujours tes chiffres importants auprès de ta banque.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de tes données est décrit dans la{' '}
        <Link href={LEGAL_ROUTES.privacy}>politique de confidentialité</Link> et la{' '}
        <Link href={LEGAL_ROUTES.cookies}>page cookies</Link>.
      </p>

      <h2>Droit applicable</h2>
      <p>Le présent site est soumis au droit français.</p>
    </LegalDocument>
  );
}
