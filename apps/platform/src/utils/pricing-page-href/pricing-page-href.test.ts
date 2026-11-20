import { MOCK_MARKETING_SITE_URL } from '@platform/testing/tenants/tenant-identity';
import { pricingPageUrl } from '@shinefold/config';

import { pricingPageHref } from './pricing-page-href';

describe(pricingPageHref.name, () => {
  it('points at the pricing page on the configured marketing site', () => {
    expect(
      pricingPageHref({
        marketingSiteUrl: MOCK_MARKETING_SITE_URL,
        rootDomain: undefined,
      }),
    ).toBe(pricingPageUrl(MOCK_MARKETING_SITE_URL));
  });

  it('is absent when neither the marketing site nor the root domain is configured', () => {
    expect(
      pricingPageHref({ marketingSiteUrl: undefined, rootDomain: undefined }),
    ).toBeUndefined();
  });
});
