import {
  HTTP_METHOD,
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  routes,
  type THttpMethod,
  SUBSCRIBER_OUTCOME,
} from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import type * as DbConstants from '@blog/db/constants';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { readNewsletterUnsubscribeSubscriberId } from '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token';
import {
  clearNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from '@web/server/newsletter/newsletter-unsubscribe-token-cookie/newsletter-unsubscribe-token-cookie';
import { makeNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import {
  DEFAULT_TENANT_BASE_URL,
  DEFAULT_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { GET, POST } from './route';

const { resolveRequestTenantMock } = vi.hoisted(() => ({
  resolveRequestTenantMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual<typeof DbConstants>('@blog/db/constants')),
  queries: {
    subscribers: { unsubscribeByToken: vi.fn(), unsubscribeById: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock(
  '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale',
  () => ({ resolveNewsletterLinkLocale: vi.fn() }),
);

vi.mock(
  '@web/server/newsletter/newsletter-unsubscribe-token-cookie/newsletter-unsubscribe-token-cookie',
  () => ({
    storeNewsletterUnsubscribeToken: vi.fn(),
    readNewsletterUnsubscribeToken: vi.fn(),
    clearNewsletterUnsubscribeToken: vi.fn(),
  }),
);

vi.mock(
  '@web/server/newsletter/newsletter-unsubscribe-token/newsletter-unsubscribe-token',
  () => ({ readNewsletterUnsubscribeSubscriberId: vi.fn() }),
);

const unsubscribeByTokenMock = vi.mocked(
  queries.subscribers.unsubscribeByToken,
);
const unsubscribeByIdMock = vi.mocked(queries.subscribers.unsubscribeById);
const readNewsletterUnsubscribeSubscriberIdMock = vi.mocked(
  readNewsletterUnsubscribeSubscriberId,
);
const resolveNewsletterLinkLocaleMock = vi.mocked(resolveNewsletterLinkLocale);

const TOKEN = faker.string.alphanumeric(16);
const UNSUBSCRIBED_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/unsubscribed`;
const INVALID_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/unsubscribe-invalid`;
const FAILED_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/unsubscribe-failed`;

const toUnsubscribeRequest = (
  path: string,
  method: THttpMethod = HTTP_METHOD.GET,
) => new Request(new URL(path, DEFAULT_TENANT_BASE_URL), { method });

const locationOf = (response: Response) => response.headers.get('location');

beforeEach(() => {
  resolveNewsletterLinkLocaleMock.mockResolvedValue(makeNewsletterLinkLocale());
});

describe('GET /api/newsletter/unsubscribe', () => {
  it('sends a link without a token to the invalid page without touching the db', async () => {
    const response = await GET(
      toUnsubscribeRequest(routes.newsletterUnsubscribeSubmit()),
    );

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(INVALID_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenantMock).not.toHaveBeenCalled();
  });

  it('keeps the token server-side and sends them to the confirm page without it', async () => {
    const response = await GET(
      toUnsubscribeRequest(routes.newsletterUnsubscribe(TOKEN)),
    );

    expect(storeNewsletterUnsubscribeToken).toHaveBeenCalledWith(TOKEN);
    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(
      `${DEFAULT_TENANT_BASE_URL}/newsletter/unsubscribe`,
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenantMock).not.toHaveBeenCalled();
  });

  it('sends them to the confirmation page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      makeNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await GET(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribe(TOKEN, LOCALE_ISO_CODES.FR),
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(locationOf(response)).toBe(
      `${DEFAULT_TENANT_BASE_URL}/fr/newsletter/unsubscribe`,
    );
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  let request: Request;

  beforeEach(() => {
    request = toUnsubscribeRequest(
      routes.newsletterUnsubscribe(TOKEN),
      HTTP_METHOD.POST,
    );
    unsubscribeByTokenMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
    );
    readNewsletterUnsubscribeSubscriberIdMock.mockReturnValue(null);
    resolveRequestTenantMock.mockResolvedValue({
      id: DEFAULT_TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('unsubscribes by an unsigned token and sends them to the unsubscribed page', async () => {
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(UNSUBSCRIBED_LOCATION);
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      TOKEN,
    );
  });

  it('unsubscribes the subscriber a signed token names', async () => {
    const subscriberId = faker.string.uuid();
    readNewsletterUnsubscribeSubscriberIdMock.mockReturnValue(subscriberId);
    unsubscribeByIdMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
    );

    const response = await POST(request);

    expect(locationOf(response)).toBe(UNSUBSCRIBED_LOCATION);
    expect(readNewsletterUnsubscribeSubscriberIdMock).toHaveBeenCalledWith(
      TOKEN,
    );
    expect(unsubscribeByIdMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      subscriberId,
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('sends a signed token whose subscriber is gone to the invalid page', async () => {
    readNewsletterUnsubscribeSubscriberIdMock.mockReturnValue(
      faker.string.uuid(),
    );
    unsubscribeByIdMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND),
    );

    const response = await POST(request);

    expect(locationOf(response)).toBe(INVALID_LOCATION);
  });

  it('sends them to the page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      makeNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await POST(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribe(TOKEN, LOCALE_ISO_CODES.FR),
        HTTP_METHOD.POST,
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(locationOf(response)).toBe(
      `${DEFAULT_TENANT_BASE_URL}/fr/newsletter/unsubscribed`,
    );
  });

  it('unsubscribes with the token kept from the link when the URL carries none', async () => {
    vi.mocked(readNewsletterUnsubscribeToken).mockResolvedValueOnce(TOKEN);
    const response = await POST(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribeSubmit(),
        HTTP_METHOD.POST,
      ),
    );

    expect(locationOf(response)).toBe(UNSUBSCRIBED_LOCATION);
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      TOKEN,
    );
    expect(clearNewsletterUnsubscribeToken).toHaveBeenCalled();
  });

  it('sends a link without a token to the invalid page without querying the db', async () => {
    const response = await POST(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribeSubmit(),
        HTTP_METHOD.POST,
      ),
    );

    expect(locationOf(response)).toBe(INVALID_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('sends an unknown or already-used token to the invalid page', async () => {
    unsubscribeByTokenMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND),
    );
    const response = await POST(request);

    expect(locationOf(response)).toBe(INVALID_LOCATION);
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({
        id: DEFAULT_TENANT_ID,
        status,
      });
      const response = await POST(request);

      expect(locationOf(response)).toBe(UNSUBSCRIBED_LOCATION);
      expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        TOKEN,
      );
    },
  );

  it('sends them to the failed page and logs when no tenant resolves', async () => {
    resolveRequestTenantMock.mockResolvedValue(undefined);
    const response = await POST(request);

    expect(locationOf(response)).toBe(FAILED_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.unsubscribe_link_tenant_unresolved',
    );
  });

  it('sends them to the failed page and logs when the db query throws', async () => {
    const error = new Error('db down');
    unsubscribeByTokenMock.mockRejectedValue(error);
    const response = await POST(request);

    expect(locationOf(response)).toBe(FAILED_LOCATION);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.unsubscribe_link_failed',
      { error },
    );
  });
});
