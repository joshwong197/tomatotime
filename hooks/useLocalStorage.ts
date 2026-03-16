import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Silently fail on storage errors
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export function useLocalStorageString(key: string, initialValue: string | null = null): [string | null, (value: string | null) => void] {
  const [storedValue, setStoredValue] = useState<string | null>(() => {
    return localStorage.getItem(key) ?? initialValue;
  });

  useEffect(() => {
    if (storedValue === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, storedValue);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
