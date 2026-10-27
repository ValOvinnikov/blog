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
import { faker } from '@faker-js/faker';
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

faker.seed(6009);

const { NL, FR } = LOCALE_ISO_CODES;
const UNSUPPORTED_LOCALE = 'IT';
const MOCK_NOW = faker.date.recent().getTime();
const MOCK_SECRET = faker.string.alphanumeric(24);
const MOCK_OTHER_SECRET = faker.string.alphanumeric(24);
const MOCK_PAGE_ID = faker.lorem.slug();
const MOCK_OTHER_PAGE_ID = faker.lorem.slug();
const MOCK_PAGE_TITLE = faker.lorem.words(3);
const MOCK_ERROR = new Error(faker.lorem.sentence());
const MOCK_ROUTE_ORIGIN = faker.internet.url({ appendSlash: false });
const buildRoutePath = (id: string): string => `/api/internal/pages/${id}`;
const MOCK_ROUTE_URL = `${MOCK_ROUTE_ORIGIN}${buildRoutePath(MOCK_PAGE_ID)}`;

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
    path = buildRoutePath(MOCK_PAGE_ID),
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

const unsignedRequest = (): Request =>
  new Request(MOCK_ROUTE_URL, {
    method: HTTP_METHOD.POST,
    body: requestBody(),
  });

const callRoute = (request: Request) =>
  POST(request, { params: Promise.resolve({ id: MOCK_PAGE_ID }) });

describe(POST, () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: MOCK_NOW });
    envMock.INTERNAL_PAGES_SECRET = MOCK_SECRET;
    getTenantSanityCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
    getPageTitleMock.mockResolvedValue({ ok: true, data: MOCK_PAGE_TITLE });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it.each([
    ['unsigned', () => unsignedRequest()],
    [
      'signed with another secret',
      () => signedRequest(requestBody(), { secret: MOCK_OTHER_SECRET }),
    ],
    [
      'changed after signing',
      () =>
        new Request(MOCK_ROUTE_URL, {
          method: HTTP_METHOD.POST,
          headers: signedRequest(requestBody()).headers,
          body: requestBody({ locale: FR }),
        }),
    ],
    [
      'signed for another page',
      () =>
        signedRequest(requestBody(), {
          path: buildRoutePath(MOCK_OTHER_PAGE_ID),
        }),
    ],
    [
      'expired',
      () =>
        signedRequest(requestBody(), {
          now: MOCK_NOW - ENQUEUE_MAX_AGE_MS - 1,
        }),
    ],
  ])('refuses a request that is %s', async (_case, createRequest) => {
    const response = await callRoute(createRequest());

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(getPageTitleMock).not.toHaveBeenCalled();
  });

  it('refuses an unsigned request for an unknown page like a known one', async () => {
    getPageTitleMock.mockResolvedValue({ ok: true, data: undefined });

    const response = await callRoute(unsignedRequest());

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
  });

  it('answers not found for an unknown page', async () => {
    getPageTitleMock.mockResolvedValue({ ok: true, data: undefined });

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
  });

  it('answers not found for an unknown tenant without reading the page', async () => {
    getTenantSanityCredentialsMock.mockResolvedValue(undefined);

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(getPageTitleMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a tenant id that is not a uuid', requestBody({ tenantId: 'not-a-uuid' })],
    ['an unsupported locale', requestBody({ locale: UNSUPPORTED_LOCALE })],
    ['a body that is not JSON', 'not json'],
  ])('rejects %s', async (_case, rawBody) => {
    const response = await callRoute(signedRequest(rawBody));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('logs and fails when the title read fails', async () => {
    getPageTitleMock.mockResolvedValue({ ok: false, error: MOCK_ERROR });

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_TITLE_FETCH_FAILED_EVENT,
      {
        tenantId: MOCK_TENANT_ID,
        id: MOCK_PAGE_ID,
        locale: NL,
        error: MOCK_ERROR,
      },
    );
  });

  it('logs and fails when the secret is not configured', async () => {
    envMock.INTERNAL_PAGES_SECRET = undefined;

    const response = await callRoute(signedRequest(requestBody()));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      INTERNAL_PAGES_SECRET_MISSING_EVENT,
    );
  });
});
