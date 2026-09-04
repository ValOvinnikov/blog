import { SANITY_OPERATION_HEADER, SANITY_PROJECT_ID_HEADER } from './route';

const { isValidSignatureMock } = vi.hoisted(() => ({
  isValidSignatureMock: vi.fn(),
}));

const { revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

const {
  getTenantIdBySanityProjectIdMock,
  getTenantByIdMock,
  getTenantSanityCredentialsMock,
  removeBookmarksForPostMock,
} = vi.hoisted(() => ({
  getTenantIdBySanityProjectIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityCredentialsMock: vi.fn(),
  removeBookmarksForPostMock: vi.fn(),
}));

const { isDerivableRevalidateTypeMock, deriveRevalidatePathsMock } = vi.hoisted(
  () => ({
    isDerivableRevalidateTypeMock: vi.fn(),
    deriveRevalidatePathsMock: vi.fn(),
  }),
);

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

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantIdBySanityProjectId: getTenantIdBySanityProjectIdMock,
      getTenantById: getTenantByIdMock,
      getTenantSanityCredentials: getTenantSanityCredentialsMock,
    },
    bookmarks: {
      removeBookmarksForPost: removeBookmarksForPostMock,
    },
  },
}));

vi.mock('@web/server/revalidate/derive-revalidate-paths', () => ({
  BLOG_POST_TYPE: 'blog_post',
  isDerivableRevalidateType: isDerivableRevalidateTypeMock,
  deriveRevalidatePaths: deriveRevalidatePathsMock,
}));

const { loggerErrorMock, loggerWarnMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: loggerErrorMock,
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const makeRequest = (
  body: unknown,
  signature?: string,
  extraHeaders?: Record<string, string>,
): Request => {
  const headers = new Headers(extraHeaders);
  if (signature !== undefined) {
    headers.set('sanity-webhook-signature', signature);
  }
  return new Request('https://example.com/api/revalidate', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
};

describe('POST /api/revalidate', () => {
  beforeEach(() => {
    isValidSignatureMock.mockReset();
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    getTenantIdBySanityProjectIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-uuid-1' });
    getTenantSanityCredentialsMock.mockReset();
    removeBookmarksForPostMock.mockReset();
    isDerivableRevalidateTypeMock.mockReset();
    isDerivableRevalidateTypeMock.mockReturnValue(false);
    deriveRevalidatePathsMock.mockReset();
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
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
      bookmarksRemoved: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('post', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('posts', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('homePage', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
  });

  it('revalidates both the legacy tag and the tenant-scoped tag when sanity-project-id is present', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'blog_post', _id: 'post-1' },
      't=1,v=valid-signature',
      { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
    );
    await POST(request);

    expect(revalidateTagMock).toHaveBeenCalledWith('post', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('t:tenant-a-project:post', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('posts', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith('t:tenant-a-project:posts', {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith('homePage', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledWith(
      't:tenant-a-project:homePage',
      { expire: 0 },
    );
    expect(revalidateTagMock).toHaveBeenCalledTimes(6);
  });

  it('revalidates only the legacy tags when sanity-project-id is absent', async () => {
    isValidSignatureMock.mockResolvedValue(true);
    const { POST } = await import('./route');

    const request = makeRequest(
      { _type: 'blog_post', _id: 'post-1' },
      't=1,v=valid-signature',
    );
    await POST(request);

    expect(revalidateTagMock).toHaveBeenCalledWith('post', { expire: 0 });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidateTagMock).not.toHaveBeenCalledWith(
      expect.stringMatching(/^t:/),
      expect.anything(),
    );
  });

  describe('archived tenant', () => {
    it('ignores the event and revalidates nothing when the resolved tenant is archived', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      getTenantByIdMock.mockResolvedValue(undefined);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({ message: 'Tenant is archived; event ignored.' });
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it('still revalidates when no sanity-project-id is present at all', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(getTenantByIdMock).not.toHaveBeenCalled();
      expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    });
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
      bookmarksRemoved: 0,
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

  describe('bookmark cleanup on delete', () => {
    it('removes bookmarks for a deleted blog_post with a resolvable tenant', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      removeBookmarksForPostMock.mockResolvedValue(3);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project',
          [SANITY_OPERATION_HEADER]: 'delete',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(getTenantIdBySanityProjectIdMock).toHaveBeenCalledWith(
        'tenant-a-project',
      );
      expect(removeBookmarksForPostMock).toHaveBeenCalledWith(
        'tenant-uuid-1',
        'post-1',
      );
      expect(json.bookmarksRemoved).toBe(3);
      expect(response.status).toBe(200);
    });

    it('does not clean up bookmarks for an update to a blog_post', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project',
          [SANITY_OPERATION_HEADER]: 'update',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
    });

    it('does not clean up bookmarks for a create of a blog_post', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project',
          [SANITY_OPERATION_HEADER]: 'create',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
    });

    it('does not clean up bookmarks when a deleted document is not a blog_post', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'author', _id: 'author-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project',
          [SANITY_OPERATION_HEADER]: 'delete',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
    });

    it('skips cleanup when sanity-project-id is missing on a delete', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_OPERATION_HEADER]: 'delete' },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(getTenantIdBySanityProjectIdMock).not.toHaveBeenCalled();
      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
      expect(response.status).toBe(200);
    });

    it('skips cleanup when the tenant cannot be resolved from the project id', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue(undefined);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'unknown-project',
          [SANITY_OPERATION_HEADER]: 'delete',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(removeBookmarksForPostMock).not.toHaveBeenCalled();
      expect(json.bookmarksRemoved).toBe(0);
      expect(response.status).toBe(200);
    });

    it('still returns 200 with the revalidation result intact when cleanup throws', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      removeBookmarksForPostMock.mockRejectedValue(new Error('db unreachable'));
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        {
          [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project',
          [SANITY_OPERATION_HEADER]: 'delete',
        },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        revalidated: [
          'post',
          'posts',
          'homePage',
          't:tenant-a-project:post',
          't:tenant-a-project:posts',
          't:tenant-a-project:homePage',
        ],
        pathPurged: true,
        type: 'blog_post',
        id: 'post-1',
        bookmarksRemoved: 0,
      });
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'revalidate.bookmark_cleanup_failed',
        expect.objectContaining({ type: 'blog_post', id: 'post-1' }),
      );
    });
  });

  describe('resolved path purge', () => {
    it('purges each derived path instead of the whole site when derivation succeeds', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      isDerivableRevalidateTypeMock.mockReturnValue(true);
      getTenantSanityCredentialsMock.mockResolvedValue({
        projectId: 'tenant-a-project',
        dataset: 'production',
        token: 'read-token',
      });
      deriveRevalidatePathsMock.mockResolvedValue({
        ok: true,
        paths: ['/tenant-uuid-1/EN', '/tenant-uuid-1/EN/blog/my-post'],
      });
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      const response = await POST(request);
      const json = await response.json();

      expect(revalidatePathMock).toHaveBeenCalledWith('/tenant-uuid-1/EN');
      expect(revalidatePathMock).toHaveBeenCalledWith(
        '/tenant-uuid-1/EN/blog/my-post',
      );
      expect(revalidatePathMock).not.toHaveBeenCalledWith('/', 'layout');
      expect(loggerWarnMock).not.toHaveBeenCalled();
      expect(json.pathPurged).toBe(true);
    });

    it('falls back to the whole-site purge and logs when the tenant Sanity credentials cannot be resolved', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      isDerivableRevalidateTypeMock.mockReturnValue(true);
      getTenantSanityCredentialsMock.mockResolvedValue(undefined);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      await POST(request);

      expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'revalidate.tenant_sanity_credentials_missing',
        expect.objectContaining({ type: 'blog_post', id: 'post-1' }),
      );
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'revalidate.path_purge_fallback',
        expect.objectContaining({ reason: 'fetch_failed' }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    });

    it('still runs the whole-site fallback purge when getTenantSanityCredentials throws (e.g. a missing encryption key or a transient DB error)', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      isDerivableRevalidateTypeMock.mockReturnValue(true);
      getTenantSanityCredentialsMock.mockRejectedValue(
        new Error('TENANT_TOKEN_ENCRYPTION_KEY is not configured.'),
      );
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(deriveRevalidatePathsMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'revalidate.tenant_sanity_credentials_fetch_threw',
        expect.objectContaining({ type: 'blog_post', id: 'post-1' }),
      );
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'revalidate.path_purge_fallback',
        expect.objectContaining({ reason: 'fetch_failed' }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    });

    it('falls back to the whole-site purge and logs when the derivation itself cannot resolve the paths', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      isDerivableRevalidateTypeMock.mockReturnValue(true);
      getTenantSanityCredentialsMock.mockResolvedValue({
        projectId: 'tenant-a-project',
        dataset: 'production',
        token: 'read-token',
      });
      deriveRevalidatePathsMock.mockResolvedValue({
        ok: false,
        reason: 'document_not_found',
      });
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      await POST(request);

      expect(loggerWarnMock).toHaveBeenCalledWith(
        'revalidate.path_purge_fallback',
        expect.objectContaining({ reason: 'document_not_found' }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    });

    it('falls back to the whole-site purge and logs with reason tenant_unresolved when no tenant resolves', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_post', _id: 'post-1' },
        't=1,v=valid-signature',
      );
      await POST(request);

      expect(isDerivableRevalidateTypeMock).not.toHaveBeenCalled();
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'revalidate.path_purge_fallback',
        expect.objectContaining({ reason: 'tenant_unresolved' }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    });

    it('falls back to the whole-site purge and logs with reason unsupported_type for a type without a precise derivation', async () => {
      isValidSignatureMock.mockResolvedValue(true);
      getTenantIdBySanityProjectIdMock.mockResolvedValue('tenant-uuid-1');
      isDerivableRevalidateTypeMock.mockReturnValue(false);
      const { POST } = await import('./route');

      const request = makeRequest(
        { _type: 'blog_author', _id: 'author-1' },
        't=1,v=valid-signature',
        { [SANITY_PROJECT_ID_HEADER]: 'tenant-a-project' },
      );
      await POST(request);

      expect(getTenantSanityCredentialsMock).not.toHaveBeenCalled();
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'revalidate.path_purge_fallback',
        expect.objectContaining({ reason: 'unsupported_type' }),
      );
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    });
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
