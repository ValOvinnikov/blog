import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getSiteSettings } from './loader';
import { siteSettingsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const MOCK_CURRENCY = 'EUR';
const MOCK_TENANT = mockTenant();

describe(getSiteSettings, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawSiteSettings());
  });

  it('throws when site settings document does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getSiteSettings(MOCK_TENANT)).rejects.toThrow();
  });

  it('returns the currency code', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawSiteSettings({ currency: MOCK_CURRENCY }),
    );

    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.currency).toBe(MOCK_CURRENCY);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getSiteSettings(MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(siteSettingsQuery, {
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('site-settings')],
      },
    });
  });
});
