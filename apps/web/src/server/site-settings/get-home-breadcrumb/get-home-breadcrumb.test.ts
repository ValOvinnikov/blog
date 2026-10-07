import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { notFound } from 'next/navigation';

import { getHomeBreadcrumb } from './get-home-breadcrumb';

vi.mock('@web/server/site-settings/get-site-settings/get-site-settings');

describe(getHomeBreadcrumb.name, () => {
  it('labels the home crumb with the site brand name', async () => {
    await expect(getHomeBreadcrumb()).resolves.toEqual({
      label: 'Northwind Journal',
      href: '/',
    });
  });

  it('calls notFound() when the site settings fail to load', async () => {
    vi.mocked(getSiteSettings).mockResolvedValueOnce({
      ok: false,
      error: new Error('boom'),
    });

    await expect(getHomeBreadcrumb()).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
