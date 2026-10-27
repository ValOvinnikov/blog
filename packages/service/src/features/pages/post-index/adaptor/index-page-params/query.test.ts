import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  mockIndexPageDocument,
  mockListModuleRefs,
} from '@blog/service/testing/pages/fixtures';
import { evaluateGroqInLocale } from '@blog/service/testing/shared/groq';
import { faker } from '@faker-js/faker';

import { indexPageParamsQuery } from './query';

faker.seed(6021);

const { EN } = LOCALE_ISO_CODES;
const MOCK_PUBLISHED_AT = '2026-01-01T00:00:00Z';
const MOCK_SCHEDULED_AT = '2999-01-01T00:00:00Z';

function mockPost(publishedAt: string) {
  return {
    _id: faker.string.uuid(),
    _type: 'page_post',
    language: EN,
    publishedAt,
  };
}

describe('indexPageParamsQuery', () => {
  it.each([
    ['its total post count and module ids', mockListModuleRefs()],
    ['no modules', null],
  ])('parses a blog page with %s', (_, moduleRefs) => {
    const raw = { blogPosts: { total: 12 }, moduleRefs };

    expect(() => indexPageParamsQuery.parse(raw)).not.toThrow();
  });

  it('counts only published posts in the total', async () => {
    const dataset = [
      mockIndexPageDocument({
        _type: 'page_postIndex',
        heading: faker.lorem.words(2),
        language: EN,
      }),
      mockPost(MOCK_PUBLISHED_AT),
      mockPost(MOCK_PUBLISHED_AT),
      mockPost(MOCK_SCHEDULED_AT),
    ];

    expect(
      await evaluateGroqInLocale(indexPageParamsQuery.query, dataset, EN),
    ).toMatchObject({ blogPosts: { total: 2 } });
  });
});
