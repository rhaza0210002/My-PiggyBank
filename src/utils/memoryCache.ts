interface Entry {
  expiresAt: number;
  value: Promise<unknown>;
}

const entries = new Map<string, Entry>();

/**
 * Garde en mémoire (le temps de la visite) le résultat d'une lecture : changer de page ne relance pas
 * les mêmes requêtes. Une lecture en échec n'est jamais gardée.
 */
export function cachedLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const existing = entries.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value as Promise<T>;

  const value = load().catch((error: unknown) => {
    entries.delete(key);
    throw error;
  });
  entries.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

const snapshots = new Map<string, unknown>();

/** Dernière valeur connue d'un écran : permet de l'afficher tout de suite pendant qu'on la relit. */
export function rememberSnapshot<T>(key: string, value: T): void {
  snapshots.set(key, value);
}

export function recallSnapshot<T>(key: string): T | null {
  return (snapshots.get(key) as T | undefined) ?? null;
}

/** Oublie les entrées dont la clé commence par `prefix` (toutes si omis). */
export function invalidateCache(prefix = ''): void {
  [...entries.keys()].filter((key) => key.startsWith(prefix)).forEach((key) => entries.delete(key));
  [...snapshots.keys()].filter((key) => key.startsWith(prefix)).forEach((key) => snapshots.delete(key));
}
