import '@testing-library/jest-dom/vitest'

// Mock window.crypto.getRandomValues for JSDOM in test environment
if (typeof window !== 'undefined' && !window.crypto) {
  Object.defineProperty(window, 'crypto', {
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
} else if (typeof window !== 'undefined' && window.crypto && !window.crypto.getRandomValues) {
  window.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (!array) return array;
    const view = new Uint32Array(array.buffer, array.byteOffset, array.byteLength / 4);
    for (let i = 0; i < view.length; i++) {
      view[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  };
}
