/**
 * Storage abstraction to decouple the app from direct Web Storage access.
 * Allows swapping in filesystem-backed implementations for Electron.
 */

export interface StorageArea {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface StorageProvider {
  readonly local: StorageArea;
  readonly session: StorageArea;
}

class InMemoryStorageArea implements StorageArea {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class BrowserStorageArea implements StorageArea {
  constructor(private readonly storage: Storage | undefined) {}

  private resolveStorage(): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }
    return this.storage ?? null;
  }

  getItem(key: string): string | null {
    const storage = this.resolveStorage();
    if (!storage) {
      return null;
    }
    try {
      return storage.getItem(key);
    } catch (error) {
      console.warn("Storage getItem failed", { key, error });
      return null;
    }
  }

  setItem(key: string, value: string): void {
    const storage = this.resolveStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.warn("Storage setItem failed", { key, error });
    }
  }

  removeItem(key: string): void {
    const storage = this.resolveStorage();
    if (!storage) {
      return;
    }
    try {
      storage.removeItem(key);
    } catch (error) {
      console.warn("Storage removeItem failed", { key, error });
    }
  }

  clear(): void {
    const storage = this.resolveStorage();
    if (!storage) {
      return;
    }
    try {
      storage.clear();
    } catch (error) {
      console.warn("Storage clear failed", { error });
    }
  }
}

const defaultProvider: StorageProvider = {
  local: typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    ? new BrowserStorageArea(window.localStorage)
    : new InMemoryStorageArea(),
  session: typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
    ? new BrowserStorageArea(window.sessionStorage)
    : new InMemoryStorageArea()
};

let currentProvider: StorageProvider = defaultProvider;

export const storage = {
  get local(): StorageArea {
    return currentProvider.local;
  },
  get session(): StorageArea {
    return currentProvider.session;
  }
};

export function setStorageProvider(provider: StorageProvider): void {
  currentProvider = provider;
}

export function resetStorageProvider(): void {
  currentProvider = defaultProvider;
}

export function storageAreaToWebStorage(area: StorageArea): Storage {
  return {
    getItem: area.getItem.bind(area),
    setItem: area.setItem.bind(area),
    removeItem: area.removeItem.bind(area),
    clear: area.clear.bind(area),
    key: (_: number) => null,
    get length() {
      return 0;
    }
  } as unknown as Storage;
}
