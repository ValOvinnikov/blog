export const memoryUnstableCache = <TArgs extends string[], T>(
  read: (...args: TArgs) => Promise<T>,
): ((...args: TArgs) => Promise<T>) => {
  const store = new Map<string, T>();

  return async (...args) => {
    const key = JSON.stringify(args);
    if (store.has(key)) return store.get(key) as T;
    const value = await read(...args);
    store.set(key, value);
    return value;
  };
};
