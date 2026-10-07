import { LOCALE_ISO_CODES } from '@blog/config';
import { service } from '@blog/service';
import { permanentRedirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { redirectMovedLandingPage } from './redirect-moved-landing-page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@blog/service', () => ({
  service: { pages: { landing: { v1: { getRedirect: vi.fn() } } } },
}));

vi.mock('@web/utils/logger/logger');

vi.mock('@web/i18n/navigation');

const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const MISSING = { ok: true, data: undefined } as const;

describe(redirectMovedLandingPage, () => {
  beforeEach(() => {
    getRedirectMock.mockResolvedValue(MISSING);
  });

  it('redirects permanently to the destination in the request language', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });
    getRedirectMock.mockResolvedValueOnce({ ok: true, data: '/modules/faq' });

    await expect(redirectMovedLandingPage(MISSING, 'old-faq')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: '/modules/faq',
      locale: LOCALE_ISO_CODES.NL,
    });
  });

  it('looks the redirect up by path segments with the tenant context', async () => {
    await redirectMovedLandingPage(MISSING, 'old/faq');

    expect(getRedirectMock).toHaveBeenCalledWith(
      ['old', 'faq'],
      DEFAULT_TENANT_SANITY_CONTEXT,
    );
  });

  it('does nothing when no redirect matches', async () => {
    await redirectMovedLandingPage(MISSING, 'unknown');

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and does not redirect when the lookup fails', async () => {
    getRedirectMock.mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await redirectMovedLandingPage(MISSING, 'old-faq');

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'landing_redirect.fetch_failed',
      expect.objectContaining({ path: 'old-faq' }),
    );
  });

  it('does not look up a redirect when the page exists', async () => {
    await redirectMovedLandingPage({ ok: true, data: { title: 'FAQ' } }, 'faq');

    expect(getRedirectMock).not.toHaveBeenCalled();
  });

  it('does not look up a redirect when the page fetch failed', async () => {
    await redirectMovedLandingPage(
      { ok: false, error: new Error('boom') },
      'faq',
    );

    expect(getRedirectMock).not.toHaveBeenCalled();
  });
});
