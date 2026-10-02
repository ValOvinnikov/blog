type TReact = typeof import('react');

// Outside a React Server render `cache()` memoizes nothing, so a test of
// request-scoped state stands in one that memoizes per argument list.
export const withMemoizingReactCache = async (
  importOriginal: () => Promise<TReact>,
): Promise<TReact> => {
  const actual = await importOriginal();

  return {
    ...actual,
    cache: (<TArgs extends unknown[], TResult>(
      fn: (...args: TArgs) => TResult,
    ) => {
      const results = new Map<string, TResult>();
      return (...args: TArgs): TResult => {
        const key = JSON.stringify(args);
        if (!results.has(key)) results.set(key, fn(...args));
        return results.get(key) as TResult;
      };
    }) as TReact['cache'],
  };
};
