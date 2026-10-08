import type { Metadata } from 'next';
import Link from 'next/link';
import LegalDocument from '@/components/legal/LegalDocument';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';

export const metadata: Metadata = { title: 'Conditions d’utilisation' };

export default function ConditionsPage() {
  return (
    <LegalDocument title="Conditions d’utilisation">
      <h2>1. Objet</h2>
      <p>
        Ces conditions encadrent l’utilisation de {LEGAL.appName}, un outil gratuit de suivi de trésorerie personnelle
        (budget, import de relevés, rapprochement, progression), proposé dans le cadre d’un projet pédagogique de
        démonstration.
      </p>

      <h2>2. Ton compte</h2>
      <ul>
        <li>Tu crées un compte avec une adresse e-mail et un mot de passe que tu gardes confidentiels.</li>
        <li>Tu es responsable de l’usage fait de ton compte et des informations que tu y saisis.</li>
        <li>Une personne = un compte, pour un usage personnel et non commercial.</li>
      </ul>

      <h2>3. Ce que fait (et ne fait pas) le service</h2>
      <p>
        {LEGAL.appName} t’aide à organiser tes chiffres. Ce n’est ni un service bancaire, ni un conseil financier,
        fiscal ou juridique. Les montants, écarts, points et niveaux affichés sont indicatifs, calculés à partir de ce
        que tu saisis ou importes.
      </p>

      <h2>4. Tes fichiers et tes données</h2>
      <p>
        Tu importes uniquement des relevés dont tu es titulaire. Tes données t’appartiennent ; nous les traitons comme
        décrit dans la <Link href={LEGAL_ROUTES.privacy}>politique de confidentialité</Link>. Tu peux les exporter ou
        supprimer ton compte à tout moment depuis <Link href={ROUTES.myData}>Mes données</Link>.
      </p>

      <h2>5. Usages interdits</h2>
      <ul>
        <li>Tenter d’accéder aux données d’un autre compte ou de contourner la sécurité.</li>
        <li>Perturber le service (attaques, surcharge volontaire).</li>
        <li>Importer des contenus illicites.</li>
      </ul>

      <h2>6. Disponibilité et responsabilité</h2>
      <p>
        Le service est fourni « en l’état », sans garantie de disponibilité continue. Nous faisons au mieux pour
        protéger tes données, mais nous ne pouvons être tenus responsables des pertes indirectes. Pense à exporter tes
        données si elles sont importantes pour toi.
      </p>

      <h2>7. Fin d’utilisation</h2>
      <p>
        Tu peux supprimer ton compte à tout moment. L’éditeur peut suspendre un compte en cas d’usage contraire à ces
        conditions.
      </p>

      <h2>8. Évolution et droit applicable</h2>
      <p>
        Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page. Elles sont soumises au droit
        français.
      </p>
    </LegalDocument>
  );
}
