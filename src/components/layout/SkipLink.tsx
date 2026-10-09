/** Premier élément focalisable de la page : permet de passer le menu au clavier ou au lecteur d'écran. */
export default function SkipLink() {
  return (
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:border-2 focus:border-focus focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-texte"
    >
      Aller au contenu principal
    </a>
  );
}
