import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_TAG_SLUG,
  MOCK_TAG_TITLE,
  mockRawTag,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_CURATED_SUPPORTING_TEXT,
  MOCK_TAG_PAGE_DESCRIPTION,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawTagPage,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TEMPLATE_TAG_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getTagPageDocument } from './loader';
import { tagPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const CURATED_HEADING = 'TypeScript, curated';
const ENTITY = { ...mockRawTag(), description: MOCK_TAG_PAGE_DESCRIPTION };

const tenant = mockTenant();

async function loadPage(overrides: Parameters<typeof mockRawTagPage>[0] = {}) {
  mockRun.mockResolvedValueOnce(mockRawTagPage(overrides));
  const result = await getTagPageDocument(MOCK_TAG_SLUG, tenant);
  if (!result) throw new Error('expected a tag page');

  return result;
}

describe(getTagPageDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawTagPage());
  });

  it('loads a tag page with no list module in modules[]', async () => {
    mockRun.mockResolvedValueOnce(mockRawTagPage({ modules: [] }));

    const result = await getTagPageDocument(MOCK_TAG_SLUG, tenant);

    expect(result).toBeDefined();
  });

  it('takes the tag from the referenced tag document', async () => {
    const result = await loadPage({ tag: ENTITY });

    expect(result.tag).toEqual({
      id: ENTITY._id,
      title: MOCK_TAG_TITLE,
      slug: MOCK_TAG_SLUG,
      description: MOCK_TAG_PAGE_DESCRIPTION,
    });
  });

  it('resolves seo from the authored value, with no unauthored description fallback', async () => {
    const { seo } = await loadPage({
      seo: mockRawSeo({ metaTitle: MOCK_TAG_TITLE, metaDescription: null }),
    });

    expect(seo.title).toBe(MOCK_TAG_TITLE);
    expect(seo.description).toBeUndefined();
  });

  it.each([
    [
      'maps the authored headingBlock straight through',
      MOCK_CURATED_SUPPORTING_TEXT,
      MOCK_CURATED_SUPPORTING_TEXT,
    ],
    [
      'leaves an unset supportingText undefined, never the tag description',
      null,
      undefined,
    ],
  ])('%s', async (_, supportingText, expected) => {
    const { headingBlock } = await loadPage({
      tag: ENTITY,
      headingBlock: mockRawHeadingBlock(CURATED_HEADING, { supportingText }),
    });

    expect(headingBlock).toEqual({
      heading: CURATED_HEADING,
      supportingText: expected,
    });
  });

  it.each([
    ['leaves hero undefined when page_tag.hero is unset', null, undefined],
    [
      'maps a set page_tag.hero to a hero slot',
      mockRawHeroRef(),
      mockHeroSlotView(),
    ],
  ])('%s', async (_, hero, expected) => {
    const result = await loadPage({ hero });

    expect(result.hero).toEqual(expected);
  });

  it('rejects when page_tag.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawTagPage({ hero: mockRawCtaRef() as never }),
    );

    await expect(getTagPageDocument(MOCK_TAG_SLUG, tenant)).rejects.toThrow();
  });

  it('resolves undefined when no page_tag matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTagPageDocument('nonexistent', tenant);

    expect(result).toBeUndefined();
  });

  it('queries the slug for the tenant and scopes its tags to it', async () => {
    await getTagPageDocument(MOCK_TAG_SLUG, tenant);

    expect(mockRun).toHaveBeenCalledWith(tagPageQuery, {
      parameters: { slug: MOCK_TAG_SLUG },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_TEMPLATE_TAG_CACHE_TAG,
          MOCK_TAG_CACHE_TAG,
        ],
      },
    });
  });
});
