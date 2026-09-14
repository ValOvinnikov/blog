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

  it('does not create a Sanity client while importing query helpers without a project id', async () => {
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    vi.resetModules();

    await expect(import('./query')).resolves.toHaveProperty('runQuery');
  });

  it('does not create a Sanity client while importing image helpers without a project id', async () => {
    delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    vi.resetModules();

    await expect(import('./image')).resolves.toHaveProperty('urlForImage');
  });

  it('rejects a call site that omits tenant context at compile time', async () => {
    const { getClient } = await import('./client');

    expect(() =>
      // @ts-expect-error -- `getClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getClient(),
    ).toThrow();
  });

  it('creates a per-tenant client with the Sanity CDN disabled', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getClient } = await import('./client');
    getClient({ projectId: 'tenant-a', dataset: 'production', token: 'tok-a' });

    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'tenant-a',
        dataset: 'production',
        token: 'tok-a',
        // Next's tagged data cache is the sole caching layer — a CDN read
        // after a tag purge can re-cache stale content.
        useCdn: false,
      }),
    );

    vi.doUnmock('next-sanity');
  });

  it('reuses a cached client for the same tenant instead of recreating it', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getClient } = await import('./client');
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok-a',
    };
    const first = getClient(tenant);
    const second = getClient(tenant);

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);

    vi.doUnmock('next-sanity');
  });

  it('rebuilds the cached client when the token changes for the same project/dataset', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    vi.resetModules();

    const createClientMock = vi.fn().mockImplementation(() => ({}));
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getClient } = await import('./client');
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

    vi.doUnmock('next-sanity');
  });

  it('evicts the least-recently-used tenant once the cache exceeds its cap', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    vi.resetModules();

    const createClientMock = vi.fn().mockImplementation(() => ({}));
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getClient } = await import('./client');
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

    vi.doUnmock('next-sanity');
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

  it('getPlatformClient reuses the same cache as getClient — never a client per call', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'platform-project';
    process.env['SANITY_API_READ_TOKEN'] = 'platform-read-token';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getPlatformClient } = await import('./client');
    const first = getPlatformClient();
    const second = getPlatformClient();

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);

    vi.doUnmock('next-sanity');
  });
});
