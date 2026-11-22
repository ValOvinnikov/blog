import { MOCK_MARKETING_SITE_URL } from '@platform/testing/tenants/tenant-identity';
import { pricingPageUrl } from '@shinefold/config';

import { toPricingPageUrl } from './pricing-page-url';

describe(toPricingPageUrl.name, () => {
  it('points at the pricing page on the configured marketing site', () => {
    expect(
      toPricingPageUrl({
        marketingSiteUrl: MOCK_MARKETING_SITE_URL,
        rootDomain: undefined,
      }),
    ).toBe(pricingPageUrl(MOCK_MARKETING_SITE_URL));
  });

  it('is absent when neither the marketing site nor the root domain is configured', () => {
    expect(
      toPricingPageUrl({ marketingSiteUrl: undefined, rootDomain: undefined }),
    ).toBeUndefined();
  });
});
