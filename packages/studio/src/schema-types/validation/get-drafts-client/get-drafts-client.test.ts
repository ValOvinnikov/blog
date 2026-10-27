import {
  fetchDraftsFailSafe,
  getDraftsClient,
} from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { mockFetchContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import type { ValidationContext } from 'sanity';

faker.seed(6029);

const DRAFTS_CLIENT_API_VERSION = '2024-01-01';

const MOCK_QUERY = 'count(*[_id == $id])';
const MOCK_PARAMS = { id: faker.string.uuid() };
const MOCK_FETCHED_VALUE = faker.number.int({ min: 1, max: 100 });
const MOCK_FALLBACK = faker.number.int({ min: 101, max: 200 });

describe(getDraftsClient, () => {
  it('requests a drafts-perspective client at the pinned API version', () => {
    const getClientCalls: unknown[] = [];
    const withConfigCalls: unknown[] = [];
    const draftsClient = { fetch: async () => undefined };
    const context = {
      getClient: (options: unknown) => {
        getClientCalls.push(options);

        return {
          withConfig: (config: unknown) => {
            withConfigCalls.push(config);
            return draftsClient;
          },
        };
      },
    } as unknown as ValidationContext;

    const client = getDraftsClient(context);

    expect(getClientCalls).toEqual([{ apiVersion: DRAFTS_CLIENT_API_VERSION }]);
    expect(withConfigCalls).toEqual([{ perspective: 'drafts' }]);
    expect(client).toBe(draftsClient);
  });
});

describe(fetchDraftsFailSafe, () => {
  it('resolves to the fetched value when the fetch succeeds', async () => {
    const { context } = mockFetchContext(MOCK_FETCHED_VALUE);

    const result = await fetchDraftsFailSafe(
      context,
      MOCK_QUERY,
      MOCK_PARAMS,
      MOCK_FALLBACK,
    );

    expect(result).toBe(MOCK_FETCHED_VALUE);
  });

  it('resolves to the fallback when the fetch rejects', async () => {
    const { context } = mockFetchContext(new Error(faker.lorem.sentence()));

    const result = await fetchDraftsFailSafe(
      context,
      MOCK_QUERY,
      MOCK_PARAMS,
      MOCK_FALLBACK,
    );

    expect(result).toBe(MOCK_FALLBACK);
  });

  it('sends the query and params to the drafts client', async () => {
    const { context, fetchCalls } = mockFetchContext(MOCK_FETCHED_VALUE);

    await fetchDraftsFailSafe(context, MOCK_QUERY, MOCK_PARAMS, MOCK_FALLBACK);

    expect(fetchCalls).toEqual([{ query: MOCK_QUERY, params: MOCK_PARAMS }]);
  });
});
