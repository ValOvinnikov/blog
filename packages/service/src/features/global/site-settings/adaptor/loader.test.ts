import {
  BRAND_TAGLINE_SEPARATORS,
  SANITY_CONTENT_REVALIDATE_SECONDS,
} from '@blog/config';
import { mockRawSiteSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getSiteSettings } from './loader';
import { siteSettingsQuery } from './query';
import type { TRawSiteSettings } from './transformer';

vi.mock('@blog/service/sanity/query/query');

const BRAND_NAME = 'Awesome Blog';
const BUILD_ITEM = 'build 2026.07';
const ONLINE_ITEM = 'online';
const LOGO_ALT = 'Logo';
const DOT_TAGLINE = 'build 2026.07 · online';

const tenant = mockTenant();

function taglineItems(...texts: (string | null)[]) {
  return texts.map((text, index) => ({
    _key: `item-${String(index + 1)}`,
    text,
  }));
}

function mockSettingsWithBrand(
  brand: Partial<TRawSiteSettings['brand']> = {},
): TRawSiteSettings {
  return mockRawSiteSettings({
    brand: {
      name: BRAND_NAME,
      tagline: null,
      logo: mockRawSanityImage(LOGO_ALT),
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

    await expect(getSiteSettings(tenant)).rejects.toThrow();
  });

  it('maps the brand name', async () => {
    const result = await getSiteSettings(tenant);

    expect(result.brand.name).toBe(BRAND_NAME);
  });

  it.each([
    { separator: BRAND_TAGLINE_SEPARATORS.DOT, tagline: DOT_TAGLINE },
    {
      separator: BRAND_TAGLINE_SEPARATORS.PIPE,
      tagline: 'build 2026.07 | online',
    },
    {
      separator: BRAND_TAGLINE_SEPARATORS.BULLET,
      tagline: 'build 2026.07 • online',
    },
    {
      separator: BRAND_TAGLINE_SEPARATORS.SLASH,
      tagline: 'build 2026.07 / online',
    },
  ])(
    'joins tagline items with the $separator separator',
    async ({ separator, tagline }) => {
      mockRun.mockResolvedValueOnce(
        mockSettingsWithBrand({
          tagline: { items: taglineItems(BUILD_ITEM, ONLINE_ITEM), separator },
        }),
      );

      const result = await getSiteSettings(tenant);

      expect(result.brand.tagline).toBe(tagline);
    },
  );

  it('joins a single tagline item with no separator character', async () => {
    mockRun.mockResolvedValueOnce(
      mockSettingsWithBrand({
        tagline: {
          items: taglineItems(ONLINE_ITEM),
          separator: BRAND_TAGLINE_SEPARATORS.DOT,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe(ONLINE_ITEM);
  });

  it('skips tagline items with no text in either language', async () => {
    mockRun.mockResolvedValueOnce(
      mockSettingsWithBrand({
        tagline: {
          items: taglineItems(BUILD_ITEM, null, ONLINE_ITEM),
          separator: BRAND_TAGLINE_SEPARATORS.DOT,
        },
      }),
    );

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBe(DOT_TAGLINE);
  });

  it.each([
    ['a missing tagline', null],
    [
      'an empty tagline items list',
      { items: [], separator: BRAND_TAGLINE_SEPARATORS.DOT },
    ],
  ])('maps %s to undefined', async (_, tagline) => {
    mockRun.mockResolvedValueOnce(mockSettingsWithBrand({ tagline }));

    const result = await getSiteSettings(tenant);

    expect(result.brand.tagline).toBeUndefined();
  });

  it('leaves logo undefined when no logo is uploaded', async () => {
    mockRun.mockResolvedValueOnce(mockSettingsWithBrand({ logo: null }));

    const result = await getSiteSettings(tenant);

    expect(result.brand.logo).toBeUndefined();
  });

  it('maps an uploaded logo to an image view-model', async () => {
    const result = await getSiteSettings(tenant);

    expect(result.brand.logo).toEqual(mockSanityImageView(LOGO_ALT));
  });

  it('returns the currency code', async () => {
    mockRun.mockResolvedValueOnce(mockRawSiteSettings({ currency: 'EUR' }));

    const result = await getSiteSettings(tenant);

    expect(result.currency).toBe('EUR');
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getSiteSettings(tenant);

    expect(mockRun).toHaveBeenCalledWith(siteSettingsQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('site-settings')],
      },
    });
  });
});
