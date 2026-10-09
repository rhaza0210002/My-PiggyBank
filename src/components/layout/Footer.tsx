import Link from 'next/link';
import { LEGAL } from '@/constants/legal';
import { LEGAL_ROUTES, ROUTES } from '@/constants/routes';
import { hasContactEmail } from '@/constants/legal';
import Pig from '@/components/ui/Pig';

const LINK =
  'inline-flex min-h-8 items-center rounded px-1 text-texte underline-offset-2 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus';

const LINK_COMPACT = LINK.replace('min-h-8', 'min-h-6 md:min-h-8');

const LEGAL_LINKS = [
  { href: LEGAL_ROUTES.legalNotice, label: 'Mentions légales' },
  { href: LEGAL_ROUTES.terms, label: 'Conditions d’utilisation' },
  { href: LEGAL_ROUTES.privacy, label: 'Politique de confidentialité' },
  { href: LEGAL_ROUTES.cookies, label: 'Cookies' },
  { href: LEGAL_ROUTES.accessibility, label: 'Accessibilité' },
] as const;

interface FooterProps {
  /** `compact` : une ligne, pour l'application qui occupe tout l'écran ; `full` : pages publiques et légales. */
  variant?: 'compact' | 'full';
}

export default function Footer({ variant = 'full' }: FooterProps) {
  if (variant === 'compact') {
    return (
      // Sur mobile, la barre d'onglets est juste en dessous dans la colonne : le pied de page la touche, sans marge à deviner.
      <footer className="shrink-0 border-t border-bordure bg-surface px-3 py-1 text-xs text-texte md:px-4 md:text-xs">
        {/* Mobile : une seule ligne, les liens se déplient à la demande (moins de bruit pendant une tâche). */}
        <details className="group mx-auto max-w-6xl text-center md:hidden">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-center gap-1 rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
            © {LEGAL.year} {LEGAL.appName} · Infos légales
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
          </summary>
          <nav aria-label="Informations légales" className="flex flex-wrap items-center justify-center gap-x-3 pb-1">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={LINK_COMPACT}>
                {link.label}
              </Link>
            ))}
            <Link href={ROUTES.myData} className={LINK_COMPACT}>Mes données</Link>
          </nav>
        </details>

        <nav aria-label="Informations légales" className="mx-auto hidden max-w-6xl flex-wrap items-center justify-center gap-x-3 md:flex">
          <span>© {LEGAL.year} {LEGAL.appName}</span>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={LINK_COMPACT}>
              {link.label}
            </Link>
          ))}
          <Link href={ROUTES.myData} className={LINK_COMPACT}>Mes données</Link>
        </nav>
      </footer>
    );
  }

  return (
    <footer className="border-t-2 border-bordure bg-surface text-sm text-texte">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <Pig className="size-8" /> {LEGAL.appName}
          </p>
          <p className="mt-2 text-texte-doux">
            Un outil de suivi de trésorerie personnelle, pensé pour rester simple. Tes données sont hébergées
            dans l’Union européenne et ne sont jamais vendues.
          </p>
        </div>

        <nav aria-label="Informations légales">
          <h2 className="font-bold text-accent-fort">Informations légales</h2>
          <ul className="mt-2 space-y-1">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Tes droits et contact">
          <h2 className="font-bold text-accent-fort">Tes droits</h2>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href={ROUTES.myData} className={LINK}>Mes données : exporter, supprimer mon compte</Link>
            </li>
            {hasContactEmail && (
              <li>
                <a href={`mailto:${LEGAL.contactEmail}`} className={LINK}>Nous contacter</a>
              </li>
            )}
            <li>
              <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className={LINK}>
                Saisir la CNIL<span className="sr-only"> (nouvelle fenêtre)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <p className="border-t border-bordure px-4 py-3 text-center text-xs text-texte-doux">
        © {LEGAL.year} {LEGAL.appName} · Documents mis à jour le {LEGAL.lastUpdate}
      </p>
    </footer>
  );
}
