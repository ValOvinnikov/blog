import {
  fetchDraftsFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

describe('getDraftsClient', () => {
  it('requests the 2024-01-01 API version and the drafts perspective', () => {
    const getClientCalls: unknown[] = [];
    const withConfigCalls: unknown[] = [];
    const fakeClient = { fetch: async () => undefined };

    const getClient = (apiVersionOptions: unknown) => {
      getClientCalls.push(apiVersionOptions);

      return {
        withConfig: (config: unknown) => {
          withConfigCalls.push(config);
          return fakeClient;
        },
      };
    };

    const context = { getClient } as unknown as ValidationContext;

    const client = getDraftsClient(context);

    expect(getClientCalls).toEqual([{ apiVersion: '2024-01-01' }]);
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
    expect(client).toBe(fakeClient);
  });
});

describe('fetchDraftsFailSafe', () => {
  const createContext = (
    fetchImpl: (query: string, params?: unknown) => unknown,
  ) => {
    const getClient = () => ({
      withConfig: () => ({
        fetch: async (query: string, params?: unknown) =>
          fetchImpl(query, params),
      }),
    });

    return { getClient } as unknown as ValidationContext;
  };

  it('resolves to the fetched value when the fetch succeeds', async () => {
    const context = createContext(() => 3);

    await expect(fetchDraftsFailSafe(context, 'count(*)', {}, 0)).resolves.toBe(
      3,
    );
  });

  it('resolves to the fallback when the fetch rejects', async () => {
    const context = createContext(() => {
      throw new Error('network down');
    });

    await expect(fetchDraftsFailSafe(context, 'count(*)', {}, 0)).resolves.toBe(
      0,
    );
  });

  it('passes the query and params through to fetch', async () => {
    let receivedQuery = '';
    let receivedParams: unknown;
    const context = createContext((query, params) => {
      receivedQuery = query;
      receivedParams = params;
      return 1;
    });

    await fetchDraftsFailSafe(context, 'count(*[_id == $id])', { id: 'a' }, 0);

    expect(receivedQuery).toBe('count(*[_id == $id])');
    expect(receivedParams).toEqual({ id: 'a' });
  });
});
