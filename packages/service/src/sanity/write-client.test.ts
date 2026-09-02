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

  it('rejects a call site that omits tenant context at compile time', async () => {
    const { getWriteClient } = await import('./write-client');

    expect(() =>
      // @ts-expect-error -- `getWriteClient` takes a required `TTenantSanityContext`; there is no no-arg form that silently falls back to the platform's project.
      getWriteClient(),
    ).toThrow();
  });

  it('creates a per-tenant write client scoped to the tenant project/dataset/token', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
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

  it('builds the platform write tenant context from env vars', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'platform-project';
    process.env['SANITY_API_WRITE_TOKEN'] = 'write-secret';
    vi.resetModules();

    const { getPlatformSanityWriteContext } = await import('./write-client');

    expect(getPlatformSanityWriteContext()).toMatchObject({
      projectId: 'platform-project',
      token: 'write-secret',
    });
  });

  it('throws when SANITY_API_WRITE_TOKEN is not set', async () => {
    process.env['NEXT_PUBLIC_SANITY_PROJECT_ID'] = 'test-project';
    delete process.env['SANITY_API_WRITE_TOKEN'];
    vi.resetModules();

    const { getPlatformSanityWriteContext } = await import('./write-client');

    expect(() => getPlatformSanityWriteContext()).toThrow(
      /SANITY_API_WRITE_TOKEN/,
    );
  });
});
