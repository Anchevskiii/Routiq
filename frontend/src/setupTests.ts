import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock globalThis.crypto.getRandomValues for JSDOM in test environment
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        if (!array) return array;
        const view = new Uint32Array(array.buffer, array.byteOffset, array.byteLength / 4);
        for (let i = 0; i < view.length; i++) {
          view[i] = Math.floor(Math.random() * 0xffffffff);
        }
        return array;
      },
    },
  });
} else if (typeof globalThis !== 'undefined' && globalThis.crypto && !globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (!array) return array;
    const view = new Uint32Array(array.buffer, array.byteOffset, array.byteLength / 4);
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  };
}

// Ensure a safe localStorage is available (some test stubs may replace it)
if (typeof globalThis !== 'undefined') {
  const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage
  if (!ls || typeof ls.clear !== 'function') {
    const store = new Map<string, string>()
    const mockStorage = {
      getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      key: (index: number) => Array.from(store.keys())[index] || null,
      get length() { return store.size },
    }
    Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, configurable: true })
  }
}
