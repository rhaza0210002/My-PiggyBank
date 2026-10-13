import { NextResponse, type NextRequest } from 'next/server';
import { appendFeedback } from '@/services/testFeedbackLog';
import { MAX_FEEDBACK_BYTES, createRateLimiter, sanitizeFeedback } from '@/utils/testFeedback';

/** 20 retours par minute et par appareil : assez pour signaler, trop peu pour remplir le disque. */
const allow = createRateLimiter(20, 60_000);

/**
 * Retours de la séance de test (erreurs du navigateur, signalements). N'existe que pendant une séance
 * (`TEST_SESSION=on`, posé par le script) ; le reste du temps, la route répond 404.
 */
export async function POST(request: NextRequest) {
  if (process.env.TEST_SESSION !== 'on') return new NextResponse(null, { status: 404 });

  // Seule l'app elle-même peut écrire ici (pas un autre site ouvert dans le navigateur).
  const origin = request.headers.get('origin');
  if (!origin || new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ error: 'Origine refusée.' }, { status: 403 });
  }

  const device = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (!allow(device, Date.now())) {
    return NextResponse.json({ error: 'Trop de retours, réessaie dans une minute.' }, { status: 429 });
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_FEEDBACK_BYTES) return NextResponse.json({ error: 'Retour trop long.' }, { status: 413 });
  const text = await request.text();
  if (text.length > MAX_FEEDBACK_BYTES) return NextResponse.json({ error: 'Retour trop long.' }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Retour illisible.' }, { status: 400 });
  }
  const feedback = sanitizeFeedback(body);
  if (!feedback) return NextResponse.json({ error: 'Retour incomplet.' }, { status: 400 });

  await appendFeedback(feedback);
  return NextResponse.json({ ok: true });
}
