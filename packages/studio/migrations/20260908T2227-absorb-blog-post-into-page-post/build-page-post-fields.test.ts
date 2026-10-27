import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import {
  assertSatisfiesRequiredFields,
  type TExemptField,
} from '@blog/studio/testing/assert-satisfies-required-fields';
import { mockReference } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';

import {
  buildPagePostFields,
  type TBlogPostDoc,
} from './build-page-post-fields';
import { SHARED_MODULE_IDS } from './shared-modules';

faker.seed(12);

const HEADING_BLOCK_EXEMPTION: TExemptField[] = [
  {
    name: 'headingBlock',
    reason: 'buildPagePostFields sets sectionHeader, not headingBlock',
  },
];

const MOCK_POST_ID = faker.string.uuid();
const MOCK_LINKED_POST_ID = faker.string.uuid();
const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_TOPIC_ID = faker.string.uuid();
const MOCK_TAG_ID = faker.string.uuid();
const MOCK_TAG_KEY = faker.string.uuid();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_SPAN_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();
const MOCK_EXCERPT = faker.lorem.sentence();
const MOCK_SLUG = faker.lorem.slug();
const MOCK_SEO_TITLE = faker.lorem.words();
const MOCK_PUBLISHED_AT = faker.date
  .past({ refDate: '2026-03-01T00:00:00Z' })
  .toISOString();
const MOCK_EXISTING_TITLE = faker.lorem.words();
const MOCK_EXISTING_SLUG = faker.lorem.slug();
const MOCK_EXISTING_SEO_TITLE = faker.lorem.words();
const MOCK_EXISTING_PUBLISHED_AT = faker.date
  .past({ refDate: '2025-12-31T00:00:00Z' })
  .toISOString();
const MOCK_PAGE_POST_ID = `page_post-${MOCK_POST_ID}`;
const MOCK_LINKED_PAGE_POST_ID = `page_post-${MOCK_LINKED_POST_ID}`;

const POST_RELATED_MODULE = {
  _type: 'reference',
  _key: 'postRelated',
  _ref: SHARED_MODULE_IDS.POST_RELATED,
};
const NEWSLETTER_MODULE = {
  _type: 'reference',
  _key: 'newsletter',
  _ref: SHARED_MODULE_IDS.NEWSLETTER,
};

const MOCK_BODY = [
  {
    _type: 'block',
    _key: MOCK_BLOCK_KEY,
    style: 'normal',
    markDefs: [],
    children: [
      { _type: 'span', _key: MOCK_SPAN_KEY, text: faker.lorem.sentence() },
    ],
  },
];

const mockBlogPost = (overrides: Partial<TBlogPostDoc> = {}): TBlogPostDoc => ({
  _id: MOCK_POST_ID,
  title: MOCK_TITLE,
  slug: { _type: 'slug', current: MOCK_SLUG },
  excerpt: MOCK_EXCERPT,
  heroImage: { _type: 'imageWithAlt', alt: faker.lorem.words() },
  author: mockReference(MOCK_AUTHOR_ID),
  topic: mockReference(MOCK_TOPIC_ID),
  tags: [{ ...mockReference(MOCK_TAG_ID), _key: MOCK_TAG_KEY }],
  publishedAt: MOCK_PUBLISHED_AT,
  body: MOCK_BODY,
  featured: true,
  newsletterEnabled: true,
  skim: { takeaways: [faker.lorem.word(), faker.lorem.word()] },
  seo: { metaTitle: MOCK_SEO_TITLE },
  ...overrides,
});

describe(buildPagePostFields, () => {
  describe('without an existing page_post', () => {
    let post: TBlogPostDoc;
    let fields: ReturnType<typeof buildPagePostFields>;

    beforeEach(() => {
      post = mockBlogPost();
      fields = buildPagePostFields(post, undefined, new Map());
    });

    it('copies every content field from the post', () => {
      const { heroImage, author, topic, tags, content, featured, skim } =
        fields;

      expect(heroImage).toEqual(post.heroImage);
      expect(author).toEqual(post.author);
      expect(topic).toEqual(post.topic);
      expect(tags).toEqual(post.tags);
      expect(content).toEqual(post.body);
      expect(featured).toBe(post.featured);
      expect(skim).toEqual(post.skim);
    });

    it('titles the page after the post', () => {
      expect(fields.title).toBe(MOCK_TITLE);
    });

    it('moves the post title and excerpt into the section header', () => {
      expect(fields.sectionHeader).toEqual({
        _type: 'requiredHeadingSectionHeader',
        heading: MOCK_TITLE,
        supportingText: MOCK_EXCERPT,
      });
    });

    it('takes the slug, publish date and seo from the post', () => {
      const { slug, publishedAt, seo } = fields;

      expect(slug).toEqual(post.slug);
      expect(publishedAt).toBe(MOCK_PUBLISHED_AT);
      expect(seo).toEqual(post.seo);
    });

    it.each([
      [true, [POST_RELATED_MODULE, NEWSLETTER_MODULE]],
      [undefined, [POST_RELATED_MODULE, NEWSLETTER_MODULE]],
      [false, [POST_RELATED_MODULE]],
    ])(
      'lists the shared modules for a newsletter flag of %s',
      (newsletterEnabled, modules) => {
        const result = buildPagePostFields(
          mockBlogPost({ newsletterEnabled }),
          undefined,
          new Map(),
        );

        expect(result.modules).toEqual(modules);
      },
    );

    it('produces a payload satisfying every field page_post requires', () => {
      assertSatisfiesRequiredFields(
        postPageSchema,
        { _id: MOCK_PAGE_POST_ID, _type: PAGE_POST_TYPE, ...fields },
        HEADING_BLOCK_EXEMPTION,
      );
    });
  });

  describe('with an existing page_post', () => {
    const existingPagePost = {
      title: MOCK_EXISTING_TITLE,
      slug: { _type: 'slug' as const, current: MOCK_EXISTING_SLUG },
      publishedAt: MOCK_EXISTING_PUBLISHED_AT,
      seo: { metaTitle: MOCK_EXISTING_SEO_TITLE },
    };

    let fields: ReturnType<typeof buildPagePostFields>;

    beforeEach(() => {
      fields = buildPagePostFields(mockBlogPost(), existingPagePost, new Map());
    });

    it('keeps the page’s own title, slug, publish date and seo', () => {
      const { title, slug, publishedAt, seo } = fields;

      expect(title).toBe(MOCK_EXISTING_TITLE);
      expect(slug).toEqual(existingPagePost.slug);
      expect(publishedAt).toBe(MOCK_EXISTING_PUBLISHED_AT);
      expect(seo).toEqual(existingPagePost.seo);
    });

    it('still builds the section header from the post', () => {
      expect(fields.sectionHeader).toEqual({
        _type: 'requiredHeadingSectionHeader',
        heading: MOCK_TITLE,
        supportingText: MOCK_EXCERPT,
      });
    });

    it('returns the same fields as the first run once the page is migrated', () => {
      const post = mockBlogPost();
      const firstRun = buildPagePostFields(post, undefined, new Map());

      const secondRun = buildPagePostFields(
        post,
        {
          title: post.title,
          slug: post.slug,
          publishedAt: post.publishedAt,
          seo: post.seo,
        },
        new Map(),
      );

      expect(secondRun).toEqual(firstRun);
    });
  });

  it('rewrites an internal link to another migrated post', () => {
    const post = mockBlogPost({
      body: [
        {
          _type: 'block',
          _key: MOCK_BLOCK_KEY,
          markDefs: [
            {
              _type: 'link',
              _key: MOCK_MARK_KEY,
              internalReference: mockReference(MOCK_LINKED_POST_ID),
            },
          ],
          children: [],
        },
      ],
    });
    const idMap = new Map([[MOCK_LINKED_POST_ID, MOCK_LINKED_PAGE_POST_ID]]);

    const { content } = buildPagePostFields(post, undefined, idMap);

    expect(content).toEqual([
      {
        _type: 'block',
        _key: MOCK_BLOCK_KEY,
        markDefs: [
          {
            _type: 'link',
            _key: MOCK_MARK_KEY,
            internalReference: mockReference(MOCK_LINKED_PAGE_POST_ID),
          },
        ],
        children: [],
      },
    ]);
  });
});
