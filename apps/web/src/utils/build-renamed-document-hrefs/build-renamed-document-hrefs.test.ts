import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { mockTenantPageLists } from '@web/testing/shared/tenant-page-lists/fixtures';

import { buildRenamedDocumentHrefs } from './build-renamed-document-hrefs';

faker.seed(7409);

const { EN, NL } = LOCALE_ISO_CODES;
const [MOCK_SLUG, MOCK_PREVIOUS_SLUG, MOCK_OTHER_SLUG] =
  faker.helpers.uniqueArray(faker.lorem.slug, 3) as [string, string, string];
const MOCK_RENAMED = { slug: MOCK_SLUG, previousSlug: MOCK_PREVIOUS_SLUG };
const MOCK_PAGE_TWO = '2';
const MOCK_PAGE_THREE = '3';

describe(buildRenamedDocumentHrefs, () => {
  it.each([
    { case: 'no document was renamed', renamed: undefined },
    {
      case: 'a renamed landing page',
      renamed: { ...MOCK_RENAMED, type: 'page_landing' },
    },
  ])('returns nothing for $case', ({ renamed }) => {
    expect(buildRenamedDocumentHrefs(renamed, mockTenantPageLists())).toEqual(
      [],
    );
  });

  it.each([
    { type: 'page_post', href: `/blog/${MOCK_PREVIOUS_SLUG}` },
    { type: 'page_privacyDocument', href: `/privacy/${MOCK_PREVIOUS_SLUG}` },
    { type: 'page_legalDocument', href: `/legal/${MOCK_PREVIOUS_SLUG}` },
  ])('returns the old address of a renamed $type', ({ type, href }) => {
    const hrefs = buildRenamedDocumentHrefs(
      { ...MOCK_RENAMED, type },
      mockTenantPageLists(),
    );

    expect(hrefs).toEqual([href]);
  });

  it.each([
    { type: 'page_topic', root: 'topics', list: 'topicPages' },
    { type: 'page_tag', root: 'tags', list: 'tagPages' },
  ])(
    'returns the old address of a renamed $type with its pagination',
    ({ type, root, list }) => {
      const hrefs = buildRenamedDocumentHrefs(
        { ...MOCK_RENAMED, type },
        mockTenantPageLists({
          [list]: [
            { slug: MOCK_SLUG, language: EN, page: MOCK_PAGE_TWO },
            { slug: MOCK_SLUG, language: NL, page: MOCK_PAGE_THREE },
            { slug: MOCK_OTHER_SLUG, language: EN, page: '7' },
          ],
        }),
      );

      expect(hrefs).toEqual([
        `/${root}/${MOCK_PREVIOUS_SLUG}`,
        `/${root}/${MOCK_PREVIOUS_SLUG}/page/2`,
        `/${root}/${MOCK_PREVIOUS_SLUG}/page/3`,
        `/${root}/${MOCK_PREVIOUS_SLUG}/page/4`,
      ]);
    },
  );

  it('returns the page after the first for an unpaginated topic', () => {
    const hrefs = buildRenamedDocumentHrefs(
      { ...MOCK_RENAMED, type: 'page_topic' },
      mockTenantPageLists(),
    );

    expect(hrefs).toEqual([
      `/topics/${MOCK_PREVIOUS_SLUG}`,
      `/topics/${MOCK_PREVIOUS_SLUG}/page/2`,
    ]);
  });
});
