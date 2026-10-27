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
import { faker } from '@faker-js/faker';

import { getSiteSettings } from './loader';
import { siteSettingsQuery } from './query';
import type { TRawSiteSettings } from './transformer';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015104);

const MOCK_BRAND_NAME = faker.company.name();
const MOCK_FIRST_ITEM = faker.string.alpha(8);
const MOCK_SECOND_ITEM = faker.string.alpha(8);
const MOCK_LOGO_ALT = faker.lorem.words(2);
const MOCK_CURRENCY = 'EUR';
const MOCK_TENANT = mockTenant();

function mockTaglineItems(...texts: (string | null)[]) {
  return texts.map((text) => ({ _key: faker.string.uuid(), text }));
}

function mockSettingsWithBrand(
  brand: Partial<TRawSiteSettings['brand']> = {},
): TRawSiteSettings {
  return mockRawSiteSettings({
    brand: {
      name: MOCK_BRAND_NAME,
      tagline: null,
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

  it.each([
    [BRAND_TAGLINE_SEPARATORS.DOT, '·'],
    [BRAND_TAGLINE_SEPARATORS.PIPE, '|'],
    [BRAND_TAGLINE_SEPARATORS.BULLET, '•'],
    [BRAND_TAGLINE_SEPARATORS.SLASH, '/'],
  ])(
    'joins tagline items with the %s separator',
    async (separator, character) => {
      mockRun.mockResolvedValueOnce(
        mockSettingsWithBrand({
          tagline: {
            items: mockTaglineItems(MOCK_FIRST_ITEM, MOCK_SECOND_ITEM),
            separator,
          },
        }),
      );

      const result = await getSiteSettings(MOCK_TENANT);

      expect(result.brand.tagline).toBe(
        `${MOCK_FIRST_ITEM} ${character} ${MOCK_SECOND_ITEM}`,
      );
    },
  );

  it('joins a single tagline item with no separator character', async () => {
    mockRun.mockResolvedValueOnce(
      mockSettingsWithBrand({
        tagline: {
          items: mockTaglineItems(MOCK_SECOND_ITEM),
          separator: BRAND_TAGLINE_SEPARATORS.DOT,
        },
      }),
    );

    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.tagline).toBe(MOCK_SECOND_ITEM);
  });

  it('skips tagline items with no text in either language', async () => {
    mockRun.mockResolvedValueOnce(
      mockSettingsWithBrand({
        tagline: {
          items: mockTaglineItems(MOCK_FIRST_ITEM, null, MOCK_SECOND_ITEM),
          separator: BRAND_TAGLINE_SEPARATORS.DOT,
        },
      }),
    );

    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.tagline).toBe(
      `${MOCK_FIRST_ITEM} · ${MOCK_SECOND_ITEM}`,
    );
  });

  it.each([
    ['a missing tagline', null],
    [
      'an empty tagline items list',
      { items: [], separator: BRAND_TAGLINE_SEPARATORS.DOT },
    ],
  ])('maps %s to undefined', async (_, tagline) => {
    mockRun.mockResolvedValueOnce(mockSettingsWithBrand({ tagline }));

    const result = await getSiteSettings(MOCK_TENANT);

    expect(result.brand.tagline).toBeUndefined();
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
