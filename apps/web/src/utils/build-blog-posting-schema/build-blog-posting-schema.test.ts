import { LOCALE_ISO_CODES } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

import { buildBlogPostingSchema } from './build-blog-posting-schema';

const POST_TITLE = 'Hello World';
const POST_EXCERPT = 'A sufficiently long excerpt for the post.';
const PUBLISHED_AT = '2026-01-15T00:00:00Z';
const BASE_URL = 'https://example.com';
const CUSTOM_DOMAIN_URL = 'https://blog.example.com';
const NL_POST_SLUG = 'mijn-artikel';

const project: TSanityProjectRef = {
  projectId: 'test-project',
  dataset: 'test-dataset',
};

const { EN, NL } = LOCALE_ISO_CODES;
const DEFAULT_LANGUAGE = { locale: EN, defaultLocale: EN };

const heroImage = makeSanityImage();

const post: TPostDetail = {
  id: 'post-1',
  title: POST_TITLE,
  slug: 'hello-world',
  excerpt: POST_EXCERPT,
  publishedAt: PUBLISHED_AT,
  heroImage,
  featured: false,
  body: [],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [],
  seo: mockSeo({
    title: POST_TITLE,
    description: POST_EXCERPT,
    ogTitle: POST_TITLE,
    ogDescription: POST_EXCERPT,
    ogImage: heroImage,
  }),
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profileUrl: '/jane-doe',
    image: undefined,
    role: undefined,
    bio: undefined,
    socialLinks: [],
  },
  topic: {
    id: 'topic-1',
    title: 'News',
    slug: 'news',
    description: undefined,
  },
  tags: [],
  readingTimeMinutes: 4,
  translations: [],
};

describe(buildBlogPostingSchema, () => {
  it('maps a post detail to a BlogPosting schema', () => {
    const schema = buildBlogPostingSchema(
      post,
      new URL(BASE_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: POST_TITLE,
      description: POST_EXCERPT,
      image: urlForSanityImage(heroImage, project),
      datePublished: PUBLISHED_AT,
      dateModified: PUBLISHED_AT,
      author: { '@type': 'Person', name: 'Jane Doe' },
      url: 'https://example.com/blog/hello-world',
      keywords: undefined,
      inLanguage: 'en',
    });
  });

  it('omits image when the post has no hero image', () => {
    const schema = buildBlogPostingSchema(
      { ...post, heroImage: undefined },
      new URL(BASE_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.image).toBeUndefined();
  });

  it('builds an absolute url from the base URL and the post slug', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: 'another-post' },
      new URL(CUSTOM_DOMAIN_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.url).toBe('https://blog.example.com/blog/another-post');
  });

  it('prefixes the url with the post language when it is not the default', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: NL_POST_SLUG },
      new URL(CUSTOM_DOMAIN_URL),
      project,
      { locale: NL, defaultLocale: EN },
    );

    expect(schema?.url).toBe('https://blog.example.com/nl/blog/mijn-artikel');
  });

  it('sets inLanguage to the language of a non-default post', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: NL_POST_SLUG },
      new URL(CUSTOM_DOMAIN_URL),
      project,
      { locale: NL, defaultLocale: EN },
    );

    expect(schema?.inLanguage).toBe('nl');
  });

  it('returns undefined when there is no base URL, rather than emitting a relative (invalid) url', () => {
    const schema = buildBlogPostingSchema(
      post,
      undefined,
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema).toBeUndefined();
  });

  it('builds comma-separated keywords from the post tags', () => {
    const schema = buildBlogPostingSchema(
      {
        ...post,
        tags: [
          { id: 'tag-1', title: 'TypeScript', slug: 'typescript' },
          { id: 'tag-2', title: 'React', slug: 'react' },
        ],
      },
      new URL(BASE_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.keywords).toBe('TypeScript, React');
  });

  it('omits keywords when the post has no tags', () => {
    const schema = buildBlogPostingSchema(
      post,
      new URL(BASE_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.keywords).toBeUndefined();
  });

  it('omits description for a sparse post without throwing', () => {
    const schema = buildBlogPostingSchema(
      { ...post, excerpt: undefined },
      new URL(BASE_URL),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.description).toBeUndefined();
  });
});
