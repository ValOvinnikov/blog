import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  MOCK_TAG_ID,
  MOCK_TAG_SLUG,
} from '@blog/service/testing/entities/fixtures';
import {
  mockListModuleRefs,
  mockSlugPageDocument,
} from '@blog/service/testing/pages/fixtures';
import { mockReference } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import { MOCK_TRANSLATED_POST_DOCUMENTS } from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { tagPaginationParamsQuery } from './query';

faker.seed(601505);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_EN_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_EMPTY_SLUG = faker.lorem.slug();

describe('tagPaginationParamsQuery', () => {
  it.each([
    [
      'slug with its module ids and a post count',
      [{ slug: MOCK_TAG_SLUG, moduleRefs: mockListModuleRefs(), postCount: 5 }],
    ],
    [
      'with no modules and zero posts',
      [{ slug: MOCK_EMPTY_SLUG, moduleRefs: null, postCount: 0 }],
    ],
  ])('parses a tag page %s', (_, raw) => {
    expect(() => tagPaginationParamsQuery.parse(raw)).not.toThrow();
  });

  it('counts the published posts on the tag in the tag page language', async () => {
    const dataset = [
      ...MOCK_TRANSLATED_POST_DOCUMENTS,
      mockSlugPageDocument({
        _type: 'page_tag',
        tag: mockReference(MOCK_TAG_ID),
        slug: MOCK_EN_SLUG,
        language: EN,
      }),
      mockSlugPageDocument({
        _type: 'page_tag',
        tag: mockReference(MOCK_TAG_ID),
        slug: MOCK_NL_SLUG,
        language: NL,
      }),
    ];

    const result = await evaluateGroqExpression(
      tagPaginationParamsQuery.query,
      dataset,
      null,
      { locales: [EN, NL] },
    );

    expect(result).toMatchObject([
      { slug: MOCK_EN_SLUG, language: EN, postCount: 3 },
      { slug: MOCK_NL_SLUG, language: NL, postCount: 1 },
    ]);
  });
});
