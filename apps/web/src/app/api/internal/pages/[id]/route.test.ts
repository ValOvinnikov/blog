import {
  HTTP_METHOD,
  HTTP_STATUS,
  LOCALE_ISO_CODES,
} from '@blog/config/constants';
import {
  buildEnqueueHeaders,
  ENQUEUE_MAX_AGE_MS,
} from '@blog/utils/enqueue-signature';
import { isUndefined } from '@blog/utils/primitives';
import {
  INTERNAL_PAGES_SECRET_MISSING_EVENT,
  INTERNAL_PAGES_TITLE_FETCH_FAILED_EVENT,
} from '@web/constants/internal-pages';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { POST } from './route';

const { getTenantSanityCredentialsMock, getPageTitleMock, envMock } =
  vi.hoisted(() => ({
    getTenantSanityCredentialsMock: vi.fn(),
    getPageTitleMock: vi.fn(),
    envMock: {} as { INTERNAL_PAGES_SECRET?: string },
  }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantSanityCredentials: getTenantSanityCredentialsMock },
  },
}));

vi.mock('@blog/service', () => ({
  service: { pages: { pageTitle: { v1: { getPageTitle: getPageTitleMock } } } },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

const MOCK_SECRET = 'internal-pages-secret';
const MOCK_PAGE_ID = 'contact-page';
const MOCK_PAGE_TITLE = 'Get in touch';
const MOCK_ROUTE_URL = `https://example.com/api/internal/pages/${MOCK_PAGE_ID}`;
const { NL } = LOCALE_ISO_CODES;

const MOCK_CREDENTIALS = {
  ...MOCK_TENANT_SANITY_CONTEXT,
  defaultLocale: LOCALE_ISO_CODES.EN,
};

const requestBody = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({ tenantId: MOCK_TENANT_ID, locale: NL, ...overrides });

const signedRequest = (
  rawBody: string,
  options: { secret?: string; now?: number; path?: string } = {},
): Request => {
  const {
    secret = MOCK_SECRET,
    now,
    path = new URL(MOCK_ROUTE_URL).pathname,
  } = options;
  return new Request(MOCK_ROUTE_URL, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({
      secret,
      path,
      rawBody,
      ...(isUndefined(now) ? {} : { now }),
    }),
    body: rawBody,
  });
};

const callRoute = (request: Request, id = MOCK_PAGE_ID) =>
  POST(request, { params: Promise.resolve({ id }) });

describe('POST /api/internal/pages/[id]', () => {
  beforeEach(() => {
    envMock.INTERNAL_PAGES_SECRET = MOCK_SECRET;
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
    getPageTitleMock.mockResolvedValue({ ok: true, data: MOCK_PAGE_TITLE });
  });

  it("returns the page's title in the requested language", async () => {
    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual({ title: MOCK_PAGE_TITLE });
    expect(getTenantSanityCredentialsMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
    expect(getPageTitleMock).toHaveBeenCalledExactlyOnceWith(MOCK_PAGE_ID, {
      ...MOCK_CREDENTIALS,
      locale: NL,
    });
  });

  it('refuses an unsigned request without reading the page', async () => {
    const request = new Request(MOCK_ROUTE_URL, {
      method: HTTP_METHOD.POST,
      body: requestBody(),
    });

    const response = await callRoute(request);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getPageTitleMock).not.toHaveBeenCalled();
  });

  it('refuses a request signed with another secret', async () => {
    const response = await callRoute(
      signedRequest(requestBody(), { secret: 'another-secret' }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('refuses a request whose body was changed after signing', async () => {
    const signed = signedRequest(requestBody());
    const tampered = new Request(MOCK_ROUTE_URL, {
      method: HTTP_METHOD.POST,
      headers: signed.headers,
      body: requestBody({ locale: LOCALE_ISO_CODES.FR }),
    });

    const response = await callRoute(tampered);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('refuses a request signed for another page', async () => {
    const response = await callRoute(
      signedRequest(requestBody(), {
        path: '/api/internal/pages/another-page',
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('refuses an expired request', async () => {
    const response = await callRoute(
      signedRequest(requestBody(), {
        now: Date.now() - ENQUEUE_MAX_AGE_MS - 1,
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('refuses an unsigned request for an unknown page the same way as a known one', async () => {
    getPageTitleMock.mockResolvedValue({ ok: true, data: undefined });
    const request = new Request(MOCK_ROUTE_URL, {
      method: HTTP_METHOD.POST,
      body: requestBody(),
    });

    const response = await callRoute(request);

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('returns 404 for an unknown page', async () => {
    getPageTitleMock.mockResolvedValue({ ok: true, data: undefined });

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('returns 404 for an unknown tenant', async () => {
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getPageTitleMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a tenant id that is not a uuid', requestBody({ tenantId: 'not-a-uuid' })],
    ['an unsupported locale', requestBody({ locale: 'IT' })],
    ['a body that is not JSON', 'not json'],
  ])('returns 400 for %s', async (_case, rawBody) => {
    const response = await callRoute(signedRequest(rawBody));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('logs and returns 500 when the title read fails', async () => {
    const error = new Error('sanity down');
    getPageTitleMock.mockResolvedValue({ ok: false, error });

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      INTERNAL_PAGES_TITLE_FETCH_FAILED_EVENT,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        id: MOCK_PAGE_ID,
        error,
      }),
    );
  });

  it('logs and returns 500 when the secret is not configured', async () => {
    envMock.INTERNAL_PAGES_SECRET = undefined;

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      INTERNAL_PAGES_SECRET_MISSING_EVENT,
    );
  });
});
