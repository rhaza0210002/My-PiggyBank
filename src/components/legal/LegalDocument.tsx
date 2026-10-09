import type { ReactNode } from 'react';
import { LEGAL } from '@/constants/legal';

interface LegalDocumentProps {
  title: string;
  intro?: string;
  children: ReactNode;
}

/** Mise en page commune des documents légaux : titres, paragraphes et listes lisibles, sans dépendance. */
export default function LegalDocument({ title, intro, children }: LegalDocumentProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 [&_a]:font-semibold [&_a]:text-accent-fort [&_a]:underline [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-texte [&_h3]:mt-4 [&_h3]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_p]:mt-2 [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:space-y-1">
      <h1 className="text-3xl font-black tracking-[-0.04em] text-texte">{title}</h1>
      <p className="mt-1 text-sm text-texte-doux">Dernière mise à jour : {LEGAL.lastUpdate}</p>
      {intro && <p className="mt-4 text-texte">{intro}</p>}
      <div className="mt-2 text-texte">{children}</div>
    </article>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-attention-fond px-1 text-attention">{children}</mark>;
}
