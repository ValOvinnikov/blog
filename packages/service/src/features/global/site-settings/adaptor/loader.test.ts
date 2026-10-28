import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getSiteSettings } from './loader';
import { siteSettingsQuery } from './query';
import type { TRawSiteSettings } from './transformer';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015104);

const MOCK_BRAND_NAME = faker.company.name();
const MOCK_LOGO_ALT = faker.lorem.words(2);
const MOCK_CURRENCY = 'EUR';
const MOCK_TENANT = mockTenant();

function mockSettingsWithBrand(
  brand: Partial<TRawSiteSettings['brand']> = {},
): TRawSiteSettings {
  return mockRawSiteSettings({
    brand: {
      name: MOCK_BRAND_NAME,
      logo: mockRawSanityImage(MOCK_LOGO_ALT),
      ...brand,
    },
  });
}

describe(getSiteSettings, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockSettingsWithBrand());
  });

  it('throws when site settings document does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getSiteSettings(MOCK_TENANT)).rejects.toThrow();
  });

  it('maps the brand name', async () => {
    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.name).toBe(MOCK_BRAND_NAME);
  });

  it('leaves logo undefined when no logo is uploaded', async () => {
    mockRun.mockResolvedValueOnce(mockSettingsWithBrand({ logo: null }));

    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.logo).toBeUndefined();
  });

  it('maps an uploaded logo to an image view-model', async () => {
    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.logo).toEqual(mockSanityImageView(MOCK_LOGO_ALT));
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
