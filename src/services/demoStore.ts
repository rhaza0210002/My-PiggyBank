import type { StoredTransaction } from '@/services/transactionService';

/**
 * Mode exemple : des opérations fictives gardées dans le navigateur seulement (jamais envoyées à Supabase).
 * Tant qu'il est actif, transactionService lit et écrit ici au lieu de la base.
 */
export const DEMO_STORAGE_KEY = 'piggy-exemple';
/** Émis à chaque changement pour que le bandeau se mette à jour. */
export const DEMO_EVENT = 'piggy-exemple';

const VERSION = 1;

interface StoredShape {
  version: number;
  transactions: StoredTransaction[];
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isRow(value: unknown): value is StoredTransaction {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.booked_on === 'string' && typeof row.amount === 'number';
}

/** Contenu valide du stock, ou null (absent, illisible, autre version). */
function read(): StoredShape | null {
  try {
    const raw = storage()?.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    const { version, transactions } = data as Partial<StoredShape>;
    if (version !== VERSION || !Array.isArray(transactions) || !transactions.every(isRow)) return null;
    return { version, transactions };
  } catch {
    return null;
  }
}

/** Les identifiants de l'exemple ne désignent jamais de vraies lignes. */
export const isDemoId = (id: string): boolean => id.startsWith('demo-');

function notify(): void {
  try {
    window.dispatchEvent(new Event(DEMO_EVENT));
  } catch {
    // Pas de fenêtre (tests, rendu serveur) : personne à prévenir.
  }
}

function write(transactions: StoredTransaction[]): boolean {
  try {
    const target = storage();
    if (!target) return false;
    target.setItem(DEMO_STORAGE_KEY, JSON.stringify({ version: VERSION, transactions } satisfies StoredShape));
    notify();
    return true;
  } catch {
    return false;
  }
}

export const isDemoActive = (): boolean => read() !== null;

export const readDemoTransactions = (): StoredTransaction[] => read()?.transactions ?? [];

/** Renvoie false quand le stockage est refusé (navigation privée stricte) : l'exemple n'est alors pas disponible. */
export const startDemo = (transactions: StoredTransaction[]): boolean => write(transactions);

/** Renvoie false quand l'exemple n'existe plus (autre onglet) ou que l'écriture est refusée : rien n'a été modifié. */
export function updateDemoTransactions(mutator: (rows: StoredTransaction[]) => StoredTransaction[]): boolean {
  const current = read();
  return current ? write(mutator(current.transactions)) : false;
}

export function endDemo(): void {
  try {
    storage()?.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // Stockage indisponible : rien à effacer.
  }
  notify();
}
