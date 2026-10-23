import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_SLUG } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_PAGE_TAG_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTagParams } from './loader';
import { tagParamsQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const { EN, NL, FR } = LOCALE_ISO_CODES;
const NL_SLUG = 'typescript-nl';
const ENTRIES = [
  { slug: MOCK_TAG_SLUG, language: EN },
  { slug: NL_SLUG, language: NL },
];
const tenant = mockTenant();

describe(getTagParams, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the slug and language entries', async () => {
    mockRun.mockResolvedValueOnce(ENTRIES);

    const params = await getTagParams(tenant, [EN, NL]);

    expect(params).toEqual(ENTRIES);
  });

  it('returns an empty array when there are no tag pages', async () => {
    const params = await getTagParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes the tags to it', async () => {
    await getTagParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(tagParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_TAG_CACHE_TAG],
      },
    });
  });
});

describe('tagParamsQuery', () => {
  it('restricts to the live languages', async () => {
    const dataset = [
      {
        _id: 'a',
        _type: 'page_tag',
        slug: { current: MOCK_TAG_SLUG },
        language: EN,
      },
      {
        _id: 'b',
        _type: 'page_tag',
        slug: { current: NL_SLUG },
        language: NL,
      },
      { _id: 'c', _type: 'page_tag', slug: { current: 'fr' }, language: FR },
    ];

    expect(
      await evaluateGroqExpression(tagParamsQuery.query, dataset, null, {
        locales: [EN, NL],
      }),
    ).toEqual(ENTRIES);
  });
});
