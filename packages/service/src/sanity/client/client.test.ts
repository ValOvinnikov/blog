export {};

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
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'platform-project';
    process.env['SANITY_API_READ_TOKEN'] = 'platform-read-token';
    vi.resetModules();

    const { getPlatformSanityContext } = await import('./client');

    expect(getPlatformSanityContext()).toMatchObject({
      projectId: 'platform-project',
      token: 'platform-read-token',
    });
  });

  describe('without a project id', () => {
    beforeEach(() => {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
      vi.resetModules();
    });

    it('does not create a Sanity client while importing query helpers without a project id', async () => {
      await expect(
        import('@blog/service/sanity/query/query'),
      ).resolves.toHaveProperty('runQuery');
    });

    it('does not create a Sanity client while importing image helpers without a project id', async () => {
      await expect(
        import('@blog/service/sanity/image/image'),
      ).resolves.toHaveProperty('urlForImage');
    });
  });

  describe('with a mocked next-sanity', () => {
    let createClientMock: ReturnType<typeof vi.fn<() => object>>;
    let getClient: (typeof import('./client'))['getClient'];

    beforeEach(async () => {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
      vi.resetModules();
      createClientMock = vi.fn(() => ({}));
      vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

      ({ getClient } = await import('./client'));
    });

    afterEach(() => {
      vi.doUnmock('next-sanity');
    });

    it('creates a per-tenant client with the Sanity CDN disabled', () => {
      getClient({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-a',
      });

      expect(createClientMock).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'tenant-a',
          dataset: 'production',
          token: 'tok-a',
          useCdn: false,
        }),
      );
    });

    it('reuses a cached client for the same tenant instead of recreating it', () => {
      const tenant = {
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-a',
      };
      const first = getClient(tenant);
      const second = getClient(tenant);

      expect(first).toBe(second);
      expect(createClientMock).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the cached client when the token changes for the same project/dataset', () => {
      const first = getClient({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-old',
      });
      const second = getClient({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-new',
      });

      expect(createClientMock).toHaveBeenCalledTimes(2);
      expect(createClientMock).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ token: 'tok-new' }),
      );
      expect(second).not.toBe(first);

      const third = getClient({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-new',
      });
      expect(createClientMock).toHaveBeenCalledTimes(2);
      expect(third).toBe(second);
    });

    it('evicts the least-recently-used tenant once the cache exceeds its cap', () => {
      const MAX_CACHED_TENANT_CLIENTS = 20;

      for (let i = 0; i < MAX_CACHED_TENANT_CLIENTS; i++) {
        getClient({
          projectId: `tenant-${i}`,
          dataset: 'production',
          token: `tok-${i}`,
        });
      }

      getClient({
        projectId: 'tenant-0',
        dataset: 'production',
        token: 'tok-0',
      });
      expect(createClientMock).toHaveBeenCalledTimes(MAX_CACHED_TENANT_CLIENTS);

      getClient({
        projectId: 'tenant-overflow',
        dataset: 'production',
        token: 'tok-overflow',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 1,
      );

      getClient({
        projectId: 'tenant-0',
        dataset: 'production',
        token: 'tok-0',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 1,
      );

      getClient({
        projectId: 'tenant-1',
        dataset: 'production',
        token: 'tok-1',
      });
      expect(createClientMock).toHaveBeenCalledTimes(
        MAX_CACHED_TENANT_CLIENTS + 2,
      );
    });
  });
});
