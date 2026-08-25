import { getDraftsClient } from '@cms/schema-types/helpers/get-drafts-client';
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
