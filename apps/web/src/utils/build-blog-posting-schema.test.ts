import type { TPostDetail } from '@blog/service';

import { buildBlogPostingSchema } from './build-blog-posting-schema';

const post: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the post.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: 'https://cdn.example.com/hero.jpg',
  heroImageAlt: 'A hero image',
  heroImageSanity: undefined,
  featured: false,
  body: [],
  seo: {
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the post.',
    ogTitle: 'Hello World',
    ogDescription: 'A sufficiently long excerpt for the post.',
    ogImageUrl: 'https://cdn.example.com/hero.jpg',
  },
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: undefined,
    role: undefined,
    bio: undefined,
    socialLinks: [],
  },
  categories: [],
  tags: [],
  relatedPosts: [],
};

describe(buildBlogPostingSchema, () => {
  it('maps a post detail to a BlogPosting schema', () => {
    const schema = buildBlogPostingSchema(post, 'https://example.com');

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello World',
      description: 'A sufficiently long excerpt for the post.',
      image: 'https://cdn.example.com/hero.jpg',
      datePublished: '2026-01-15T00:00:00Z',
      dateModified: '2026-01-15T00:00:00Z',
      author: { '@type': 'Person', name: 'Jane Doe' },
      url: 'https://example.com/blog/hello-world',
      keywords: undefined,
    });
  });

  it('omits image when the post has no hero image', () => {
    const schema = buildBlogPostingSchema(
      { ...post, heroImageUrl: undefined },
      'https://example.com',
    );

    expect(schema?.image).toBeUndefined();
  });

  it('omits author when the post has no resolved author', () => {
    const schema = buildBlogPostingSchema(
      { ...post, author: undefined },
      'https://example.com',
    );

    expect(schema?.author).toBeUndefined();
  });

  it('builds an absolute url from siteUrl and the post slug', () => {
    const schema = buildBlogPostingSchema(
      { ...post, slug: 'another-post' },
      'https://blog.example.com',
    );

    expect(schema?.url).toBe('https://blog.example.com/blog/another-post');
  });

  it('returns undefined when siteUrl is empty, rather than emitting a relative (invalid) url', () => {
    const schema = buildBlogPostingSchema(post, '');

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
      'https://example.com',
    );

    expect(schema?.keywords).toBe('TypeScript, React');
  });

  it('omits keywords when the post has no tags', () => {
    const schema = buildBlogPostingSchema(post, 'https://example.com');

    expect(schema?.keywords).toBeUndefined();
  });
});
