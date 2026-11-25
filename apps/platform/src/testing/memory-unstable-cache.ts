const store = new Map<string, unknown>();

export const clearMemoryUnstableCache = () => {
  store.clear();
};

export const memoryUnstableCache =
  <TArgs extends string[], T>(
    read: (...args: TArgs) => Promise<T>,
    keyParts: string[],
  ): ((...args: TArgs) => Promise<T>) =>
  async (...args) => {
    const key = JSON.stringify([keyParts, args]);
    if (store.has(key)) return store.get(key) as T;
    const value = await read(...args);
    store.set(key, value);
    return value;
  };
