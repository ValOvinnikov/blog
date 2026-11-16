import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { MOCK_TOPIC_SLUG } from '@shinefold/service/testing/entities/fixtures';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import { mockSlugPageDocument } from '@shinefold/service/testing/pages/fixtures';
import { MOCK_PAGE_TOPIC_CACHE_TAG } from '@shinefold/service/testing/sanity/query/cache-tags';
import { evaluateGroqExpression } from '@shinefold/service/testing/shared/groq';
import { mockTenant } from '@shinefold/service/testing/tenant';

import { getTopicParams } from './loader';
import { topicParamsQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(601604);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_FR_SLUG = faker.lorem.slug();
const MOCK_ENTRIES = [
  { slug: MOCK_TOPIC_SLUG, language: EN },
  { slug: MOCK_NL_SLUG, language: NL },
];
const tenant = mockTenant();

describe(getTopicParams, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns the slug and language entries', async () => {
    mockRun.mockResolvedValueOnce(MOCK_ENTRIES);

    const params = await getTopicParams(tenant, [EN, NL]);

    expect(params).toEqual(MOCK_ENTRIES);
  });

  it('returns an empty array when there are no topic pages', async () => {
    const params = await getTopicParams(tenant, [EN]);

    expect(params).toEqual([]);
  });

  it('queries the live languages for the tenant and scopes the tags to it', async () => {
    await getTopicParams(tenant, [EN, NL]);

    expect(mockRun).toHaveBeenCalledWith(topicParamsQuery, {
      parameters: { locales: [EN, NL] },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_TOPIC_CACHE_TAG],
      },
    });
  });
});

describe('topicParamsQuery', () => {
  it('restricts to the live languages', async () => {
    const dataset = [
      mockSlugPageDocument({
        _type: 'page_topic',
        slug: MOCK_TOPIC_SLUG,
        language: EN,
      }),
      mockSlugPageDocument({
        _type: 'page_topic',
        slug: MOCK_NL_SLUG,
        language: NL,
      }),
      mockSlugPageDocument({
        _type: 'page_topic',
        slug: MOCK_FR_SLUG,
        language: FR,
      }),
    ];

    const result = await evaluateGroqExpression(
      topicParamsQuery.query,
      dataset,
      null,
      { locales: [EN, NL] },
    );

    expect(result).toEqual(MOCK_ENTRIES);
  });
});
