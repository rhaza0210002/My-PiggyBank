import type { Metadata } from 'next';
import LegalDocument from '@/components/legal/LegalDocument';
import { LEGAL } from '@/constants/legal';

export const metadata: Metadata = { title: 'Accessibilité' };

export default function AccessibilitePage() {
  return (
    <LegalDocument
      title="Déclaration d’accessibilité"
      intro={`${LEGAL.appName} s’engage à être utilisable par le plus grand nombre, y compris par les personnes en situation de handicap et les personnes neuroatypiques.`}
    >
      <h2>État de conformité</h2>
      <p>
        Le site est en cours d’amélioration continue. Aucun audit complet selon le référentiel RGAA n’a encore été
        réalisé : l’état de conformité n’est donc pas évalué officiellement.
      </p>

      <h2>Ce qui est en place</h2>
      <ul>
        <li>Lien d’évitement « Aller au contenu principal » et structure de page claire (titres, repères).</li>
        <li>Navigation entièrement utilisable au clavier, avec un contour de focus bien visible.</li>
        <li>Contrastes de texte et d’éléments d’interface de niveau AA (WCAG 2.2).</li>
        <li>Zones cliquables d’au moins 44 pixels, menu de navigation avec libellés toujours visibles.</li>
        <li>État des éléments dit en toutes lettres, jamais par la seule couleur.</li>
        <li>Formulaires avec libellés, aide et erreurs annoncées aux lecteurs d’écran.</li>
        <li>Respect du réglage « réduire les animations » du système.</li>
        <li>Une seule action mise en avant par écran et des étapes courtes, pour limiter la charge mentale.</li>
        <li>Graphiques circulaires doublés d’un tableau de chiffres.</li>
        <li>
          Un bouton d’accessibilité (♿) propose, sur tout le site : police Luciole, zoom du texte jusqu’à 150 %, contraste
          renforcé, moins d’animations et lettres plus espacées. Les réglages restent sur l’appareil et le bouton peut être
          retiré, puis remis depuis Compte → Paramètres.
        </li>
        <li>Chaque page a son propre titre, et le contenu reste lisible à 320 pixels de large, y compris avec le zoom.</li>
        <li>
          Police Luciole, dessinée avec des personnes malvoyantes (Laurent Bourcellier et Jonathan Perez, licence
          Creative Commons Attribution 4.0).
        </li>
      </ul>

      <h2>Comment cela a été vérifié</h2>
      <p>
        Tests automatisés (axe-core, WCAG 2.0 à 2.2 niveaux A et AA) sur les pages de l’application, en affichage
        mobile et ordinateur, sans anomalie détectée. Ces tests ne couvrent qu’une partie des critères.
      </p>

      <h2>Limites connues</h2>
      <ul>
        <li>Pas encore de test systématique avec des lecteurs d’écran.</li>
        <li>Sur petit écran, certaines pages défilent à l’intérieur d’un bloc plutôt que dans la page.</li>
        <li>Les émojis décoratifs sont masqués aux lecteurs d’écran, mais leur rendu dépend de l’appareil.</li>
      </ul>

      <h2>Un problème d’accessibilité ?</h2>
      <p>
        Écris-nous
        {LEGAL.contactEmail ? <> à <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a></> : <> (adresse de contact à renseigner)</>}{' '}
        en décrivant la page et la difficulté rencontrée : nous cherchons à répondre rapidement et à corriger.
      </p>

      <h2>Voies de recours</h2>
      <p>
        Si tu n’obtiens pas de réponse satisfaisante, tu peux saisir le Défenseur des droits :{' '}
        <a href="https://formulaire.defenseurdesdroits.fr" target="_blank" rel="noopener noreferrer">
          formulaire.defenseurdesdroits.fr<span className="sr-only"> (nouvelle fenêtre)</span>
        </a>
        .
      </p>
    </LegalDocument>
  );
}
