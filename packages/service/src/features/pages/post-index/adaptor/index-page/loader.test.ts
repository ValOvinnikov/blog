import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_ENGLISH_MODULE_HEADING,
  MOCK_NEWSLETTER_MODULE_ID,
} from '@blog/service/testing/modules/fixtures';
import {
  mockHeroSlotView,
  mockRawBlogPage,
  mockRawHeroRef,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_TEMPLATE_POST_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getIndexPage } from './loader';
import { blogPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6022);

const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_META_TITLE = faker.lorem.words(3);

const tenant = mockTenant();

async function loadIndexPage(
  overrides: Parameters<typeof mockRawBlogPage>[0] = {},
) {
  mockRun.mockResolvedValueOnce(mockRawBlogPage(overrides));
  const result = await getIndexPage(tenant);
  if (!result) throw new Error('expected a blog index page');

  return result;
}

describe(getIndexPage, () => {
  it('exposes the heading block and seo of the blog page', async () => {
    const { headingBlock, seo } = await loadIndexPage({
      headingBlock: mockRawHeadingBlock(MOCK_ENGLISH_MODULE_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
      seo: mockRawSeo({
        metaTitle: MOCK_META_TITLE,
        metaDescription: MOCK_SUPPORTING_TEXT,
      }),
    });

    expect(headingBlock).toEqual({
      heading: MOCK_ENGLISH_MODULE_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });
    expect(seo.title).toBe(MOCK_META_TITLE);
    expect(seo.description).toBe(MOCK_SUPPORTING_TEXT);
  });

  it.each([
    [
      'maps the page-builder modules to module refs',
      [{ _id: MOCK_NEWSLETTER_MODULE_ID, _type: 'module_newsletter' } as const],
      [{ id: MOCK_NEWSLETTER_MODULE_ID, type: 'module_newsletter' }],
    ],
    ['defaults modules to an empty array when the page has none', null, []],
  ])('%s', async (_, modules, expected) => {
    const result = await loadIndexPage({ modules });

    expect(result.modules).toEqual(expected);
  });

  it.each([
    ['leaves hero undefined when it is unset', null, undefined],
    ['maps a set hero to a hero slot', mockRawHeroRef(), mockHeroSlotView()],
  ])('%s', async (_, hero, expected) => {
    const result = await loadIndexPage({ hero });

    expect(result.hero).toEqual(expected);
  });

  it('resolves undefined when there is no blog page', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('lists translations, a page with no language as the default', async () => {
    const result = await loadIndexPage({
      translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
    });

    expect(result.translations).toEqual([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
  });

  it('queries for the tenant and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(mockRawBlogPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(blogPageQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_TEMPLATE_POST_INDEX_CACHE_TAG,
        ],
      },
    });
  });
});
