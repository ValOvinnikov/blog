import {
  MOCK_ENV_PROJECT_ID,
  MOCK_PLATFORM_PROJECT_ID,
  MOCK_PREVIOUS_TOKEN,
  MOCK_ROTATED_TOKEN,
  MOCK_TENANT_DATASET,
  MOCK_TENANT_PROJECT_ID,
  MOCK_TENANT_TOKEN,
} from '@blog/service/testing/tenant';

const PLATFORM_READ_TOKEN = 'platform-read-token';
const NEXT_SANITY_MODULE = 'next-sanity';

describe('Sanity client module loading', () => {
  const originalProjectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  const originalReadToken = process.env['SANITY_API_READ_TOKEN'];

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = originalProjectId;
    }
    if (originalReadToken === undefined) {
      delete process.env['SANITY_API_READ_TOKEN'];
    } else {
      process.env['SANITY_API_READ_TOKEN'] = originalReadToken;
    }
    vi.resetModules();
  });

  it('rejects a call site that omits tenant context at compile time', async () => {
    const { getClient } = await import('./client');

    expect(() =>
      // @ts-expect-error -- `getClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getClient(),
    ).toThrow();
  });

  it('builds the platform tenant context from env vars', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = MOCK_PLATFORM_PROJECT_ID;
    process.env['SANITY_API_READ_TOKEN'] = PLATFORM_READ_TOKEN;
    vi.resetModules();

    const { getPlatformSanityContext } = await import('./client');

    expect(getPlatformSanityContext()).toMatchObject({
      projectId: MOCK_PLATFORM_PROJECT_ID,
      token: PLATFORM_READ_TOKEN,
    });
  });

  describe('without a project id', () => {
    beforeEach(() => {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
      vi.resetModules();
    });

    it('creates no Sanity client on importing query helpers without a project id', async () => {
      await expect(
        import('@blog/service/sanity/query/query'),
      ).resolves.toHaveProperty('runQuery');
    });

    it('creates no Sanity client on importing image helpers without a project id', async () => {
      await expect(
        import('@blog/service/sanity/image/image'),
      ).resolves.toHaveProperty('urlForImage');
    });
  });

  describe('with a mocked next-sanity', () => {
    let createClientMock: ReturnType<
      typeof vi.fn<(config: Record<string, unknown>) => object>
    >;
    let getClient: (typeof import('./client'))['getClient'];

    beforeEach(async () => {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = MOCK_ENV_PROJECT_ID;
      vi.resetModules();
      createClientMock = vi.fn(() => ({}));
      vi.doMock(NEXT_SANITY_MODULE, () => ({ createClient: createClientMock }));

      ({ getClient } = await import('./client'));
    });

    afterEach(() => {
      vi.doUnmock(NEXT_SANITY_MODULE);
    });

    it('creates a per-tenant client with the Sanity CDN disabled', () => {
      getClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      });

      const [config] = createClientMock.mock.lastCall ?? [];
      const { projectId, dataset, token, useCdn } = config ?? {};

      expect(projectId).toBe(MOCK_TENANT_PROJECT_ID);
      expect(dataset).toBe(MOCK_TENANT_DATASET);
      expect(token).toBe(MOCK_TENANT_TOKEN);
      expect(useCdn).toBe(false);
    });

    it('reuses a cached client for the same tenant instead of recreating it', () => {
      const tenant = {
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_TENANT_TOKEN,
      };
      const first = getClient(tenant);
      const second = getClient(tenant);

      expect(first).toBe(second);
      expect(createClientMock).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the cached client when the token changes for the same project/dataset', () => {
      const first = getClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_PREVIOUS_TOKEN,
      });
      const second = getClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_ROTATED_TOKEN,
      });

      expect(createClientMock).toHaveBeenCalledTimes(2);
      const [rebuiltConfig] = createClientMock.mock.calls[1] ?? [];
      const { token: rebuiltToken } = rebuiltConfig ?? {};

      expect(rebuiltToken).toBe(MOCK_ROTATED_TOKEN);
      expect(second).not.toBe(first);

      const third = getClient({
        projectId: MOCK_TENANT_PROJECT_ID,
        dataset: MOCK_TENANT_DATASET,
        token: MOCK_ROTATED_TOKEN,
      });
      expect(createClientMock).toHaveBeenCalledTimes(2);
      expect(third).toBe(second);
    });

    it('evicts the least-recently-used tenant once the cache exceeds its cap', () => {
      const MAX_CACHED_TENANT_CLIENTS = 20;

      for (let i = 0; i < MAX_CACHED_TENANT_CLIENTS; i++) {
        getClient({
          projectId: `tenant-${i}`,
          dataset: MOCK_TENANT_DATASET,
          token: `tok-${i}`,
        });
      }

      getClient({
        projectId: 'tenant-0',
        dataset: MOCK_TENANT_DATASET,
        token: 'tok-0',
      });
      expect(createClientMock).toHaveBeenCalledTimes(MAX_CACHED_TENANT_CLIENTS);

      getClient({
        projectId: 'tenant-overflow',
        dataset: MOCK_TENANT_DATASET,
        token: 'tok-overflow',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 1,
      );

      getClient({
        projectId: 'tenant-0',
        dataset: MOCK_TENANT_DATASET,
        token: 'tok-0',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 1,
      );

      getClient({
        projectId: 'tenant-1',
        dataset: MOCK_TENANT_DATASET,
        token: 'tok-1',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 2,
      );
    });
  });
});
