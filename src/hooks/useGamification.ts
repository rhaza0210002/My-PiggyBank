"use client";

import { useCallback, useEffect, useState } from 'react';
import { getReconciliationActivity } from '@/services/transactionService';
import { computeGamification, type Gamification } from '@/utils/gamification';

interface UseGamification {
  data: Gamification | null;
  error: string | null;
  /** Relit la progression (à appeler après un pointage). */
  refresh: () => void;
}

export function useGamification(): UseGamification {
  const [data, setData] = useState<Gamification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    getReconciliationActivity()
      .then((rows) => {
        if (!isCurrent) return;
        setData(computeGamification(rows, new Date()));
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return;
        setError(loadError instanceof Error ? loadError.message : 'Impossible de charger ta progression.');
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshCount]);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  return { data, error, refresh };
}
