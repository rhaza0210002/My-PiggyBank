import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

/** Journal de l'atelier, hors du dépôt (.superpowers est ignoré par git) : Claude le lit en direct. */
const JOURNAL_DIR = join(process.cwd(), '.superpowers', 'atelier');

/** Atelier de l'identité graphique : n'existe qu'en développement, jamais en production. */
export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 });

  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  await mkdir(JOURNAL_DIR, { recursive: true });
  await appendFile(join(JOURNAL_DIR, 'evenements.jsonl'), `${JSON.stringify({ at: new Date().toISOString(), ...(event as object) })}\n`);
  return new Response(null, { status: 204 });
}
