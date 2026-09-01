export {};

const {
  getPublishedPostBodyMock,
  saveSkimDraftMock,
  generateTakeawaysMock,
  getHostTenantSanityContextMock,
} = vi.hoisted(() => ({
  getPublishedPostBodyMock: vi.fn(),
  saveSkimDraftMock: vi.fn(),
  generateTakeawaysMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    editorial: {
      skim: {
        v1: {
          getPublishedPostBody: getPublishedPostBodyMock,
          saveSkimDraft: saveSkimDraftMock,
        },
      },
    },
  },
}));

vi.mock('@web/server/skim/generate-takeaways', () => ({
  generateTakeaways: generateTakeawaysMock,
  SKIM_GENERATION_MODEL: 'claude-haiku-4-5',
}));

vi.mock('@web/server/tenant/get-host-tenant-sanity-context', () => ({
  getHostTenantSanityContext: getHostTenantSanityContextMock,
}));

vi.mock('@web/utils/env/env', () => ({
  env: {
    SANITY_GENERATE_SECRET: 'test-secret',
    ANTHROPIC_API_KEY: 'test-api-key',
  },
}));

const makeRequest = (body: unknown, secret = 'test-secret'): Request => {
  const url = new URL('https://example.com/api/generate-skim');
  if (secret !== undefined) url.searchParams.set('secret', secret);
  return new Request(url, {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

describe('POST /api/generate-skim', () => {
  beforeEach(() => {
    getPublishedPostBodyMock.mockReset();
    saveSkimDraftMock.mockReset();
    generateTakeawaysMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns 401 when the secret is missing', async () => {
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }, ''));

    expect(response.status).toBe(401);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the secret does not match', async () => {
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }, 'wrong-secret'));

    expect(response.status).toBe(401);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed request body', async () => {
    const { POST } = await import('./route');

    const request = new Request(
      'https://example.com/api/generate-skim?secret=test-secret',
      { method: 'POST', body: 'not json' },
    );
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is valid JSON but missing _id', async () => {
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ foo: 'bar' }));

    expect(response.status).toBe(400);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 500 when reading the published post body fails', async () => {
    getPublishedPostBodyMock.mockResolvedValue({
      ok: false,
      error: new Error('not found'),
    });
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(500);
    expect(generateTakeawaysMock).not.toHaveBeenCalled();
  });

  it('returns 422 and leaves the draft untouched when Claude returns a malformed response', async () => {
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockRejectedValue(new Error('bad response'));
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(422);
    expect(saveSkimDraftMock).not.toHaveBeenCalled();
  });

  it('returns 503 when the write path is unconfigured (SANITY_API_WRITE_TOKEN absent)', async () => {
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
    saveSkimDraftMock.mockResolvedValue({
      ok: false,
      error: new Error('getWriteClient: SANITY_API_WRITE_TOKEN is not set'),
    });
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(503);
  });

  it('returns 500 when saving the draft fails for another reason', async () => {
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
    saveSkimDraftMock.mockResolvedValue({
      ok: false,
      error: new Error('network error'),
    });
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(500);
  });

  it('reads the post body, generates takeaways, and patches the draft on success', async () => {
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
    saveSkimDraftMock.mockResolvedValue({ ok: true, data: undefined });
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ ok: true, count: 3 });
    expect(getPublishedPostBodyMock).toHaveBeenCalledWith('post-1', undefined);
    expect(saveSkimDraftMock).toHaveBeenCalledWith({
      postId: 'post-1',
      takeaways: ['a', 'b', 'c'],
      model: 'claude-haiku-4-5',
    });
  });

  it('re-running with the same post is idempotent (always patches the draft, never appends)', async () => {
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
    saveSkimDraftMock.mockResolvedValue({ ok: true, data: undefined });
    const { POST } = await import('./route');

    await POST(makeRequest({ _id: 'post-1' }));
    await POST(makeRequest({ _id: 'post-1' }));

    expect(saveSkimDraftMock).toHaveBeenCalledTimes(2);
    expect(saveSkimDraftMock).toHaveBeenNthCalledWith(1, {
      postId: 'post-1',
      takeaways: ['a', 'b', 'c'],
      model: 'claude-haiku-4-5',
    });
    expect(saveSkimDraftMock).toHaveBeenNthCalledWith(2, {
      postId: 'post-1',
      takeaways: ['a', 'b', 'c'],
      model: 'claude-haiku-4-5',
    });
  });

  it('forwards the resolved tenant Sanity context to getPublishedPostBody', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant,
    });
    getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
    generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
    saveSkimDraftMock.mockResolvedValue({ ok: true, data: undefined });
    const { POST } = await import('./route');

    await POST(makeRequest({ _id: 'post-1' }));

    expect(getPublishedPostBodyMock).toHaveBeenCalledWith('post-1', tenant);
  });

  it('returns 404 without reading the post when the requesting host is unresolvable', async () => {
    getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(404);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  // `vi.doMock` overrides the module registry's mock factory for
  // `@web/utils/env/env` for every subsequent dynamic `import('./route')` in
  // this file (`vi.resetModules()` clears cached instances, not the
  // registered factory) — these two config-missing cases stay last, same as
  // `/api/revalidate`'s own equivalent case.
  it('returns 503 when ANTHROPIC_API_KEY is not configured', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { SANITY_GENERATE_SECRET: 'test-secret' },
    }));
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(503);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 503 when SANITY_GENERATE_SECRET is not configured', async () => {
    vi.doMock('@web/utils/env/env', () => ({
      env: { ANTHROPIC_API_KEY: 'test-api-key' },
    }));
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(503);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });
});
