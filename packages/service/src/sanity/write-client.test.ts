import type { TTenantSanityContext } from './client';

describe('Sanity write client module loading', () => {
  const originalProjectId = process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
  const originalWriteToken = process.env['SANITY_API_WRITE_TOKEN'];

  afterEach(() => {
    if (originalProjectId === undefined) {
      delete process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'];
    } else {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = originalProjectId;
    }
    if (originalWriteToken === undefined) {
      delete process.env['SANITY_API_WRITE_TOKEN'];
    } else {
      process.env['SANITY_API_WRITE_TOKEN'] = originalWriteToken;
    }
    vi.resetModules();
  });

  it('throws when SANITY_API_WRITE_TOKEN is not set', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    delete process.env['SANITY_API_WRITE_TOKEN'];
    vi.resetModules();

    const { getWriteClient } = await import('./write-client');

    expect(() => getWriteClient()).toThrow(/SANITY_API_WRITE_TOKEN/);
  });

  it('creates a client scoped with the write token and the CDN disabled', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getWriteClient } = await import('./write-client');
    getWriteClient();

    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ useCdn: false, token: 'write-secret' }),
    );

    vi.doUnmock('next-sanity');
  });

  it('memoizes the client across calls', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getWriteClient } = await import('./write-client');
    getWriteClient();
    getWriteClient();

    expect(createClientMock).toHaveBeenCalledTimes(1);

    vi.doUnmock('next-sanity');
  });

  it('creates a per-tenant write client scoped to the tenant project/dataset/token', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getWriteClient } = await import('./write-client');
    getWriteClient({
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

    vi.doUnmock('next-sanity');
  });

  it('reuses a cached write client for the same tenant instead of recreating it', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getWriteClient } = await import('./write-client');
    const tenant = {
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok-a',
    };
    const first = getWriteClient(tenant);
    const second = getWriteClient(tenant);

    expect(first).toBe(second);
    expect(createClientMock).toHaveBeenCalledTimes(1);

    vi.doUnmock('next-sanity');
  });

  it('does not share the legacy no-arg write client with a per-tenant write client', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const createClientMock = vi.fn().mockReturnValue({});
    vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

    const { getWriteClient } = await import('./write-client');
    getWriteClient();
    getWriteClient({
      projectId: 'tenant-a',
      dataset: 'production',
      token: 'tok-a',
    });

    expect(createClientMock).toHaveBeenCalledTimes(2);

    vi.doUnmock('next-sanity');
  });

  it.each([
    { projectId: '', dataset: 'production', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: '', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: 'production', token: '' },
    { projectId: '   ', dataset: 'production', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: '   ', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: 'production', token: '   ' },
    { projectId: undefined, dataset: 'production', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: undefined, token: 'tok-a' },
    { projectId: 'tenant-a', dataset: 'production', token: undefined },
    { projectId: null, dataset: 'production', token: 'tok-a' },
    { projectId: 'tenant-a', dataset: null, token: 'tok-a' },
    { projectId: 'tenant-a', dataset: 'production', token: null },
  ])(
    'throws InvalidTenantSanityContextError for a partial tenant context %j instead of falling back to the platform client',
    async (tenant) => {
      process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
      process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
      vi.resetModules();

      const createClientMock = vi.fn().mockReturnValue({});
      vi.doMock('next-sanity', () => ({ createClient: createClientMock }));

      const { getWriteClient } = await import('./write-client');
      const { InvalidTenantSanityContextError } =
        await import('./invalid-tenant-sanity-context-error');

      expect(() =>
        getWriteClient(tenant as unknown as TTenantSanityContext),
      ).toThrow(InvalidTenantSanityContextError);
      expect(createClientMock).not.toHaveBeenCalled();

      vi.doUnmock('next-sanity');
    },
  );
});
