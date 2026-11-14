import { LOCALE_ISO_CODES, routes } from '@blog/config';
import { faker } from '@faker-js/faker';

import {
  buildNextBlogIndexPage,
  buildNextPagePaths,
} from './build-next-page-paths';

faker.seed(7385);

const { EN, NL } = LOCALE_ISO_CODES;
const MOCK_SLUG = faker.lorem.slug();

describe(buildNextPagePaths, () => {
  it('points at page 2 for a listing with no pagination', () => {
    expect(
      buildNextPagePaths([{ slug: MOCK_SLUG, language: EN }], [], routes.tag),
    ).toEqual([{ language: EN, path: `/tags/${MOCK_SLUG}/page/2` }]);
  });

  it('points past the last page of the same slug and language only', () => {
    expect(
      buildNextPagePaths(
        [{ slug: MOCK_SLUG, language: EN }],
        [
          { slug: MOCK_SLUG, language: EN, page: '2' },
          { slug: MOCK_SLUG, language: EN, page: '3' },
          { slug: MOCK_SLUG, language: NL, page: '7' },
        ],
        routes.topic,
      ),
    ).toEqual([{ language: EN, path: `/topics/${MOCK_SLUG}/page/4` }]);
  });
});

describe(buildNextBlogIndexPage, () => {
  it.each([
    { pages: [], expected: 2 },
    { pages: [{ page: '2' }, { page: '5' }], expected: 6 },
  ])('returns $expected after pages $pages', ({ pages, expected }) => {
    expect(buildNextBlogIndexPage(pages)).toBe(expected);
  });
});
