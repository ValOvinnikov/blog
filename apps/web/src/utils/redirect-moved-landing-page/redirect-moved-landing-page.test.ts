import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { permanentRedirect, redirect } from '@web/i18n/navigation';
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

vi.mock('@web/i18n/navigation');

const getRedirectMock = vi.mocked(service.pages.landing.v1.getRedirect);

const OLD_FAQ_PATH = 'old-faq';
const FAQ_DESTINATION = '/modules/faq';

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
    getRedirectMock.mockResolvedValueOnce({
      ok: true,
      data: { destination: FAQ_DESTINATION, status: REDIRECT_STATUS.PERMANENT },
    });

    await expect(
      redirectMovedLandingPage(MISSING, OLD_FAQ_PATH),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(permanentRedirect).toHaveBeenCalledWith({
      href: FAQ_DESTINATION,
      locale: LOCALE_ISO_CODES.NL,
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects temporarily when the redirect is temporary', async () => {
    vi.mocked(getRequestContext).mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      locale: LOCALE_ISO_CODES.NL,
    });
    getRedirectMock.mockResolvedValueOnce({
      ok: true,
      data: { destination: '/offers', status: REDIRECT_STATUS.TEMPORARY },
    });

    await expect(redirectMovedLandingPage(MISSING, 'sale')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith({
      href: '/offers',
      locale: LOCALE_ISO_CODES.NL,
    });
    expect(permanentRedirect).not.toHaveBeenCalled();
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

    await redirectMovedLandingPage(MISSING, OLD_FAQ_PATH);

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      'landing_redirect.fetch_failed',
      expect.objectContaining({ path: OLD_FAQ_PATH }),
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
