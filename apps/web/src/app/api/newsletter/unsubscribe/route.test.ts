import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
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
  ...(await vi.importActual<typeof import('@blog/db/constants')>(
    '@blog/db/constants',
  )),
  queries: { subscribers: { unsubscribeByToken: vi.fn() } },
}));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: resolveRequestTenantMock,
}));

vi.mock(
  '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale',
  () => ({ resolveNewsletterLinkLocale: vi.fn() }),
);

const unsubscribeByTokenMock = vi.mocked(
  queries.subscribers.unsubscribeByToken,
);
const resolveNewsletterLinkLocaleMock = vi.mocked(resolveNewsletterLinkLocale);

const TOKEN = 'unsubscribe-token';

const toUnsubscribeRequest = (path: string, method = 'GET') =>
  new Request(new URL(path, DEFAULT_TENANT_BASE_URL), { method });

beforeEach(() => {
  resolveNewsletterLinkLocaleMock.mockResolvedValue(makeNewsletterLinkLocale());
});

describe('GET /api/newsletter/unsubscribe', () => {
  it('sends a link without a token to the invalid page without touching the db', async () => {
    const response = await GET(
      toUnsubscribeRequest('/api/newsletter/unsubscribe'),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
    expect(resolveRequestTenantMock).not.toHaveBeenCalled();
  });

  it('sends a present token to the confirmation page without touching the db', async () => {
    const response = await GET(
      toUnsubscribeRequest(routes.newsletterUnsubscribe(TOKEN)),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe?token=unsubscribe-token',
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
    expect(response.headers.get('location')).toBe(
      'https://example.com/fr/newsletter/unsubscribe?token=unsubscribe-token',
    );
  });
});

describe('POST /api/newsletter/unsubscribe', () => {
  let request: Request;

  beforeEach(() => {
    request = toUnsubscribeRequest(routes.newsletterUnsubscribe(TOKEN), 'POST');
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

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribed',
    );
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
        'POST',
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(response.headers.get('location')).toBe(
      'https://example.com/fr/newsletter/unsubscribed',
    );
  });

  it('sends a link without a token to the invalid page without querying the db', async () => {
    const response = await POST(
      toUnsubscribeRequest('/api/newsletter/unsubscribe', 'POST'),
    );

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
    expect(unsubscribeByTokenMock).not.toHaveBeenCalled();
  });

  it('sends an unknown or already-used token to the invalid page', async () => {
    unsubscribeByTokenMock.mockResolvedValue({ outcome: 'not-found' });
    const response = await POST(request);

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-invalid',
    );
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'unsubscribes when the tenant is %s',
    async (status) => {
      resolveRequestTenantMock.mockResolvedValue({
        id: DEFAULT_TENANT_ID,
        status,
      });
      const response = await POST(request);

      expect(response.headers.get('location')).toBe(
        'https://example.com/newsletter/unsubscribed',
      );
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

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-failed',
    );
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

    expect(response.headers.get('location')).toBe(
      'https://example.com/newsletter/unsubscribe-failed',
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.unsubscribe_link_failed'),
    );
    errorSpy.mockRestore();
  });
});
