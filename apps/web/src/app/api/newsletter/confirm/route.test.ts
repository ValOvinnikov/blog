import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  routes,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { makeNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import { makeSubscriber } from '@web/testing/shared/subscriber/fixtures';
import {
  DEFAULT_TENANT_BASE_URL,
  DEFAULT_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { GET } from './route';

vi.mock('@blog/db', () => ({
  queries: { subscribers: { confirmSubscriber: vi.fn() } },
}));

vi.mock('@web/server/tenant/write-gate/write-gate', () => ({
  resolveWritableTenant: vi.fn(),
}));

vi.mock(
  '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale',
  () => ({ resolveNewsletterLinkLocale: vi.fn() }),
);

const confirmSubscriberMock = vi.mocked(queries.subscribers.confirmSubscriber);
const resolveWritableTenantMock = vi.mocked(resolveWritableTenant);
const resolveNewsletterLinkLocaleMock = vi.mocked(resolveNewsletterLinkLocale);

const TOKEN = faker.string.alphanumeric(16);
const CONFIRMED_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/confirmed`;
const INVALID_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/confirm-invalid`;
const FAILED_LOCATION = `${DEFAULT_TENANT_BASE_URL}/newsletter/confirm-failed`;

const toConfirmRequest = (path: string) =>
  new Request(new URL(path, DEFAULT_TENANT_BASE_URL));

describe('GET /api/newsletter/confirm', () => {
  let request: Request;

  beforeEach(() => {
    request = toConfirmRequest(routes.newsletterConfirm(TOKEN));
    confirmSubscriberMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.CONFIRMED,
      subscriber: makeSubscriber(),
    });
    resolveWritableTenantMock.mockResolvedValue({
      ok: true,
      tenantId: DEFAULT_TENANT_ID,
    });
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      makeNewsletterLinkLocale(),
    );
  });

  it('confirms the subscriber and sends them to the confirmed page', async () => {
    const response = await GET(request);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(response.headers.get('location')).toBe(CONFIRMED_LOCATION);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(confirmSubscriberMock).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      TOKEN,
    );
  });

  it('sends them to the page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      makeNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await GET(
      toConfirmRequest(routes.newsletterConfirm(TOKEN, LOCALE_ISO_CODES.FR)),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(response.headers.get('location')).toBe(
      `${DEFAULT_TENANT_BASE_URL}/fr/newsletter/confirmed`,
    );
  });

  it("keeps the site's own default language unprefixed", async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      makeNewsletterLinkLocale({
        locale: LOCALE_ISO_CODES.NL,
        defaultLocale: LOCALE_ISO_CODES.NL,
      }),
    );
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(CONFIRMED_LOCATION);
  });

  it('resolves the language of a link sent without one', async () => {
    await GET(request);

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(null);
  });

  it('treats an already-confirmed token as success', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED,
      subscriber: makeSubscriber(),
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(CONFIRMED_LOCATION);
  });

  it('sends a link without a token to the invalid page without querying the db', async () => {
    const response = await GET(toConfirmRequest('/api/newsletter/confirm'));

    expect(response.headers.get('location')).toBe(INVALID_LOCATION);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends an unrecognized token to the invalid page', async () => {
    confirmSubscriberMock.mockResolvedValue({
      outcome: SUBSCRIBER_OUTCOME.NOT_FOUND,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(INVALID_LOCATION);
  });

  it('sends an inactive tenant to the unavailable page without confirming', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.INACTIVE,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(
      `${DEFAULT_TENANT_BASE_URL}/newsletter/confirm-unavailable`,
    );
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends an unresolved tenant to the failed page without querying the db', async () => {
    resolveWritableTenantMock.mockResolvedValue({
      ok: false,
      reason: TENANT_WRITE_REFUSAL.UNRESOLVED,
    });
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(FAILED_LOCATION);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends them to the failed page and logs when the db query throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    confirmSubscriberMock.mockRejectedValue(new Error('db down'));
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(FAILED_LOCATION);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('newsletter.confirm_failed'),
    );
    errorSpy.mockRestore();
  });
});
