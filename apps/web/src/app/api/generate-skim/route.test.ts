import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { logger } from '@web/utils/logger/logger';

const {
  getPublishedPostBodyMock,
  saveSkimDraftMock,
  generateTakeawaysMock,
  getHostTenantSanityContextMock,
  getHostTenantSanityWriteContextMock,
  getPlatformSanityWriteContextMock,
} = vi.hoisted(() => ({
  getPublishedPostBodyMock: vi.fn(),
  saveSkimDraftMock: vi.fn(),
  generateTakeawaysMock: vi.fn(),
  getHostTenantSanityContextMock: vi.fn(),
  getHostTenantSanityWriteContextMock: vi.fn(),
  getPlatformSanityWriteContextMock: vi.fn(),
}));

const { SKIM_MODEL, GENERATE_SECRET, ANTHROPIC_KEY, envMock } = vi.hoisted(
  () => ({
    SKIM_MODEL: 'claude-haiku-4-5',
    GENERATE_SECRET: 'test-secret',
    ANTHROPIC_KEY: 'test-api-key',
    envMock: {} as {
      SANITY_GENERATE_SECRET?: string;
      ANTHROPIC_API_KEY?: string;
    },
  }),
);

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
  getPlatformSanityWriteContext: getPlatformSanityWriteContextMock,
}));

vi.mock('@web/server/skim/generate-takeaways/generate-takeaways', () => ({
  generateTakeaways: generateTakeawaysMock,
  SKIM_GENERATION_MODEL: SKIM_MODEL,
}));

vi.mock(
  '@web/server/tenant/tenant-sanity-context/tenant-sanity-context',
  () => ({
    getHostTenantSanityContext: getHostTenantSanityContextMock,
    getHostTenantSanityWriteContext: getHostTenantSanityWriteContextMock,
  }),
);

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

let loggerErrorMock = vi.mocked(logger.error);
let loggerWarnMock = vi.mocked(logger.warn);

const platformTenant = {
  projectId: 'platform-project',
  dataset: 'production',
  token: 'platform-token',
};

const GENERATE_SKIM_URL = 'https://example.com/api/generate-skim';

const tenantWriteCredentials = {
  projectId: 'tenant-project',
  dataset: 'production',
  token: 'tenant-write-token',
};

const makeRequest = (body: unknown, secret = GENERATE_SECRET): Request => {
  const url = new URL(GENERATE_SKIM_URL);
  if (secret !== undefined) url.searchParams.set('secret', secret);
  return new Request(url, {
    method: HTTP_METHOD.POST,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
};

describe('POST /api/generate-skim', () => {
  beforeEach(async () => {
    const fresh = await import('@web/utils/logger/logger');
    loggerErrorMock = vi.mocked(fresh.logger.error);
    loggerWarnMock = vi.mocked(fresh.logger.warn);
    envMock.SANITY_GENERATE_SECRET = GENERATE_SECRET;
    envMock.ANTHROPIC_API_KEY = ANTHROPIC_KEY;
    getPublishedPostBodyMock.mockReset();
    saveSkimDraftMock.mockReset();
    generateTakeawaysMock.mockReset();
    getHostTenantSanityContextMock.mockReset();
    getHostTenantSanityContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
    });
    getHostTenantSanityWriteContextMock.mockReset();
    getHostTenantSanityWriteContextMock.mockResolvedValue({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
      isActive: true,
    });
    getPlatformSanityWriteContextMock.mockReset();
    getPlatformSanityWriteContextMock.mockReturnValue(platformTenant);
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('with the platform environment configured', () => {
    let POST: typeof import('./route').POST;

    beforeEach(async () => {
      getPublishedPostBodyMock.mockResolvedValue({ ok: true, data: [] });
      generateTakeawaysMock.mockResolvedValue(['a', 'b', 'c']);
      saveSkimDraftMock.mockResolvedValue({ ok: true, data: undefined });
      ({ POST } = await import('./route'));
    });

    it('returns 401 when the secret is missing', async () => {
      const response = await POST(makeRequest({ _id: 'post-1' }, ''));

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('returns 401 when the secret does not match', async () => {
      const response = await POST(
        makeRequest({ _id: 'post-1' }, 'wrong-secret'),
      );

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('returns 400 for a malformed request body', async () => {
      const request = new Request(
        `${GENERATE_SKIM_URL}?secret=${GENERATE_SECRET}`,
        { method: HTTP_METHOD.POST, body: 'not json' },
      );
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('returns 400 when the body is valid JSON but missing _id', async () => {
      const response = await POST(makeRequest({ foo: 'bar' }));

      expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('returns 500 when reading the published post body fails', async () => {
      getPublishedPostBodyMock.mockResolvedValue({
        ok: false,
        error: new Error('not found'),
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(generateTakeawaysMock).not.toHaveBeenCalled();
    });

    it("returns 422 and leaves the draft untouched when Claude's response is malformed", async () => {
      generateTakeawaysMock.mockRejectedValue(new Error('bad response'));
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(422);
      expect(saveSkimDraftMock).not.toHaveBeenCalled();
    });

    it('returns 503 without saving when the platform write context is unconfigured', async () => {
      getPlatformSanityWriteContextMock.mockImplementation(() => {
        throw new Error('SANITY_API_WRITE_TOKEN is not set');
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(503);
      expect(saveSkimDraftMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'generate_skim.write_client_unconfigured',
        expect.anything(),
      );
    });

    it('returns 500 when saving the draft fails for another reason', async () => {
      saveSkimDraftMock.mockResolvedValue({
        ok: false,
        error: new Error('network error'),
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });

    it('reads the post body, generates takeaways, and patches the draft on success', async () => {
      const response = await POST(makeRequest({ _id: 'post-1' }));
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(json).toEqual({ ok: true, count: 3 });
      expect(getPublishedPostBodyMock).toHaveBeenCalledWith(
        'post-1',
        undefined,
      );
      expect(saveSkimDraftMock).toHaveBeenCalledWith(
        {
          postId: 'post-1',
          takeaways: ['a', 'b', 'c'],
          model: SKIM_MODEL,
        },
        platformTenant,
      );
    });

    it('is idempotent for the same post: it patches the draft and never appends', async () => {
      await POST(makeRequest({ _id: 'post-1' }));
      await POST(makeRequest({ _id: 'post-1' }));

      expect(saveSkimDraftMock).toHaveBeenCalledTimes(2);
      expect(saveSkimDraftMock).toHaveBeenNthCalledWith(
        1,
        {
          postId: 'post-1',
          takeaways: ['a', 'b', 'c'],
          model: SKIM_MODEL,
        },
        platformTenant,
      );
      expect(saveSkimDraftMock).toHaveBeenNthCalledWith(
        2,
        {
          postId: 'post-1',
          takeaways: ['a', 'b', 'c'],
          model: SKIM_MODEL,
        },
        platformTenant,
      );
    });

    it('forwards the resolved tenant Sanity context to getPublishedPostBody', async () => {
      const tenant = { ...tenantWriteCredentials, token: 'tenant-token' };
      getHostTenantSanityContextMock.mockResolvedValue({
        isResolvable: true,
        tenant,
      });
      await POST(makeRequest({ _id: 'post-1' }));

      expect(getPublishedPostBodyMock).toHaveBeenCalledWith('post-1', tenant);
    });

    it('returns 404 without reading the post when the requesting host is unresolvable', async () => {
      getHostTenantSanityContextMock.mockResolvedValue({ isResolvable: false });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });

    it('saves the skim draft with the resolved tenant Sanity write credentials', async () => {
      const tenant = tenantWriteCredentials;
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant,
        tenantId: 'tenant-1',
        isActive: true,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(getHostTenantSanityContextMock).toHaveBeenCalledTimes(1);
      expect(getHostTenantSanityWriteContextMock).toHaveBeenCalledTimes(1);
      expect(saveSkimDraftMock).toHaveBeenCalledWith(
        {
          postId: 'post-1',
          takeaways: ['a', 'b', 'c'],
          model: SKIM_MODEL,
        },
        tenant,
      );
      expect(getPlatformSanityWriteContextMock).not.toHaveBeenCalled();
    });

    it('returns 503 without generating when the tenant has no write credentials', async () => {
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant: undefined,
        tenantId: 'tenant-1',
        isActive: true,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));
      const json = await response.json();

      expect(response.status).toBe(503);
      expect(json).toEqual({
        message:
          'The requesting tenant has no usable Sanity write credentials.',
      });
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'generate_skim.tenant_write_credentials_missing',
        { postId: 'post-1', tenantId: 'tenant-1' },
      );
      expect(generateTakeawaysMock).not.toHaveBeenCalled();
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
      expect(saveSkimDraftMock).not.toHaveBeenCalled();
    });

    it('returns 403 without writing when the resolved tenant is not active', async () => {
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant: tenantWriteCredentials,
        tenantId: 'tenant-1',
        isActive: false,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(json).toEqual({
        message: 'The requesting tenant is not permitted to write.',
      });
      expect(loggerWarnMock).toHaveBeenCalledWith(
        'generate_skim.tenant_not_active',
        { postId: 'post-1', tenantId: 'tenant-1' },
      );
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
      expect(generateTakeawaysMock).not.toHaveBeenCalled();
      expect(saveSkimDraftMock).not.toHaveBeenCalled();
    });

    it('saves the skim draft when the resolved tenant is active', async () => {
      const tenant = tenantWriteCredentials;
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant,
        tenantId: 'tenant-1',
        isActive: true,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(saveSkimDraftMock).toHaveBeenCalledWith(
        {
          postId: 'post-1',
          takeaways: ['a', 'b', 'c'],
          model: SKIM_MODEL,
        },
        tenant,
      );
    });

    it('does not check tenant status in platform mode (no tenantId resolved)', async () => {
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: true,
        tenant: undefined,
        tenantId: undefined,
        isActive: true,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('returns 404 without reading the post when the write-side tenant is unresolvable', async () => {
      getHostTenantSanityWriteContextMock.mockResolvedValue({
        isResolvable: false,
      });
      const response = await POST(makeRequest({ _id: 'post-1' }));

      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
    });
  });

  it('returns 503 when ANTHROPIC_API_KEY is not configured', async () => {
    delete envMock.ANTHROPIC_API_KEY;
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(503);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });

  it('returns 503 when SANITY_GENERATE_SECRET is not configured', async () => {
    delete envMock.SANITY_GENERATE_SECRET;
    const { POST } = await import('./route');

    const response = await POST(makeRequest({ _id: 'post-1' }));

    expect(response.status).toBe(503);
    expect(getPublishedPostBodyMock).not.toHaveBeenCalled();
  });
});
