import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TAG_INDEX_HEADING,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawTagIndexPage,
  mockRawTaxonomyListRef,
  mockTaxonomyListSlotView,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getIndexPage } from './loader';
import { tagIndexPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const SUPPORTING_TEXT = 'Find posts by keyword.';
const META_TITLE = 'Tags — Blog';

const tenant = mockTenant();

async function loadIndexPage(
  overrides: Parameters<typeof mockRawTagIndexPage>[0] = {},
) {
  mockRun.mockResolvedValueOnce(mockRawTagIndexPage(overrides));
  const result = await getIndexPage(tenant);
  if (!result) throw new Error('expected a tag index page');

  return result;
}

describe(getIndexPage, () => {
  it('exposes the headingBlock from the page_tagIndex singleton', async () => {
    const { headingBlock, seo } = await loadIndexPage({
      headingBlock: mockRawHeadingBlock(MOCK_TAG_INDEX_HEADING, {
        supportingText: SUPPORTING_TEXT,
      }),
      seo: mockRawSeo({
        metaTitle: META_TITLE,
        metaDescription: SUPPORTING_TEXT,
      }),
    });

    expect(headingBlock).toEqual({
      heading: MOCK_TAG_INDEX_HEADING,
      supportingText: SUPPORTING_TEXT,
    });
    expect(seo.title).toBe(META_TITLE);
    expect(seo.description).toBe(SUPPORTING_TEXT);
  });

  it.each([
    [
      'maps the thin page-builder modules array to module refs',
      [mockRawTaxonomyListRef()],
      [mockTaxonomyListSlotView()],
    ],
    ['defaults modules to an empty array when the page has none', null, []],
  ])('%s', async (_, modules, expected) => {
    const result = await loadIndexPage({ modules });

    expect(result.modules).toEqual(expected);
  });

  it.each([
    ['leaves hero undefined when page_tagIndex.hero is unset', null, undefined],
    [
      'maps a set page_tagIndex.hero to a hero slot',
      mockRawHeroRef(),
      mockHeroSlotView(),
    ],
  ])('%s', async (_, hero, expected) => {
    const result = await loadIndexPage({ hero });

    expect(result.hero).toEqual(expected);
  });

  it('rejects when page_tagIndex.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawTagIndexPage({
        hero: mockRawCtaRef() as never,
      }),
    );

    await expect(getIndexPage(tenant)).rejects.toThrow();
  });

  it('resolves undefined when no page_tagIndex document exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getIndexPage(tenant);

    expect(result).toBeUndefined();
  });

  it('lists the page translations, a page with no language as the default', async () => {
    const result = await loadIndexPage({
      translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
    });

    expect(result.translations).toEqual([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(mockRawTagIndexPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(tagIndexPageQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TAG_INDEX_CACHE_TAG,
          't:tenant-a:template_tagIndex',
          MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
        ],
      },
    });
  });
});
