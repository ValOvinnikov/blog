import { NEXT_NAVIGATION_ERROR, routes } from '@blog/config';
import { errorResult } from '@blog/utils';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';
import { notFound } from 'next/navigation';

import { getHomeBreadcrumb } from './get-home-breadcrumb';

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

describe(getHomeBreadcrumb, () => {
  it('labels the home crumb with the site brand name', async () => {
    await expect(getHomeBreadcrumb()).resolves.toEqual({
      label: MOCK_SITE_SETTINGS.brand.name,
      href: routes.home(),
    });
  });

  it('responds not found when the site settings fail to load', async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce(errorResult(MOCK_ERROR));

    await expect(getHomeBreadcrumb()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
