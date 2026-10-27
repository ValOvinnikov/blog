import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_PAGE_POST_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPostParams } from './loader';
import { postParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6017);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_EN_PUBLISHED_AT = '2026-01-01T00:00:00Z';
const MOCK_NL_PUBLISHED_AT = '2026-02-01T00:00:00Z';
const tenant = mockTenant();

describe(getPostParams, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the queried post entries', async () => {
    const entries = [
      {
        slug: faker.lorem.slug(),
        language: EN,
        publishedAt: MOCK_EN_PUBLISHED_AT,
      },
      {
        slug: faker.lorem.slug(),
        language: NL,
        publishedAt: MOCK_NL_PUBLISHED_AT,
      },
    ];
    mockRun.mockResolvedValueOnce(entries);

    const params = await getPostParams(tenant, [EN, NL]);

    expect(params).toEqual(entries);
  });

  it('returns an empty array when there are no posts', async () => {
    const params = await getPostParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes its tags to it', async () => {
    await getPostParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(postParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_POST_CACHE_TAG],
      },
    });
  });
});
