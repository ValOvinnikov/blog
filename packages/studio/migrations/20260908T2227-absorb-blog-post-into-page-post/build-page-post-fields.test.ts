import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/post';
import { assertSatisfiesRequiredFields } from '@blog/studio/testing/assert-satisfies-required-fields';

import {
  buildPagePostFields,
  type TBlogPostDoc,
} from './build-page-post-fields';
import { SHARED_MODULE_IDS } from './shared-modules';

const basePost: TBlogPostDoc = {
  _id: 'post-1',
  title: 'Understanding GROQ',
  slug: { _type: 'slug', current: 'understanding-groq' },
  excerpt:
    'A deep dive into GROQ query composition, filters, and projections for real-world Sanity schemas.',
  heroImage: { _type: 'imageWithAlt', alt: 'A GROQ query' },
  author: { _type: 'reference', _ref: 'author-1' },
  topic: { _type: 'reference', _ref: 'topic-1' },
  tags: [{ _type: 'reference', _key: 'a', _ref: 'tag-1' }],
  publishedAt: '2026-02-01T09:00:00Z',
  body: [
    {
      _type: 'block',
      _key: 'block-1',
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'span-1', text: 'Hello' }],
    },
  ],
  featured: true,
  newsletterEnabled: true,
  skim: { takeaways: ['Fast', 'Composable'] },
  seo: { metaTitle: 'Understanding GROQ' },
};

describe('buildPagePostFields — no existing page_post (production shape)', () => {
  it('sets every content field from the post', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.heroImage).toEqual(basePost.heroImage);
    expect(fields.author).toEqual(basePost.author);
    expect(fields.topic).toEqual(basePost.topic);
    expect(fields.tags).toEqual(basePost.tags);
    expect(fields.content).toEqual(basePost.body);
    expect(fields.featured).toBe(true);
    expect(fields.skim).toEqual(basePost.skim);
  });

  it('sets the internal title from the post title so the desk list is readable', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.title).toBe(basePost.title);
  });

  it('moves the post title and excerpt into sectionHeader', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.sectionHeader).toEqual({
      _type: 'requiredHeadingSectionHeader',
      heading: basePost.title,
      supportingText: basePost.excerpt,
    });
  });

  it('falls back to the post slug, publishedAt and seo when no page exists', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.slug).toEqual(basePost.slug);
    expect(fields.publishedAt).toBe(basePost.publishedAt);
    expect(fields.seo).toEqual(basePost.seo);
  });

  it('has no post reference field — the page absorbed the post directly', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.post).toBeUndefined();
  });

  it('includes both shared modules when newsletterEnabled is true', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    expect(fields.modules).toEqual([
      {
        _type: 'reference',
        _key: 'postRelated',
        _ref: SHARED_MODULE_IDS.POST_RELATED,
      },
      {
        _type: 'reference',
        _key: 'newsletter',
        _ref: SHARED_MODULE_IDS.NEWSLETTER,
      },
    ]);
  });

  it('omits the newsletter module when newsletterEnabled is false', () => {
    const fields = buildPagePostFields(
      { ...basePost, newsletterEnabled: false },
      undefined,
      new Map(),
    );

    expect(fields.modules).toEqual([
      {
        _type: 'reference',
        _key: 'postRelated',
        _ref: SHARED_MODULE_IDS.POST_RELATED,
      },
    ]);
  });

  it('includes the newsletter module when newsletterEnabled is left unset', () => {
    const postWithoutFlag: TBlogPostDoc = { ...basePost };
    delete postWithoutFlag.newsletterEnabled;

    const fields = buildPagePostFields(postWithoutFlag, undefined, new Map());
    const modules = fields.modules as { _ref: string }[];

    expect(modules.map((module) => module._ref)).toContain(
      SHARED_MODULE_IDS.NEWSLETTER,
    );
  });

  it('produces a payload satisfying every field page_post requires', () => {
    const fields = buildPagePostFields(basePost, undefined, new Map());

    assertSatisfiesRequiredFields(pagePostSchema, {
      _id: 'page_post-post-1',
      _type: 'page_post',
      ...fields,
    });
  });
});

describe('buildPagePostFields — an existing page_post already carries its own values', () => {
  const existingPagePost = {
    title: 'Editor-Chosen Wrapper Label',
    slug: { _type: 'slug' as const, current: 'custom-slug' },
    publishedAt: '2025-12-01T00:00:00Z',
    seo: { metaTitle: 'Custom SEO title' },
  };

  it('keeps the page’s own slug, publishedAt and seo', () => {
    const fields = buildPagePostFields(basePost, existingPagePost, new Map());

    expect(fields.slug).toEqual(existingPagePost.slug);
    expect(fields.publishedAt).toBe(existingPagePost.publishedAt);
    expect(fields.seo).toEqual(existingPagePost.seo);
  });

  it('preserves the page’s own title rather than overwriting it with the post’s title', () => {
    const fields = buildPagePostFields(basePost, existingPagePost, new Map());

    expect(fields.title).toBe(existingPagePost.title);
  });

  it('still derives sectionHeader from the post, independent of the existing title', () => {
    const fields = buildPagePostFields(basePost, existingPagePost, new Map());

    expect(fields.sectionHeader).toEqual({
      _type: 'requiredHeadingSectionHeader',
      heading: basePost.title,
      supportingText: basePost.excerpt,
    });
  });

  it('falls back to the post’s own field when the page never set it', () => {
    const fields = buildPagePostFields(basePost, {}, new Map());

    expect(fields.title).toBe(basePost.title);
    expect(fields.slug).toEqual(basePost.slug);
    expect(fields.publishedAt).toBe(basePost.publishedAt);
    expect(fields.seo).toEqual(basePost.seo);
  });
});

describe('buildPagePostFields — internal links inside content get rewritten', () => {
  it('rewrites an internal reference markDef pointing at another migrated post', () => {
    const postWithLink: TBlogPostDoc = {
      ...basePost,
      body: [
        {
          _type: 'block',
          _key: 'block-1',
          markDefs: [
            {
              _type: 'link',
              _key: 'mark-1',
              internalReference: { _type: 'reference', _ref: 'post-2' },
            },
          ],
          children: [],
        },
      ],
    };
    const idMap = new Map([['post-2', 'page_post-post-2']]);

    const fields = buildPagePostFields(postWithLink, undefined, idMap);
    const content = fields.content as {
      markDefs: { internalReference: { _ref: string } }[];
    }[];

    expect(content[0]!.markDefs[0]!.internalReference._ref).toBe(
      'page_post-post-2',
    );
  });
});

describe('buildPagePostFields — idempotency', () => {
  it('produces the same fields on a second call given the same inputs', () => {
    const first = buildPagePostFields(basePost, undefined, new Map());
    const second = buildPagePostFields(basePost, undefined, new Map());

    expect(second).toEqual(first);
  });

  it('produces the same result whether or not a prior run already migrated the page', () => {
    const firstRunResult = buildPagePostFields(basePost, undefined, new Map());
    const secondRunResult = buildPagePostFields(
      basePost,
      {
        title: firstRunResult.title as string,
        slug: firstRunResult.slug as { _type: 'slug'; current?: string },
        publishedAt: firstRunResult.publishedAt as string,
        seo: firstRunResult.seo as Record<string, unknown>,
      },
      new Map(),
    );

    expect(secondRunResult).toEqual(firstRunResult);
  });
});
