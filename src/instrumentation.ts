import type { Instrumentation } from 'next';

/** Pendant une séance de test, chaque erreur du serveur est aussi notée dans le fichier des retours. */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.TEST_SESSION !== 'on' || process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { appendFeedback } = await import('@/services/testFeedbackLog');
    const digest = typeof error === 'object' && error !== null && 'digest' in error ? ` (digest ${String(error.digest)})` : '';
    await appendFeedback({
      kind: 'erreur-serveur',
      message: `${error instanceof Error ? error.message : String(error)}${digest}`.slice(0, 2000),
      page: request.path.split('?')[0].slice(0, 200),
      stack: `${context.routeType} ${context.routePath}`,
    });
  } catch {
    // Le journal de test ne doit jamais faire tomber l'app.
  }
};
