import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  MOCK_TOPIC_DESCRIPTION,
  MOCK_TOPIC_ID,
  MOCK_TOPIC_SLUG,
  MOCK_TOPIC_TITLE,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_CURATED_SUPPORTING_TEXT,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHeroRef,
  mockRawTopicPage,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
  MOCK_TEMPLATE_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockRawHeadingBlock,
  mockRawSeo,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getTopicPageDocument } from './loader';
import { topicPageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(601601);

const MOCK_CURATED_HEADING = faker.lorem.words(3);
const MOCK_META_TITLE = faker.lorem.sentence();

const tenant = mockTenant();

async function loadPage(
  overrides: Parameters<typeof mockRawTopicPage>[0] = {},
) {
  mockRun.mockResolvedValueOnce(mockRawTopicPage(overrides));
  const result = await getTopicPageDocument(MOCK_TOPIC_SLUG, tenant);
  if (!result) throw new Error('expected a topic page');

  return result;
}

describe(getTopicPageDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawTopicPage());
  });

  it('maps a page with no modules to an empty module list', async () => {
    const { modules } = await loadPage({ modules: null });

    expect(modules).toEqual([]);
  });

  it('takes the topic from the referenced topic document', async () => {
    const { topic } = await loadPage();

    expect(topic).toEqual({
      id: MOCK_TOPIC_ID,
      title: MOCK_TOPIC_TITLE,
      slug: MOCK_TOPIC_SLUG,
      description: MOCK_TOPIC_DESCRIPTION,
    });
  });

  it('leaves the seo description unset when none is authored', async () => {
    const { seo } = await loadPage({
      seo: mockRawSeo({ metaTitle: MOCK_META_TITLE, metaDescription: null }),
    });

    expect(seo.title).toBe(MOCK_META_TITLE);
    expect(seo.description).toBeUndefined();
  });

  it.each([
    [
      'maps the authored headingBlock straight through',
      MOCK_CURATED_SUPPORTING_TEXT,
      MOCK_CURATED_SUPPORTING_TEXT,
    ],
    [
      'leaves an unset supportingText undefined without using the topic description',
      null,
      undefined,
    ],
  ])('%s', async (_, supportingText, expected) => {
    const { headingBlock } = await loadPage({
      headingBlock: mockRawHeadingBlock(MOCK_CURATED_HEADING, {
        supportingText,
      }),
    });

    expect(headingBlock).toEqual({
      heading: MOCK_CURATED_HEADING,
      supportingText: expected,
    });
  });

  it.each([
    ['leaves hero undefined when page_topic.hero is unset', null, undefined],
    [
      'maps a set page_topic.hero to a hero slot',
      mockRawHeroRef(),
      mockHeroSlotView(),
    ],
  ])('%s', async (_, hero, expected) => {
    const result = await loadPage({ hero });

    expect(result.hero).toEqual(expected);
  });

  it('rejects when page_topic.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawTopicPage({ hero: mockRawCtaRef() as never }),
    );

    await expect(
      getTopicPageDocument(MOCK_TOPIC_SLUG, tenant),
    ).rejects.toThrow();
  });

  it('resolves undefined when no page_topic matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getTopicPageDocument(MOCK_MISSING_ID, tenant);

    expect(result).toBeUndefined();
  });

  it('queries the slug for the tenant and scopes its tags to it', async () => {
    await getTopicPageDocument(MOCK_TOPIC_SLUG, tenant);

    expect(mockRun).toHaveBeenCalledWith(topicPageQuery, {
      parameters: { slug: MOCK_TOPIC_SLUG },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_TEMPLATE_TOPIC_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
        ],
      },
    });
  });
});
