// Mock browser globals for bun tests
const storage = new Map<string, string>();

globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  get length() { return storage.size; },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
} as Storage;

// Mock window so typeof window !== "undefined" checks pass
// @ts-expect-error minimal window mock
globalThis.window = globalThis;
