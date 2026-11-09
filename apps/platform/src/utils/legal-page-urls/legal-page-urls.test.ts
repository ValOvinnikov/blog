import { LEGAL_PAGE_KIND, routes } from '@blog/config';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import { tenantSiteUrl } from '@platform/utils/routes/routes';

import { toLegalPageUrls } from './legal-page-urls';

describe(toLegalPageUrls, () => {
  it('points both pages at the marketing site’s by-kind redirect on the apex', () => {
    const siteUrl = tenantSiteUrl(MOCK_TENANT_ROOT_DOMAIN);

    expect(toLegalPageUrls(MOCK_TENANT_ROOT_DOMAIN)).toEqual({
      terms: `${siteUrl}${routes.legalPageByKind(LEGAL_PAGE_KIND.TERMS)}`,
      privacy: `${siteUrl}${routes.legalPageByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY)}`,
    });
  });

  it('has no pages to link to without a root domain', () => {
    expect(toLegalPageUrls(undefined)).toBeUndefined();
  });
});
