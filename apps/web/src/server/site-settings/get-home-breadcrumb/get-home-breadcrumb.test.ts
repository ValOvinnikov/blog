import { NEXT_NAVIGATION_ERROR, routes } from '@blog/config';
import { getBrandName } from '@web/server/site-config/get-brand-name/get-brand-name';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_NAME,
} from '@web/testing/shared/tenant/fixtures';
import { notFound } from 'next/navigation';

import { getHomeBreadcrumb } from './get-home-breadcrumb';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/server/site-config/get-brand-name/get-brand-name');

describe(getHomeBreadcrumb, () => {
  it('labels the home crumb with the brand name', async () => {
    await expect(getHomeBreadcrumb()).resolves.toEqual({
      label: MOCK_TENANT_NAME,
      href: routes.home(),
    });
  });

  it("reads the brand name for the request context's tenant", async () => {
    await getHomeBreadcrumb();

    expect(vi.mocked(getBrandName)).toHaveBeenCalledWith(MOCK_REQUEST_CONTEXT);
  });

  it('responds not found without a brand name', async () => {
    vi.mocked(getBrandName).mockResolvedValueOnce(undefined);

    await expect(getHomeBreadcrumb()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
