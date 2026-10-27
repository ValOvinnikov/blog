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
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { MOCK_UNSUBSCRIBE_TOKEN } from '@web/testing/server/newsletter/fixtures';
import { mockNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { GET, POST } from './route';

faker.seed(6009);

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual<typeof DbConstants>('@blog/db/constants')),
  queries: {
    subscribers: { unsubscribeByToken: vi.fn(), unsubscribeById: vi.fn() },
  },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant');

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

const MOCK_UNSUBSCRIBED_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/unsubscribed`;
const MOCK_INVALID_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/unsubscribe-invalid`;
const MOCK_FAILED_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/unsubscribe-failed`;

const toUnsubscribeRequest = (
  path: string,
  method: THttpMethod = HTTP_METHOD.GET,
) => new Request(new URL(path, MOCK_TENANT_BASE_URL), { method });

const locationOf = (response: Response) => response.headers.get('location');

const toTokenlessPost = () =>
  toUnsubscribeRequest(routes.newsletterUnsubscribeSubmit(), HTTP_METHOD.POST);

beforeEach(() => {
  resolveNewsletterLinkLocaleMock.mockResolvedValue(mockNewsletterLinkLocale());
});

describe(GET, () => {
  it('sends a link without a token to the invalid page', async () => {
    const response = await GET(
      toUnsubscribeRequest(routes.newsletterUnsubscribeSubmit()),
    );

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(MOCK_INVALID_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenant).not.toHaveBeenCalled();
  });

  it('keeps the token server-side and redirects to the confirm page without it', async () => {
    const response = await GET(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribe(MOCK_UNSUBSCRIBE_TOKEN),
      ),
    );

    expect(storeNewsletterUnsubscribeToken).toHaveBeenCalledWith(
      MOCK_UNSUBSCRIBE_TOKEN,
    );
    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(
      `${MOCK_TENANT_BASE_URL}/newsletter/unsubscribe`,
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenant).not.toHaveBeenCalled();
  });

  it('redirects to the confirm page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      mockNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await GET(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribe(
          MOCK_UNSUBSCRIBE_TOKEN,
          LOCALE_ISO_CODES.FR,
        ),
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(locationOf(response)).toBe(
      `${MOCK_TENANT_BASE_URL}/fr/newsletter/unsubscribe`,
    );
  });
});

describe(POST, () => {
  let request: Request;

  beforeEach(() => {
    request = toUnsubscribeRequest(
      routes.newsletterUnsubscribe(MOCK_UNSUBSCRIBE_TOKEN),
      HTTP_METHOD.POST,
    );
    unsubscribeByTokenMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
    );
    readNewsletterUnsubscribeSubscriberIdMock.mockReturnValue(null);
  });

  it('unsubscribes by an unsigned token and redirects to the unsubscribed page', async () => {
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(MOCK_UNSUBSCRIBED_LOCATION);
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_UNSUBSCRIBE_TOKEN,
    );
  });

  it('unsubscribes the subscriber a signed token names', async () => {
    const subscriberId = faker.string.uuid();
    readNewsletterUnsubscribeSubscriberIdMock.mockReturnValue(subscriberId);
    unsubscribeByIdMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.UNSUBSCRIBED),
    );

    const response = await POST(request);

    expect(locationOf(response)).toBe(MOCK_UNSUBSCRIBED_LOCATION);
    expect(readNewsletterUnsubscribeSubscriberIdMock).toHaveBeenCalledWith(
      MOCK_UNSUBSCRIBE_TOKEN,
    );
    expect(unsubscribeByIdMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
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

    expect(locationOf(response)).toBe(MOCK_INVALID_LOCATION);
  });

  it('redirects to the unsubscribed page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      mockNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await POST(
      toUnsubscribeRequest(
        routes.newsletterUnsubscribe(
          MOCK_UNSUBSCRIBE_TOKEN,
          LOCALE_ISO_CODES.FR,
        ),
        HTTP_METHOD.POST,
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(locationOf(response)).toBe(
      `${MOCK_TENANT_BASE_URL}/fr/newsletter/unsubscribed`,
    );
  });

  it('unsubscribes with the kept token when the URL carries none', async () => {
    vi.mocked(readNewsletterUnsubscribeToken).mockResolvedValueOnce(
      MOCK_UNSUBSCRIBE_TOKEN,
    );
    const response = await POST(toTokenlessPost());

    expect(locationOf(response)).toBe(MOCK_UNSUBSCRIBED_LOCATION);
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_UNSUBSCRIBE_TOKEN,
    );
    expect(clearNewsletterUnsubscribeToken).toHaveBeenCalled();
  });

  it('sends a link without any token to the invalid page', async () => {
    const response = await POST(toTokenlessPost());

    expect(locationOf(response)).toBe(MOCK_INVALID_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('sends an unknown or already-used token to the invalid page', async () => {
    unsubscribeByTokenMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND),
    );
    const response = await POST(request);

    expect(locationOf(response)).toBe(MOCK_INVALID_LOCATION);
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes when the tenant is %s',
    async (status) => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(
        mockTenant({ status }),
      );
      const response = await POST(request);

      expect(locationOf(response)).toBe(MOCK_UNSUBSCRIBED_LOCATION);
      expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_UNSUBSCRIBE_TOKEN,
      );
    },
  );

  it('redirects to the failed page and logs when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);
    const response = await POST(request);

    expect(locationOf(response)).toBe(MOCK_FAILED_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.unsubscribe_link_tenant_unresolved',
    );
  });

  it('redirects to the failed page and logs when the db query throws', async () => {
    unsubscribeByTokenMock.mockRejectedValue(MOCK_ERROR);
    const response = await POST(request);

    expect(locationOf(response)).toBe(MOCK_FAILED_LOCATION);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.unsubscribe_link_failed',
      { error: MOCK_ERROR },
    );
  });
});
