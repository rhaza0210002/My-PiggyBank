import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Feedback } from '@/utils/testFeedback';

/** Fichier local de la séance de test (dossier ignoré par git) : une ligne JSON par retour. */
export const FEEDBACK_FILE = path.join(process.cwd(), '.superpowers', 'retours', 'retours.jsonl');

export async function appendFeedback(feedback: Feedback): Promise<void> {
  await mkdir(path.dirname(FEEDBACK_FILE), { recursive: true });
  await appendFile(FEEDBACK_FILE, `${JSON.stringify({ at: new Date().toISOString(), ...feedback })}\n`, 'utf8');
}
