import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { logger } from '@web/utils/logger/logger';

const { revalidateTagMock, revalidatePathMock, listTenantsMock } = vi.hoisted(
  () => ({
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    listTenantsMock: vi.fn(),
  }),
);

const { REVALIDATE_SECRET, envMock } = vi.hoisted(() => ({
  REVALIDATE_SECRET: 'test-secret',
  envMock: {} as { SITE_CONFIG_REVALIDATE_SECRET?: string },
}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenants: listTenantsMock },
  },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

let loggerWarnMock = vi.mocked(logger.warn);

const REVALIDATE_SITE_CONFIG_URL =
  'https://example.com/api/revalidate-site-config';
const BEARER_SECRET = `Bearer ${REVALIDATE_SECRET}`;
const TENANT_ID = 'tenant-1';
const SITE_CONFIG_TAG = 'site-config:tenant-1';
const SETTINGS_FEATURES_TAG = 'settings-features:tenant-1';
const TENANT_PLAN_TAG = 'tenant-plan:tenant-1';
const WHOLE_SITE_PURGE_EVENT = 'revalidate_site_config.whole_site_purge';

const makeRequest = (
  authorization?: string,
  body?: Record<string, unknown>,
): Request => {
  const headers = new Headers();
  if (authorization !== undefined) {
    headers.set('authorization', authorization);
  }
  return new Request(REVALIDATE_SITE_CONFIG_URL, {
    method: HTTP_METHOD.POST,
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
  return new Request(REVALIDATE_SITE_CONFIG_URL, {
    method: HTTP_METHOD.POST,
    headers,
    body: rawBody,
  });
};

describe('POST /api/revalidate-site-config', () => {
  beforeEach(async () => {
    const fresh = await import('@web/utils/logger/logger');
    loggerWarnMock = vi.mocked(fresh.logger.warn);
    envMock.SITE_CONFIG_REVALIDATE_SECRET = REVALIDATE_SECRET;
    revalidateTagMock.mockReset();
    revalidatePathMock.mockReset();
    listTenantsMock.mockReset();
    loggerWarnMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('with the site config secret configured', () => {
    let POST: typeof import('./route').POST;

    beforeEach(async () => {
      listTenantsMock.mockResolvedValue([{ id: TENANT_ID }]);
      ({ POST } = await import('./route'));
    });

    it('revalidates only the given tenant’s scoped tags when a tenantId is provided', async () => {
      const request = makeRequest(BEARER_SECRET, {
        tenantId: TENANT_ID,
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(revalidateTagMock).toHaveBeenCalledWith(SITE_CONFIG_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith(SETTINGS_FEATURES_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith(TENANT_PLAN_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledTimes(3);
      expect(listTenantsMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      expect(loggerWarnMock).toHaveBeenCalledWith(
        WHOLE_SITE_PURGE_EVENT,
        expect.objectContaining({
          tenantIds: [TENANT_ID],
          requestedTenantId: TENANT_ID,
        }),
      );
      expect(json).toEqual({
        revalidated: [SITE_CONFIG_TAG, SETTINGS_FEATURES_TAG, TENANT_PLAN_TAG],
        pathPurged: true,
      });
    });

    it("revalidates every tenant's scoped tags when no tenantId is provided", async () => {
      listTenantsMock.mockResolvedValue([
        { id: TENANT_ID },
        { id: 'tenant-2' },
      ]);
      const request = makeRequest(BEARER_SECRET);
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(revalidateTagMock).toHaveBeenCalledWith(SITE_CONFIG_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledWith('site-config:tenant-2', {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledTimes(6);
      expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
      expect(loggerWarnMock).toHaveBeenCalledWith(
        WHOLE_SITE_PURGE_EVENT,
        expect.objectContaining({
          tenantIds: [TENANT_ID, 'tenant-2'],
          requestedTenantId: undefined,
        }),
      );
      expect(json.revalidated).toHaveLength(6);
    });

    it('revalidates every known tenant’s scoped tags when tenantId is an empty string', async () => {
      const request = makeRequest(BEARER_SECRET, { tenantId: '' });
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(revalidateTagMock).toHaveBeenCalledWith(SITE_CONFIG_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    });

    it("revalidates every tenant's scoped tags when the request body is malformed JSON", async () => {
      const request = makeRequestWithRawBody(BEARER_SECRET, '{not json');
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.OK);
      expect(revalidateTagMock).toHaveBeenCalledWith(SITE_CONFIG_TAG, {
        expire: 0,
      });
      expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    });

    it('returns 401 and revalidates nothing for an invalid secret', async () => {
      const request = makeRequest('Bearer wrong-secret');
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(revalidateTagMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it('returns 401 and revalidates nothing when the authorization header is missing', async () => {
      const request = makeRequest();
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(revalidateTagMock).not.toHaveBeenCalled();
    });

    it('returns 401 when the authorization header is not a bearer token', async () => {
      const request = makeRequest(REVALIDATE_SECRET);
      const response = await POST(request);

      expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(revalidateTagMock).not.toHaveBeenCalled();
    });
  });

  it('returns 500 when SITE_CONFIG_REVALIDATE_SECRET is not configured', async () => {
    delete envMock.SITE_CONFIG_REVALIDATE_SECRET;
    const { POST } = await import('./route');

    const request = makeRequest(BEARER_SECRET);
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
