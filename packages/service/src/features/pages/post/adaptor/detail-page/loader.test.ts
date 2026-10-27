import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { IMAGE_LAYOUT, PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import {
  MOCK_SKIM_MODEL,
  MOCK_SKIM_TAKEAWAYS,
} from '@blog/service/testing/editorial/fixtures';
import {
  MOCK_TAG_ID,
  MOCK_TAG_SLUG,
  MOCK_TAG_TITLE,
  mockRawTag,
} from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { MOCK_NEWSLETTER_MODULE_ID } from '@blog/service/testing/modules/fixtures';
import {
  mockRawAuthor,
  mockRawPostDetail,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_AUTHOR_CACHE_TAG,
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_LINK_CACHE_TAG,
  MOCK_PAGE_LANDING_CACHE_TAG,
  MOCK_PAGE_POST_CACHE_TAG,
  MOCK_PAGE_POST_INDEX_CACHE_TAG,
  MOCK_PAGE_TAG_CACHE_TAG,
  MOCK_PAGE_TAG_INDEX_CACHE_TAG,
  MOCK_PAGE_TOPIC_CACHE_TAG,
  MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
  MOCK_TAG_CACHE_TAG,
  MOCK_TOPIC_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_POST_SLUG,
  mockRawBodyImageBlock,
  mockRawHeadingBlock,
  mockRawSeo,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getPost } from './loader';
import { postPageQuery } from './query';
import type { TRawPostDetail } from './transformer';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015);

const MOCK_MISSING_SLUG = faker.lorem.slug();
const MOCK_PAGE_POST_ID = faker.string.uuid();
const MOCK_PAGE_POST_TITLE = faker.lorem.words(3);
const MOCK_PAGE_POST_SLUG = faker.lorem.slug();
const MOCK_AUTHOR_DOCUMENT_ID = faker.string.uuid();
const MOCK_AUTHOR_ROLE = faker.person.jobTitle();
const MOCK_RELATED_MODULE_ID = faker.string.uuid();
const MOCK_META_TITLE = faker.lorem.words(4);
const MOCK_META_DESCRIPTION = faker.lorem.sentence();
const MOCK_ASIDE_KEY = faker.string.uuid();
const MOCK_REF_DATE = '2026-06-01T00:00:00Z';
const PUBLISHED_AT = faker.date.past({ refDate: MOCK_REF_DATE }).toISOString();
const GENERATED_AT = faker.date.past({ refDate: MOCK_REF_DATE }).toISOString();

const MODULE_REFS: TRawPostDetail['modules'] = [
  { _id: MOCK_RELATED_MODULE_ID, _type: 'module_postRelated' },
  { _id: MOCK_NEWSLETTER_MODULE_ID, _type: 'module_newsletter' },
];

const tenant = mockTenant();

async function loadPost(overrides: Partial<TRawPostDetail> = {}) {
  mockRun.mockResolvedValueOnce(mockRawPostDetail(overrides));
  const result = await getPost(MOCK_POST_SLUG, tenant);
  if (!result) throw new Error('expected a post detail');

  return result;
}

describe(getPost, () => {
  it('resolves undefined when no post matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getPost(MOCK_MISSING_SLUG, tenant);

    expect(result).toBeUndefined();
  });

  it('maps the raw post into a domain detail object', async () => {
    const { id, title, slug, publishedAt } = await loadPost({
      _id: MOCK_PAGE_POST_ID,
      headingBlock: mockRawHeadingBlock(MOCK_PAGE_POST_TITLE),
      slug: MOCK_PAGE_POST_SLUG,
      publishedAt: PUBLISHED_AT,
    });

    expect({ id, title, slug, publishedAt }).toEqual({
      id: MOCK_PAGE_POST_ID,
      title: MOCK_PAGE_POST_TITLE,
      slug: MOCK_PAGE_POST_SLUG,
      publishedAt: PUBLISHED_AT,
    });
  });

  it('maps the required author onto the post detail', async () => {
    const { author } = await loadPost({
      author: mockRawAuthor({
        _id: MOCK_AUTHOR_DOCUMENT_ID,
        role: MOCK_AUTHOR_ROLE,
      }),
    });

    const { id, role } = author;

    expect({ id, role }).toEqual({
      id: MOCK_AUTHOR_DOCUMENT_ID,
      role: MOCK_AUTHOR_ROLE,
    });
  });

  it('resolves seo from the authored value', async () => {
    const { seo } = await loadPost({
      seo: mockRawSeo({
        metaTitle: MOCK_META_TITLE,
        metaDescription: MOCK_META_DESCRIPTION,
      }),
    });

    const { title, description } = seo;

    expect({ title, description }).toEqual({
      title: MOCK_META_TITLE,
      description: MOCK_META_DESCRIPTION,
    });
  });

  it.each([
    [
      'maps tags',
      [mockRawTag()],
      [{ id: MOCK_TAG_ID, title: MOCK_TAG_TITLE, slug: MOCK_TAG_SLUG }],
    ],
    ['maps an absent tags field to an empty array', null, []],
  ])('%s', async (_, tags, expected) => {
    const result = await loadPost({ tags });

    expect(result.tags).toEqual(expected);
  });

  it.each([
    [
      'maps the page-builder modules to module refs',
      MODULE_REFS,
      [
        { id: MOCK_RELATED_MODULE_ID, type: 'module_postRelated' },
        { id: MOCK_NEWSLETTER_MODULE_ID, type: 'module_newsletter' },
      ],
    ],
    ['defaults modules to an empty array when the post has none', null, []],
  ])('%s', async (_, modules, expected) => {
    const result = await loadPost({ modules });

    expect(result.modules).toEqual(expected);
  });

  it('computes the reading time from the word count', async () => {
    const result = await loadPost({ wordCount: 401 });

    expect(result.readingTimeMinutes).toBe(3);
  });

  it('maps takeaways with 3 or more entries', async () => {
    const postTakeaways = {
      takeaways: MOCK_SKIM_TAKEAWAYS,
      generatedAt: GENERATED_AT,
      model: MOCK_SKIM_MODEL,
    };

    const result = await loadPost({ postTakeaways });

    expect(result.postTakeaways).toEqual(postTakeaways);
  });

  it.each([
    ['absent takeaways', null],
    [
      'fewer than 3 takeaways',
      {
        takeaways: MOCK_SKIM_TAKEAWAYS.slice(0, 2),
        generatedAt: null,
        model: null,
      },
    ],
  ])('leaves postTakeaways undefined for %s', async (_, postTakeaways) => {
    const result = await loadPost({ postTakeaways });

    expect(result.postTakeaways).toBeUndefined();
  });

  it.each([
    [
      'when the body contains an aside block',
      [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
          _key: MOCK_ASIDE_KEY,
          body: null,
        },
      ],
      true,
    ],
    ['when the body has no aside blocks', [], false],
  ])('reports hasAsides %s', async (_, body, expected) => {
    const result = await loadPost({ body: body as TRawPostDetail['body'] });

    expect(result.hasAsides).toBe(expected);
  });

  it('resolves a bodyImage block in the body to an image view', async () => {
    const block = mockRawBodyImageBlock({ layout: IMAGE_LAYOUT.FLOAT_RIGHT });

    const result = await loadPost({ body: [block] });

    expect(result.body).toEqual([
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
        _key: block._key,
        layout: IMAGE_LAYOUT.FLOAT_RIGHT,
        image: mockSanityImageView(),
      },
    ]);
  });

  it('queries the slug for the tenant and scopes its tags to it', async () => {
    mockRun.mockResolvedValueOnce(mockRawPostDetail());

    await getPost(MOCK_POST_SLUG, tenant);

    expect(mockRun).toHaveBeenCalledWith(postPageQuery, {
      parameters: { slug: MOCK_POST_SLUG },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_POST_CACHE_TAG,
          MOCK_AUTHOR_CACHE_TAG,
          MOCK_TOPIC_CACHE_TAG,
          MOCK_TAG_CACHE_TAG,
          MOCK_LINK_CACHE_TAG,
          MOCK_HOME_PAGE_CACHE_TAG,
          MOCK_PAGE_LANDING_CACHE_TAG,
          MOCK_PAGE_POST_INDEX_CACHE_TAG,
          MOCK_PAGE_TOPIC_CACHE_TAG,
          MOCK_PAGE_TOPIC_INDEX_CACHE_TAG,
          MOCK_PAGE_TAG_CACHE_TAG,
          MOCK_PAGE_TAG_INDEX_CACHE_TAG,
        ],
      },
    });
  });
});
