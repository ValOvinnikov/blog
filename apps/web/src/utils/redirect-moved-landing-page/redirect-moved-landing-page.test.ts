import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { service } from '@blog/service';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
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

faker.seed(6012);

const MOCK_OLD_PATH = faker.lorem.slug(1);
const MOCK_NESTED_PATH_SEGMENTS = [faker.lorem.slug(1), faker.lorem.slug(1)];
const MOCK_DESTINATION = `/${faker.lorem.slug(2)}`;

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
        okResult({ destination: MOCK_DESTINATION, status }),
      );

      await expect(
        redirectMovedLandingPage(MISSING, MOCK_OLD_PATH),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

      expect(redirectsWith).toHaveBeenCalledWith({
        href: MOCK_DESTINATION,
        locale: LOCALE_ISO_CODES.NL,
      });
      expect(skips).not.toHaveBeenCalled();
    },
  );

  it('looks the redirect up by path segments for the tenant', async () => {
    await redirectMovedLandingPage(
      MISSING,
      MOCK_NESTED_PATH_SEGMENTS.join('/'),
    );

    expect(getRedirectMock).toHaveBeenCalledWith(
      MOCK_NESTED_PATH_SEGMENTS,
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('does nothing when no redirect matches', async () => {
    await redirectMovedLandingPage(MISSING, MOCK_OLD_PATH);

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and does not redirect when the lookup fails', async () => {
    getRedirectMock.mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await redirectMovedLandingPage(MISSING, MOCK_OLD_PATH);

    expect(permanentRedirect).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('landing_redirect.fetch_failed', {
      path: MOCK_OLD_PATH,
      error: MOCK_ERROR,
    });
  });

  it.each([
    { case: 'the page exists', page: okResult({}) },
    { case: 'the page fetch failed', page: errorResult(MOCK_ERROR) },
  ])('does not look up a redirect when $case', async ({ page }) => {
    await redirectMovedLandingPage(page, MOCK_OLD_PATH);

    expect(getRedirectMock).not.toHaveBeenCalled();
  });
});
