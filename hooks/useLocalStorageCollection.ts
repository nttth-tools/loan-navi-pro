"use client";

import { useState, useEffect, useCallback } from "react";

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function useLocalStorageCollection<T extends { id: string }>(
  key: string,
  defaults: T[] = [],
) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = load<T>(key);
    setItems(stored.length > 0 ? stored : defaults);
    setLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback((next: T[]) => {
    setItems(next);
    save(key, next);
  }, [key]);

  const add = useCallback((data: Omit<T, "id">) => {
    const item = { ...data, id: genId() } as T;
    setItems(prev => {
      const next = [...prev, item];
      save(key, next);
      return next;
    });
    return item;
  }, [key]);

  const update = useCallback((id: string, data: Partial<Omit<T, "id">>) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, ...data } : i);
      save(key, next);
      return next;
    });
  }, [key]);

  const remove = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      save(key, next);
      return next;
    });
  }, [key]);

  const set = useCallback((id: string, data: Omit<T, "id">) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === id);
      const next = exists
        ? prev.map(i => i.id === id ? { ...data, id } as T : i)
        : [...prev, { ...data, id } as T];
      save(key, next);
      return next;
    });
  }, [key]);

  return { items, loaded, add, update, remove, set, persist };
}
