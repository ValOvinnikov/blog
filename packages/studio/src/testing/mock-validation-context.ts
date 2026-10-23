import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import type { ValidationContext } from 'sanity';

type TMockGroqValidationContextOptions = {
  fetchError?: Error;
} & Record<string, unknown>;

export const mockGroqValidationContext = <
  TContext extends ValidationContext = ValidationContext,
>(
  dataset: unknown[],
  { fetchError, ...context }: TMockGroqValidationContextOptions = {},
) =>
  ({
    ...context,
    getClient: () => ({
      withConfig: () => ({ fetch: mockGroqFetch(dataset, fetchError) }),
    }),
  }) as unknown as TContext;

export type TMockFetchContext = {
  context: ValidationContext;
  fetchCalls: { query: string; params: unknown }[];
  withConfigCalls: unknown[];
};

/** Resolves every fetch to `result`, or rejects with it when it is an `Error`. */
export const mockFetchContext = (
  result: unknown,
  document?: Record<string, unknown>,
): TMockFetchContext => {
  const fetchCalls: TMockFetchContext['fetchCalls'] = [];
  const withConfigCalls: unknown[] = [];

  const getClient = () => ({
    withConfig: (config: unknown) => {
      withConfigCalls.push(config);

      return {
        fetch: async (query: string, params: unknown) => {
          fetchCalls.push({ query, params });
          if (result instanceof Error) throw result;
          return result;
        },
      };
    },
  });

  const context = { getClient, document } as unknown as ValidationContext;

  return { context, fetchCalls, withConfigCalls };
};

export const MOCK_VALIDATION_MESSAGE = 'Fill it in.';

export const MOCK_TAXONOMY_REFERENCE_FIELD = 'taxonomyTerm';
