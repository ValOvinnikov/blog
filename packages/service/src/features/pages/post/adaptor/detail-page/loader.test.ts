import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
  SOCIAL_PLATFORMS,
} from '@blog/config/constants';
import {
  MOCK_SKIM_MODEL,
  MOCK_SKIM_TAKEAWAYS,
} from '@blog/service/testing/editorial/fixtures';
import {
  MOCK_AUTHOR_AVATAR_ALT,
  MOCK_AUTHOR_NAME,
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
  MOCK_BIO_BLOCK_KEY,
  MOCK_BODY_IMAGE_KEY,
  MOCK_EXTERNAL_URL,
  MOCK_POST_SLUG,
  MOCK_POST_TITLE,
  mockLinkView,
  mockRawBodyImageBlock,
  mockRawExternalLinkDocument,
  mockRawHeadingBlock,
  mockRawInternalLinkDocument,
  mockRawPortableTextMarkDef,
  mockRawSanityImage,
  mockRawSeo,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';

import { getPost } from './loader';
import { postPageQuery } from './query';
import type { TRawPostDetail } from './transformer';

vi.mock('@blog/service/sanity/query/query');

const GITHUB_URL = 'https://github.com/janedoe';
const PUBLISHED_AT = '2026-02-01T00:00:00Z';
const PAGE_POST_SLUG = 'page-post-slug';
const META_TITLE = 'Authored Title';
const META_DESCRIPTION = 'Authored description';

const MODULE_REFS: TRawPostDetail['modules'] = [
  { _id: 'related-1', _type: 'module_postRelated' },
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
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawPostDetail());
  });

  it('resolves undefined when no page_post matches the slug', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getPost('missing-slug', tenant);

    expect(result).toBeUndefined();
  });

  it('maps the raw post into a domain detail object', async () => {
    const { id, title } = await loadPost({
      _id: 'post-abc',
      headingBlock: mockRawHeadingBlock('Test Post'),
    });

    expect({ id, title }).toEqual({ id: 'post-abc', title: 'Test Post' });
  });

  it('takes slug and publishedAt from the page_post document', async () => {
    const { slug, publishedAt } = await loadPost({
      slug: PAGE_POST_SLUG,
      publishedAt: PUBLISHED_AT,
    });

    expect({ slug, publishedAt }).toEqual({
      slug: PAGE_POST_SLUG,
      publishedAt: PUBLISHED_AT,
    });
  });

  it('maps the required author onto the post detail', async () => {
    const { author } = await loadPost({
      author: mockRawAuthor({
        _id: 'author-9',
        image: mockRawSanityImage(MOCK_AUTHOR_AVATAR_ALT),
        profilePage: mockRawInternalLinkDocument({
          internalReference: { _type: 'page_landing', slug: 'jane-doe' },
        }),
        role: 'Editor',
      }),
    });

    expect(author).toEqual({
      id: 'author-9',
      name: MOCK_AUTHOR_NAME,
      profileUrl: '/jane-doe',
      image: mockSanityImageView(MOCK_AUTHOR_AVATAR_ALT),
      role: 'Editor',
      bio: undefined,
      socialLinks: [],
    });
  });

  it('resolves the author profilePage through a non-landing page type', async () => {
    const { author } = await loadPost({
      author: mockRawAuthor({
        profilePage: mockRawInternalLinkDocument({
          internalReference: { _type: 'page_tag', slug: 'news' },
        }),
      }),
    });

    expect(author.profileUrl).toBe('/tags/news');
  });

  it('maps the author socialLinks through the social profile resolver', async () => {
    const { author } = await loadPost({
      author: mockRawAuthor({
        socialLinks: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: mockRawExternalLinkDocument({
              label: 'GitHub',
              url: GITHUB_URL,
            }),
          },
        ],
      }),
    });

    expect(author.socialLinks).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: mockLinkView({ label: 'GitHub', href: GITHUB_URL }),
      },
    ]);
  });

  it('maps an author with no image to an undefined image', async () => {
    const { author } = await loadPost({
      author: mockRawAuthor({ image: null }),
    });

    expect(author.image).toBeUndefined();
  });

  it.each([
    [
      'resolves a linkRef mark in the author bio to its link document href',
      mockRawPortableTextMarkDef(),
      { href: MOCK_EXTERNAL_URL, target: undefined },
    ],
    [
      'degrades a dangling linkRef mark in the author bio rather than throwing',
      mockRawPortableTextMarkDef({ link: null }),
      undefined,
    ],
  ])('%s', async (_, markDef, expectedLink) => {
    const { author } = await loadPost({
      author: mockRawAuthor({
        bio: [
          { _type: 'block', _key: MOCK_BIO_BLOCK_KEY, markDefs: [markDef] },
        ],
      }),
    });

    expect(author.bio).toEqual([
      {
        _type: 'block',
        _key: MOCK_BIO_BLOCK_KEY,
        children: [],
        markDefs: [
          {
            _key: markDef._key,
            _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
            link: expectedLink,
          },
        ],
      },
    ]);
  });

  it('resolves seo from the authored value, with no unauthored openGraph fallback', async () => {
    const { seo } = await loadPost({
      seo: mockRawSeo({
        metaTitle: META_TITLE,
        metaDescription: META_DESCRIPTION,
      }),
    });

    expect(seo.title).toBe(META_TITLE);
    expect(seo.description).toBe(META_DESCRIPTION);
    expect(seo.ogTitle).toBeUndefined();
  });

  it.each([
    [
      'maps tags from raw input',
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
      'maps the page-builder modules array to module refs',
      MODULE_REFS,
      [
        { id: 'related-1', type: 'module_postRelated' },
        { id: MOCK_NEWSLETTER_MODULE_ID, type: 'module_newsletter' },
      ],
    ],
    ['defaults modules to an empty array when the post has none', null, []],
  ])('%s', async (_, modules, expected) => {
    const result = await loadPost({ modules });

    expect(result.modules).toEqual(expected);
  });

  it.each([
    ['computes readingTimeMinutes from the server-computed word count', 401, 3],
    ['rounds a wordless post up to a 1-minute read', 0, 1],
  ])('%s', async (_, wordCount, expected) => {
    const result = await loadPost({ wordCount });

    expect(result.readingTimeMinutes).toBe(expected);
  });

  it('maps takeaways with 3+ entries onto the post detail', async () => {
    const postTakeaways = {
      takeaways: MOCK_SKIM_TAKEAWAYS,
      generatedAt: '2026-07-20T00:00:00Z',
      model: MOCK_SKIM_MODEL,
    };

    const result = await loadPost({ postTakeaways });

    expect(result.postTakeaways).toEqual(postTakeaways);
  });

  it.each([
    ['treats absent takeaways as undefined', null],
    [
      'treats fewer than 3 takeaways as undefined, as the schema requires 3',
      {
        takeaways: MOCK_SKIM_TAKEAWAYS.slice(0, 2),
        generatedAt: null,
        model: null,
      },
    ],
  ])('%s', async (_, postTakeaways) => {
    const result = await loadPost({ postTakeaways });

    expect(result.postTakeaways).toBeUndefined();
  });

  it.each([
    [
      'true when the body contains an aside block',
      [{ _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE, _key: 'a1', body: null }],
      true,
    ],
    ['false when the body has no aside blocks', [], false],
  ])('reports hasAsides %s', async (_, body, expected) => {
    const result = await loadPost({ body: body as TRawPostDetail['body'] });

    expect(result.hasAsides).toBe(expected);
  });

  it.each([
    [
      'into an image view-model, keeping layout',
      { layout: IMAGE_LAYOUT.FLOAT_RIGHT },
      IMAGE_LAYOUT.FLOAT_RIGHT,
      mockSanityImageView(),
    ],
    [
      'whose asset never resolved, with image undefined',
      { asset: null, layout: null },
      undefined,
      undefined,
    ],
  ])(
    'resolves a bodyImage block %s',
    async (_, overrides, expectedLayout, expected) => {
      const result = await loadPost({
        body: [mockRawBodyImageBlock(overrides)],
      });

      expect(result.body).toEqual([
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
          _key: MOCK_BODY_IMAGE_KEY,
          layout: expectedLayout,
          image: expected,
        },
      ]);
    },
  );

  it('renders a post with no supportingText as an undefined excerpt', async () => {
    const result = await loadPost({
      headingBlock: mockRawHeadingBlock(MOCK_POST_TITLE),
    });

    expect(result.excerpt).toBeUndefined();
  });

  it('queries the slug for the tenant and scopes its tags to it', async () => {
    await getPost('my-slug', tenant);

    expect(mockRun).toHaveBeenCalledWith(postPageQuery, {
      parameters: { slug: 'my-slug' },
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

  describe('with no heroImage', () => {
    let result: Awaited<ReturnType<typeof loadPost>>;

    beforeEach(async () => {
      result = await loadPost({ heroImage: null });
    });

    it('maps a post with no heroImage to an undefined heroImage', () => {
      expect(result.heroImage).toBeUndefined();
    });

    it('leaves seo.ogImage undefined without falling back to the hero image', () => {
      expect(result.seo.ogImage).toBeUndefined();
    });
  });
});
