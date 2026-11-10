import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import type { Path, ValidationContext } from 'sanity';

type TMockValidationContextFields = {
  document?: unknown;
  parent?: unknown;
  path?: Path;
  type?: unknown;
  getClient?: (options: { apiVersion: string }) => unknown;
};

export const mockValidationContext = <
  TContext extends ValidationContext = ValidationContext,
>(
  fields: TMockValidationContextFields = {},
) => fields as unknown as TContext;

type TMockGroqValidationContextOptions = {
  fetchError?: Error;
} & Omit<TMockValidationContextFields, 'getClient'>;

export const mockGroqValidationContext = <
  TContext extends ValidationContext = ValidationContext,
>(
  dataset: unknown[],
  { fetchError, ...fields }: TMockGroqValidationContextOptions = {},
) =>
  mockValidationContext<TContext>({
    ...fields,
    getClient: () => ({
      withConfig: () => ({ fetch: mockGroqFetch(dataset, fetchError) }),
    }),
  });

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

  const context = mockValidationContext({ getClient, document });

  return { context, fetchCalls, withConfigCalls };
};

export const MOCK_VALIDATION_MESSAGE = 'Fill it in.';

export const MOCK_TAXONOMY_REFERENCE_FIELD = 'taxonomyTerm';
