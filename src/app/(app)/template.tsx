import type { ReactNode } from 'react';

/** Recréé à chaque changement de page : le contenu entre en douceur au lieu d'apparaître d'un coup. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="rise h-full min-h-0">{children}</div>;
}
