import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { postParamsQuery } from './query';

faker.seed(6018);

const { EN, NL, FR } = LOCALE_ISO_CODES;
const MOCK_PUBLISHED_AT = '2026-01-01T00:00:00Z';
const MOCK_SECOND_PUBLISHED_AT = '2026-01-02T00:00:00Z';
const MOCK_THIRD_PUBLISHED_AT = '2026-01-03T00:00:00Z';
const MOCK_SCHEDULED_AT = '2999-01-01T00:00:00Z';
const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_FR_SLUG = faker.lorem.slug();
const MOCK_SCHEDULED_SLUG = faker.lorem.slug();

function post(id: string, language: string, publishedAt: string) {
  return {
    _id: id,
    _type: 'page_post',
    slug: { current: id },
    language,
    publishedAt,
  };
}

describe('postParamsQuery', () => {
  it('lists the published posts in the live languages', async () => {
    const dataset = [
      post(MOCK_EN_SLUG, EN, MOCK_PUBLISHED_AT),
      post(MOCK_NL_SLUG, NL, MOCK_SECOND_PUBLISHED_AT),
      post(MOCK_FR_SLUG, FR, MOCK_THIRD_PUBLISHED_AT),
      post(MOCK_SCHEDULED_SLUG, EN, MOCK_SCHEDULED_AT),
    ];

    expect(
      await evaluateGroqExpression(postParamsQuery.query, dataset, null, {
        locales: [EN, NL],
      }),
    ).toEqual([
      { slug: MOCK_EN_SLUG, language: EN, publishedAt: MOCK_PUBLISHED_AT },
      {
        slug: MOCK_NL_SLUG,
        language: NL,
        publishedAt: MOCK_SECOND_PUBLISHED_AT,
      },
    ]);
  });
});
