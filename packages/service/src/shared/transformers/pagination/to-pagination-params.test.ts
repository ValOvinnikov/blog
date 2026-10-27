import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_SLUG } from '@blog/service/testing/entities/fixtures';
import { faker } from '@faker-js/faker';

import { toPaginationParams } from './to-pagination-params';

faker.seed(6105);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_PAGE_SIZE = 9;
const MOCK_SINGLE_PAGE_SLUG = faker.lorem.slug();

describe(toPaginationParams, () => {
  it('returns pages 2..totalPages for each page with a full corpus', () => {
    const params = toPaginationParams([
      {
        slug: MOCK_TAG_SLUG,
        language: EN,
        pageSize: MOCK_PAGE_SIZE,
        postCount: 20,
      },
      {
        slug: MOCK_SINGLE_PAGE_SLUG,
        language: EN,
        pageSize: MOCK_PAGE_SIZE,
        postCount: MOCK_PAGE_SIZE,
      },
    ]);

    expect(params).toEqual([
      { slug: MOCK_TAG_SLUG, language: EN, page: '2' },
      { slug: MOCK_TAG_SLUG, language: EN, page: '3' },
    ]);
  });

  it('keeps each page in its own language', () => {
    const params = toPaginationParams([
      {
        slug: MOCK_TAG_SLUG,
        language: NL,
        pageSize: MOCK_PAGE_SIZE,
        postCount: 10,
      },
    ]);

    expect(params).toEqual([{ slug: MOCK_TAG_SLUG, language: NL, page: '2' }]);
  });

  it.each([
    { scenario: 'has zero posts', pageSize: MOCK_PAGE_SIZE, postCount: 0 },
    { scenario: 'fits on one page', pageSize: MOCK_PAGE_SIZE, postCount: 5 },
    { scenario: 'has no list module', pageSize: null, postCount: 20 },
  ])('contributes no entries for a page that $scenario', (page) => {
    const { pageSize, postCount } = page;

    const params = toPaginationParams([
      { slug: MOCK_TAG_SLUG, language: EN, pageSize, postCount },
    ]);

    expect(params).toEqual([]);
  });

  it('returns an empty array when there are no pages', () => {
    expect(toPaginationParams([])).toEqual([]);
  });
});
