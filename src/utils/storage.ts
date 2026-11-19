const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      return memoryStore.get(key) ?? null;
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      memoryStore.set(key, value);
      return;
    }
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      memoryStore.delete(key);
      return;
    }
    memoryStore.delete(key);
  },
  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      memoryStore.clear();
      return;
    }
    memoryStore.clear();
  },
  keys: (): string[] => {
    const keys = new Set<string>(memoryStore.keys());
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k) keys.add(k);
        }
      }
    } catch {
      return Array.from(keys);
    }
    return Array.from(keys);
  },
  entriesWithPrefix: (prefix: string): Record<string, string> => {
    const result: Record<string, string> = {};
    safeStorage.keys().forEach((k) => {
      if (k.startsWith(prefix)) {
        const val = safeStorage.getItem(k);
        if (val !== null) result[k] = val;
      }
    });
    return result;
  },
  removeWithPrefix: (prefix: string, keep: string[] = []): number => {
    const keepSet = new Set(keep);
    let removed = 0;
    safeStorage.keys().forEach((k) => {
      if (k.startsWith(prefix) && !keepSet.has(k)) {
        safeStorage.removeItem(k);
        removed += 1;
      }
    });
    return removed;
  },
};
