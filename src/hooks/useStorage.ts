"use client";

import { useState, useEffect } from "react";

export default function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // 1. Synchronisation après le montage client (évite les erreurs d'hydratation)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Erreur de lecture localStorage pour "${key}":`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [key]);

  // 2. Fonction de mise à jour de la valeur
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Erreur d'écriture localStorage pour "${key}":`, error);
    }
  };

  return [storedValue, setValue, isHydrated] as const;
}
