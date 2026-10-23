import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { permanentRedirect, redirect } from '@web/i18n/navigation';
import { getRequestContext } from '@web/server/request-context/request-context';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_SANITY_CONTEXT,
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

const MISSING = okResult();

describe(redirectMovedLandingPage, () => {
  beforeEach(() => {
    getRedirectMock.mockResolvedValue(MISSING);
  });

  it.each([
    {
      status: REDIRECT_STATUS.PERMANENT,
      redirectsWith: permanentRedirect,
      skips: redirect,
    },
    {
      status: REDIRECT_STATUS.TEMPORARY,
      redirectsWith: redirect,
      skips: permanentRedirect,
    },
  ])(
    'follows a $status redirect to the destination in the request language',
    async ({ status, redirectsWith, skips }) => {
      vi.mocked(getRequestContext).mockResolvedValue({
        ...MOCK_REQUEST_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      });
      getRedirectMock.mockResolvedValueOnce(
        okResult({ destination: FAQ_DESTINATION, status }),
      );

      await expect(
        redirectMovedLandingPage(MISSING, OLD_FAQ_PATH),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

      expect(redirectsWith).toHaveBeenCalledWith({
        href: FAQ_DESTINATION,
        locale: LOCALE_ISO_CODES.NL,
      });
      expect(skips).not.toHaveBeenCalled();
    },
  );

  it('looks the redirect up by path segments with the tenant context', async () => {
    await redirectMovedLandingPage(MISSING, 'old/faq');

    expect(getRedirectMock).toHaveBeenCalledWith(
      ['old', 'faq'],
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('does nothing when no redirect matches', async () => {
    await redirectMovedLandingPage(MISSING, 'unknown');

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and does not redirect when the lookup fails', async () => {
    getRedirectMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await redirectMovedLandingPage(MISSING, OLD_FAQ_PATH);

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('landing_redirect.fetch_failed', {
      path: OLD_FAQ_PATH,
      error: MOCK_ERROR,
    });
  });

  it.each([
    { case: 'the page exists', page: okResult({}) },
    { case: 'the page fetch failed', page: errorResult(MOCK_ERROR) },
  ])('does not look up a redirect when $case', async ({ page }) => {
    await redirectMovedLandingPage(page, OLD_FAQ_PATH);

    expect(getRedirectMock).not.toHaveBeenCalled();
  });
});
