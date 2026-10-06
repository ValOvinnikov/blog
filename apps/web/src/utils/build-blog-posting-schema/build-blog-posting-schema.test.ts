import { LOCALE_ISO_CODES } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { buildBlogPostingSchema } from './build-blog-posting-schema';

const project: TSanityProjectRef = {
  projectId: 'test-project',
  dataset: 'test-dataset',
};

const { EN, NL } = LOCALE_ISO_CODES;
const DEFAULT_LANGUAGE = { locale: EN, defaultLocale: EN };

const heroImage = makeSanityImage();

const post: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the post.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImage,
  featured: false,
  body: [],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [],
  seo: {
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the post.',
    ogTitle: 'Hello World',
    ogDescription: 'A sufficiently long excerpt for the post.',
    ogImage: heroImage,
  },
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
      new URL('https://example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello World',
      description: 'A sufficiently long excerpt for the post.',
      image: urlForSanityImage(heroImage, project),
      datePublished: '2026-01-15T00:00:00Z',
      dateModified: '2026-01-15T00:00:00Z',
      author: { '@type': 'Person', name: 'Jane Doe' },
      url: 'https://example.com/blog/hello-world',
      keywords: undefined,
    });
  });

  it('omits image when the post has no hero image', () => {
    const schema = buildBlogPostingSchema(
      { ...post, heroImage: undefined },
      new URL('https://example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.image).toBeUndefined();
  });

  it('builds an absolute url from the base URL and the post slug', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: 'another-post' },
      new URL('https://blog.example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.url).toBe('https://blog.example.com/blog/another-post');
  });

  it('prefixes the url with the post language when it is not the default', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: 'mijn-artikel' },
      new URL('https://blog.example.com'),
      project,
      { locale: NL, defaultLocale: EN },
    );

    expect(schema?.url).toBe('https://blog.example.com/nl/blog/mijn-artikel');
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
      new URL('https://example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.keywords).toBe('TypeScript, React');
  });

  it('omits keywords when the post has no tags', () => {
    const schema = buildBlogPostingSchema(
      post,
      new URL('https://example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.keywords).toBeUndefined();
  });

  it('omits description for a sparse post without throwing', () => {
    const schema = buildBlogPostingSchema(
      { ...post, excerpt: undefined },
      new URL('https://example.com'),
      project,
      DEFAULT_LANGUAGE,
    );

    expect(schema?.description).toBeUndefined();
  });
});
