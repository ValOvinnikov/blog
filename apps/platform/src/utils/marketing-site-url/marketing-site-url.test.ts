import { faker } from '@faker-js/faker';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import { tenantSiteUrl } from '@platform/utils/routes/routes';

import { toMarketingSiteUrl } from './marketing-site-url';

const MOCK_MARKETING_SITE_URL = faker.internet.url({ appendSlash: false });

describe(toMarketingSiteUrl, () => {
  it('uses the configured marketing site URL', () => {
    expect(
      toMarketingSiteUrl({
        marketingSiteUrl: MOCK_MARKETING_SITE_URL,
        rootDomain: MOCK_TENANT_ROOT_DOMAIN,
      }),
    ).toBe(MOCK_MARKETING_SITE_URL);
  });

  it('falls back to the root domain’s apex', () => {
    expect(
      toMarketingSiteUrl({
        marketingSiteUrl: undefined,
        rootDomain: MOCK_TENANT_ROOT_DOMAIN,
      }),
    ).toBe(tenantSiteUrl(MOCK_TENANT_ROOT_DOMAIN));
  });

  it('has no address without either', () => {
    expect(
      toMarketingSiteUrl({
        marketingSiteUrl: undefined,
        rootDomain: undefined,
      }),
    ).toBeUndefined();
  });
});
