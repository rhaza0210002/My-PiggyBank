/** Chemin interne sûr pour une redirection ; tout ce qui peut sortir du site (//hote, http://…, \) est refusé. */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  return value;
}
