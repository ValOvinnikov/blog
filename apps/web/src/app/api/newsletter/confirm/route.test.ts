import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  routes,
  SUBSCRIBER_OUTCOME,
  TENANT_WRITE_REFUSAL,
} from '@blog/config';
import { queries } from '@blog/db';
import { errorResult, okResult } from '@blog/utils';
import { toOutcome } from '@blog/utils/to-outcome';
import { resolveNewsletterLinkLocale } from '@web/server/newsletter/newsletter-link-locale/newsletter-link-locale';
import { resolveWritableTenant } from '@web/server/tenant/write-gate/write-gate';
import { MOCK_CONFIRMATION_TOKEN } from '@web/testing/server/newsletter/fixtures';
import { mockNewsletterLinkLocale } from '@web/testing/server/newsletter/newsletter-link-locale/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

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

const MOCK_CONFIRMED_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/confirmed`;
const MOCK_INVALID_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/confirm-invalid`;
const MOCK_FAILED_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/confirm-failed`;
const MOCK_UNAVAILABLE_LOCATION = `${MOCK_TENANT_BASE_URL}/newsletter/confirm-unavailable`;

const toConfirmRequest = (path: string) =>
  new Request(new URL(path, MOCK_TENANT_BASE_URL));

describe(GET, () => {
  let request: Request;

  beforeEach(() => {
    request = toConfirmRequest(
      routes.newsletterConfirm(MOCK_CONFIRMATION_TOKEN),
    );
    confirmSubscriberMock.mockResolvedValue(
      toOutcome(SUBSCRIBER_OUTCOME.CONFIRMED),
    );
    resolveWritableTenantMock.mockResolvedValue(okResult(MOCK_TENANT_ID));
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      mockNewsletterLinkLocale(),
    );
  });

  it('confirms the token and sends them to the confirmed page', async () => {
    const response = await GET(request);

    expect(response.status).toBe(HTTP_STATUS.SEE_OTHER);
    expect(response.headers.get('location')).toBe(MOCK_CONFIRMED_LOCATION);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(confirmSubscriberMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_CONFIRMATION_TOKEN,
    );
    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(null);
  });

  it('sends them to the page in the language the link carries', async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      mockNewsletterLinkLocale({ locale: LOCALE_ISO_CODES.FR }),
    );
    const response = await GET(
      toConfirmRequest(
        routes.newsletterConfirm(MOCK_CONFIRMATION_TOKEN, LOCALE_ISO_CODES.FR),
      ),
    );

    expect(resolveNewsletterLinkLocaleMock).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.FR,
    );
    expect(response.headers.get('location')).toBe(
      `${MOCK_TENANT_BASE_URL}/fr/newsletter/confirmed`,
    );
  });

  it("keeps the site's own default language unprefixed", async () => {
    resolveNewsletterLinkLocaleMock.mockResolvedValue(
      mockNewsletterLinkLocale({
        locale: LOCALE_ISO_CODES.NL,
        defaultLocale: LOCALE_ISO_CODES.NL,
      }),
    );
    const response = await GET(request);

    expect(response.headers.get('location')).toBe(MOCK_CONFIRMED_LOCATION);
  });

  it.each([
    [
      'an already-confirmed token to the confirmed',
      SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED,
      MOCK_CONFIRMED_LOCATION,
    ],
    [
      'an unknown token to the invalid',
      SUBSCRIBER_OUTCOME.NOT_FOUND,
      MOCK_INVALID_LOCATION,
    ],
  ])('sends %s page', async (_case, outcome, location) => {
    confirmSubscriberMock.mockResolvedValue(toOutcome(outcome));

    const response = await GET(request);

    expect(response.headers.get('location')).toBe(location);
  });

  it('sends a link without a token to the invalid page without confirming', async () => {
    const response = await GET(toConfirmRequest('/api/newsletter/confirm'));

    expect(response.headers.get('location')).toBe(MOCK_INVALID_LOCATION);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an inactive tenant to the unavailable',
      TENANT_WRITE_REFUSAL.INACTIVE,
      MOCK_UNAVAILABLE_LOCATION,
    ],
    [
      'an unresolved tenant to the failed',
      TENANT_WRITE_REFUSAL.UNRESOLVED,
      MOCK_FAILED_LOCATION,
    ],
  ])('sends %s page without confirming', async (_case, reason, location) => {
    resolveWritableTenantMock.mockResolvedValue(errorResult(reason));

    const response = await GET(request);

    expect(response.headers.get('location')).toBe(location);
    expect(confirmSubscriberMock).not.toHaveBeenCalled();
  });

  it('sends them to the failed page and logs when confirming throws', async () => {
    confirmSubscriberMock.mockRejectedValue(MOCK_ERROR);

    const response = await GET(request);

    expect(response.headers.get('location')).toBe(MOCK_FAILED_LOCATION);
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'newsletter.confirm_failed',
      { error: MOCK_ERROR },
    );
  });
});
