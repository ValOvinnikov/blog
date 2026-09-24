import type { ValidationContext } from 'sanity';

export type TMockCountContext = {
  context: ValidationContext;
  fetchCalls: { query: string; params: unknown }[];
  withConfigCalls: unknown[];
};

/**
 * Mocks `context.getClient(...).withConfig(...).fetch(...)` — the shape
 * `getDraftsClient` builds — resolving to a fixed count, for validators
 * that check a reference count via that helper. Pass an `Error` instead of
 * a count to simulate a rejected fetch.
 */
export const createMockCountContext = (
  count: number | Error,
): TMockCountContext => {
  const fetchCalls: { query: string; params: unknown }[] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          if (count instanceof Error) throw count;
          return count;
        },
      };
    },
  });

  const context = { getClient } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};
