import {
  HTTP_METHOD,
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  routes,
  type THttpMethod,
} from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import type * as DbConstants from '@blog/db/constants';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import {
  clearNewsletterUnsubscribeToken,
  readNewsletterUnsubscribeToken,
  storeNewsletterUnsubscribeToken,
} from '@web/server/newsletter/newsletter-unsubscribe-token-cookie/newsletter-unsubscribe-token-cookie';
import { makeNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import { makeSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  DEFAULT_TENANT_BASE_URL,
  DEFAULT_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { GET, POST } from './route';

const { resolveRequestTenantMock } = vi.hoisted(() => ({
  resolveRequestTenantMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual<typeof DbConstants>('@blog/db/constants')),
  queries: { subscribers: { unsubscribeByToken: vi.fn() } },
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

const unsubscribeByTokenMock = vi.mocked(
  queries.subscribers.unsubscribeByToken,
);
const resolveNewsletterLinkLocaleMock = vi.mocked(resolveNewsletterLinkLocale);

const TOKEN = 'unsubscribe-token';
const UNSUBSCRIBED_LOCATION = 'https://example.com/newsletter/unsubscribed';
const INVALID_LOCATION = 'https://example.com/newsletter/unsubscribe-invalid';
const FAILED_LOCATION = 'https://example.com/newsletter/unsubscribe-failed';

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

  it('keeps a present token server-side and sends them to the confirmation page without it, without touching the db', async () => {
    const response = await GET(
      toUnsubscribeRequest(routes.newsletterUnsubscribe(TOKEN)),
    );

    expect(storeNewsletterUnsubscribeToken).toHaveBeenCalledWith(TOKEN);
    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(
      'https://example.com/newsletter/unsubscribe',
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
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
      'https://example.com/fr/newsletter/unsubscribe',
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
    unsubscribeByTokenMock.mockResolvedValue({
      outcome: 'unsubscribed',
      subscriber: makeSubscriber(),
    });
    resolveRequestTenantMock.mockResolvedValue({
      id: DEFAULT_TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });
  });

  it('unsubscribes and sends them to the unsubscribed page with a GET', async () => {
    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(locationOf(response)).toBe(UNSUBSCRIBED_LOCATION);
    expect(unsubscribeByTokenMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      TOKEN,
    );
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
      'https://example.com/fr/newsletter/unsubscribed',
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
    unsubscribeByTokenMock.mockResolvedValue({ outcome: 'not-found' });
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
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    resolveRequestTenantMock.mockResolvedValue(undefined);
    const response = await POST(request);

    expect(locationOf(response)).toBe(FAILED_LOCATION);
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.unsubscribe_link_tenant_unresolved'),
    );
    errorSpy.mockRestore();
  });

  it('sends them to the failed page and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    unsubscribeByTokenMock.mockRejectedValue(new Error('db down'));
    const response = await POST(request);

    expect(locationOf(response)).toBe(FAILED_LOCATION);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.unsubscribe_link_failed'),
    );
    errorSpy.mockRestore();
  });
});
