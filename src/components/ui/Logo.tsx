import Image from 'next/image';

interface LogoProps {
  className?: string;
  /** À précharger quand le logo est visible dès l'arrivée sur la page (en-tête, connexion). */
  eager?: boolean;
}

/** Le logo officiel de My PiggyBank (cochon, pièce et bandeau du nom), fond transparent. */
export default function Logo({ className = 'h-12 w-auto', eager = false }: LogoProps) {
  return (
    <Image
      src="/brand/logo-my-piggybank.png"
      alt="My PiggyBank"
      width={758}
      height={618}
      loading={eager ? 'eager' : 'lazy'}
      className={className}
    />
  );
}
