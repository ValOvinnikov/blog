import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_TOPIC_INDEX_HEADING,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawTopicIndexPage,
  mockRawTaxonomyListRef,
  mockTaxonomyListSlotView,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
  MOCK_TEMPLATE_TOPIC_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getIndexPage } from './loader';
import { topicIndexPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(601607);

const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_META_TITLE = faker.lorem.sentence();

const tenant = mockTenant();

async function loadIndexPage(
  overrides: Parameters<typeof mockRawTopicIndexPage>[0] = {},
) {
  mockRun.mockResolvedValueOnce(mockRawTopicIndexPage(overrides));
  const result = await getIndexPage(tenant);
  if (!result) throw new Error('expected a topic index page');

  return result;
}

describe(getIndexPage, () => {
  it('exposes the headingBlock from the page_topicIndex singleton', async () => {
    const { headingBlock } = await loadIndexPage({
      headingBlock: mockRawHeadingBlock(MOCK_TOPIC_INDEX_HEADING, {
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    });

    expect(headingBlock).toEqual({
      heading: MOCK_TOPIC_INDEX_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    });
  });

  it('resolves seo from the authored meta fields', async () => {
    const { seo } = await loadIndexPage({
      seo: mockRawSeo({
        metaTitle: MOCK_META_TITLE,
        metaDescription: MOCK_SUPPORTING_TEXT,
      }),
    });

    expect(seo.title).toBe(MOCK_META_TITLE);
    expect(seo.description).toBe(MOCK_SUPPORTING_TEXT);
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
    [
      'leaves hero undefined when page_topicIndex.hero is unset',
      null,
      undefined,
    ],
    [
      'maps a set page_topicIndex.hero to a hero slot',
      mockRawHeroRef(),
      mockHeroSlotView(),
    ],
  ])('%s', async (_, hero, expected) => {
    const result = await loadIndexPage({ hero });

    expect(result.hero).toEqual(expected);
  });

  it('rejects when page_topicIndex.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawTopicIndexPage({ hero: mockRawCtaRef() as never }),
    );

    await expect(getIndexPage(tenant)).rejects.toThrow();
  });

  it('resolves undefined when no page_topicIndex document exists', async () => {
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
    mockRun.mockResolvedValueOnce(mockRawTopicIndexPage());

    await getIndexPage(tenant);

    expect(mockRun).toHaveBeenCalledWith(topicIndexPageQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
          MOCK_TEMPLATE_TOPIC_INDEX_CACHE_TAG,
          MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG,
        ],
      },
    });
  });
});
