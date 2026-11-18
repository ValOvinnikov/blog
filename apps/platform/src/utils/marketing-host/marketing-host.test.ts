import {
  MOCK_MARKETING_HOST,
  MOCK_MARKETING_SITE_URL,
} from '@platform/testing/tenants/fixtures';

import { toMarketingHost } from './marketing-host';

describe(toMarketingHost, () => {
  it('is the hostname of the marketing site URL', () => {
    expect(toMarketingHost(MOCK_MARKETING_SITE_URL)).toBe(MOCK_MARKETING_HOST);
  });

  it.each([
    ['unset', undefined],
    ['empty', ''],
  ])('is undefined when the URL is %s', (_, marketingSiteUrl) => {
    expect(toMarketingHost(marketingSiteUrl)).toBeUndefined();
  });
});
