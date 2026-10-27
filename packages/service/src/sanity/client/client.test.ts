import {
  MOCK_PLATFORM_PROJECT_ID,
  MOCK_PREVIOUS_TOKEN,
  MOCK_ROTATED_TOKEN,
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
  MOCK_TENANT_TOKEN,
  mockTenant,
} from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getClient, getPlatformSanityContext } from './client';

faker.seed(6016);

const MOCK_PLATFORM_READ_TOKEN = faker.string.alphanumeric(32);
const NEXT_SANITY_MODULE = 'next-sanity';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe(getPlatformSanityContext, () => {
  it('builds the platform tenant context from env vars', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', MOCK_PLATFORM_PROJECT_ID);
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', MOCK_TENANT_DATASET);
    vi.stubEnv('SANITY_API_READ_TOKEN', MOCK_PLATFORM_READ_TOKEN);
    vi.resetModules();

    const { getPlatformSanityContext: freshGetPlatformSanityContext } =
      await import('./client');

    expect(freshGetPlatformSanityContext()).toEqual({
      projectId: MOCK_PLATFORM_PROJECT_ID,
      dataset: MOCK_TENANT_DATASET,
      token: MOCK_PLATFORM_READ_TOKEN,
    });
  });
});

describe(getClient, () => {
  it('rejects a call site that omits tenant context at compile time', () => {
    expect(() =>
      // @ts-expect-error -- `getClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getClient(),
    ).toThrow();
  });

  it.each([
    { path: '@blog/service/sanity/query/query', exportName: 'runQuery' },
    { path: '@blog/service/sanity/image/image', exportName: 'urlForImage' },
  ])('lets $path import without a project id', async ({ path, exportName }) => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', undefined);
    vi.resetModules();

    await expect(import(path)).resolves.toHaveProperty(exportName);
  });

  describe('with a faked next-sanity', () => {
    let createClientMock: ReturnType<
      typeof vi.fn<(config: Record<string, unknown>) => object>
    >;
    let freshGetClient: typeof getClient;

    beforeEach(async () => {
      vi.resetModules();
      createClientMock = vi.fn(() => ({}));
      vi.doMock(NEXT_SANITY_MODULE, () => ({ createClient: createClientMock }));

      ({ getClient: freshGetClient } = await import('./client'));
    });

    afterEach(() => {
      vi.doUnmock(NEXT_SANITY_MODULE);
    });

    it('creates a per-tenant client with the Sanity CDN disabled', () => {
      freshGetClient(mockTenant());

      const [config] = createClientMock.mock.lastCall ?? [];
      const { projectId, dataset, token, useCdn } = config ?? {};

      expect(projectId).toBe(MOCK_TENANT_PROJECT_ID);
      expect(dataset).toBe(MOCK_TENANT_DATASET);
      expect(token).toBe(MOCK_TENANT_TOKEN);
      expect(useCdn).toBe(false);
    });

    it('reuses the cached client for a repeated tenant', () => {
      const first = freshGetClient(mockTenant());
      const second = freshGetClient(mockTenant());

      expect(second).toBe(first);
      expect(createClientMock).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the cached client once the tenant token rotates', () => {
      const previous = freshGetClient(
        mockTenant({ token: MOCK_PREVIOUS_TOKEN }),
      );
      const rotated = freshGetClient(mockTenant({ token: MOCK_ROTATED_TOKEN }));
      const reused = freshGetClient(mockTenant({ token: MOCK_ROTATED_TOKEN }));

      const [rebuiltConfig] = createClientMock.mock.lastCall ?? [];
      const { token: rebuiltToken } = rebuiltConfig ?? {};

      expect(rotated).not.toBe(previous);
      expect(reused).toBe(rotated);
      expect(rebuiltToken).toBe(MOCK_ROTATED_TOKEN);
      expect(createClientMock).toHaveBeenCalledTimes(2);
    });
  });
});
