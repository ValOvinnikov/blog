export {};

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@web/utils/env/env', () => ({
  env: { SITE_CONFIG_REVALIDATE_SECRET: 'test-secret' },
}));

function makeRequest(authorization?: string): Request {
  const headers = new Headers();
  if (authorization !== undefined) {
    headers.set('authorization', authorization);
  }
  return new Request('https://example.com/api/revalidate-site-config', {
    method: 'POST',
    headers,
  });
}

describe('POST /api/revalidate-site-config', () => {
  beforeEach(() => {
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('revalidates the site-config tag and purges the root layout for a valid bearer secret', async () => {
    const { POST } = await import('./route');

    const request = makeRequest('Bearer test-secret');
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ revalidated: ['site-config'], pathPurged: true });
    expect(revalidateTagMock).toHaveBeenCalledWith('site-config', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
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
