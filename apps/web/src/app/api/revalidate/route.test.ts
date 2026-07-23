export {};

const { isValidSignatureMock } = vi.hoisted(() => ({
  isValidSignatureMock: vi.fn(),
}));

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock('@sanity/webhook', () => ({
  isValidSignature: isValidSignatureMock,
  SIGNATURE_HEADER_NAME: 'sanity-webhook-signature',
}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@web/utils/env/env', () => ({
  env: { SANITY_REVALIDATE_SECRET: 'test-secret' },
}));

function makeRequest(body: unknown, signature?: string): Request {
  const headers = new Headers();
  if (signature !== undefined) {
    headers.set('sanity-webhook-signature', signature);
  }
  return new Request('https://example.com/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    isValidSignatureMock.mockReset();
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('revalidates post, posts, and homePage tags for a valid blog_post webhook', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'blog_post', _id: 'post-1' },
      't=1,v=valid-signature',
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      revalidated: ['post', 'posts', 'homePage'],
      pathPurged: true,
      type: 'blog_post',
      id: 'post-1',
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('post', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('posts', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('homePage', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
  });

  it('returns 401 and revalidates nothing for an invalid signature', async () => {
    isValidSignatureMock.mockResolvedValue(false);
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'blog_post', _id: 'post-1' },
      't=1,v=invalid-signature',
    );
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 401 and revalidates nothing when the signature header is missing', async () => {
    isValidSignatureMock.mockResolvedValue(false);
    const { POST } = await import('./route');

    const request = makeRequest({ _type: 'blog_post', _id: 'post-1' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(isValidSignatureMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 200 with no tags revalidated for an unknown _type', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'something_unknown', _id: 'doc-1' },
      't=1,v=valid-signature',
    );
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      revalidated: [],
      pathPurged: false,
      type: 'something_unknown',
      id: 'doc-1',
    });
    expect(revalidateTagMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a malformed request body', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = new Request('https://example.com/api/revalidate', {
      method: 'POST',
      headers: { 'sanity-webhook-signature': 't=1,v=valid-signature' },
      body: 'not json',
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is valid JSON but missing required fields', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = makeRequest({ foo: 'bar' }, 't=1,v=valid-signature');
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 500 when SANITY_REVALIDATE_SECRET is not configured', async () => {
    vi.doMock('@web/utils/env/env', () => ({ env: {} }));
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'blog_post', _id: 'post-1' },
      't=1,v=valid-signature',
    );
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(isValidSignatureMock).not.toHaveBeenCalled();
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
