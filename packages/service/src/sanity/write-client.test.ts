export {};

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
});
