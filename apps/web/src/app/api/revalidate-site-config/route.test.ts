export {};

const { revalidateTagMock, revalidatePathMock, listTenantsMock } = vi.hoisted(
  () => ({
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    listTenantsMock: vi.fn(),
  }),
);

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
  },
}));

vi.mock('@web/utils/env/env', () => ({
  env: { SITE_CONFIG_REVALIDATE_SECRET: 'test-secret' },
}));

const makeRequest = (
  authorization?: string,
  body?: Record<string, unknown>,
): Request => {
  const headers = new Headers();
  if (authorization !== undefined) {
    headers.set('authorization', authorization);
  }
  return new Request('https://example.com/api/revalidate-site-config', {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
};

const makeRequestWithRawBody = (
  authorization: string,
  rawBody: string,
): Request => {
  const headers = new Headers();
  headers.set('authorization', authorization);
  return new Request('https://example.com/api/revalidate-site-config', {
    method: 'POST',
    headers,
    body: rawBody,
  });
};

describe('POST /api/revalidate-site-config', () => {
  beforeEach(() => {
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    listTenantsMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('revalidates only the given tenant’s scoped tags when a tenantId is provided', async () => {
    const { POST } = await import('./route');

    const request = makeRequest('Bearer test-secret', {
      tenantId: 'tenant-1',
    });
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-1', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(
      'settings-features:tenant-1',
      { expire: 0 },
    );
    expect(revalidateTagMock).toHaveBeenCalledWith('tenant-plan:tenant-1', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(listTenantsMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(json).toEqual({
      revalidated: [
        'site-config:tenant-1',
        'settings-features:tenant-1',
        'tenant-plan:tenant-1',
      ],
      pathPurged: true,
    });
  });

  it('revalidates every known tenant’s scoped tags when no tenantId is provided (backward-compatible fallback)', async () => {
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }, { id: 'tenant-2' }]);
    const { POST } = await import('./route');

    const request = makeRequest('Bearer test-secret');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-1', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-2', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(6);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(json.revalidated).toHaveLength(6);
  });

  it('revalidates every known tenant’s scoped tags when tenantId is an empty string', async () => {
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }]);
    const { POST } = await import('./route');

    const request = makeRequest('Bearer test-secret', { tenantId: '' });
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-1', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
  });

  it('revalidates every known tenant’s scoped tags when the request body is malformed JSON', async () => {
    listTenantsMock.mockResolvedValue([{ id: 'tenant-1' }]);
    const { POST } = await import('./route');

    const request = makeRequestWithRawBody('Bearer test-secret', '{not json');
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-1', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
  });

  it('returns 401 and revalidates nothing for an invalid secret', async () => {
    const { POST } = await import('./route');

    const request = makeRequest('Bearer wrong-secret');
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('returns 401 and revalidates nothing when the authorization header is missing', async () => {
    const { POST } = await import('./route');

    const request = makeRequest();
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the authorization header is not a bearer token', async () => {
    const { POST } = await import('./route');

    const request = makeRequest('test-secret');
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  // `vi.doMock` overrides the module registry's mock factory for
  // `@web/utils/env/env` for every subsequent dynamic `import('./route')` in
  // this file (`vi.resetModules()` clears cached instances, not the
  // registered factory) — this config-missing case stays last, same as
  // `/api/revalidate`'s own equivalent case.
  it('returns 500 when SITE_CONFIG_REVALIDATE_SECRET is not configured', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    const { POST } = await import('./route');

    const request = makeRequest('Bearer test-secret');
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
