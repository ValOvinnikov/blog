import type { TPostDetail } from '@blog/service';
import { AUTHOR_IMAGE_URL } from '@web/testing/shared/author/fixtures';

export const mockPostDetail: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImageUrl: 'https://cdn.example.com/hero.jpg',
  heroImageAlt: 'A hero image',
  heroImageSanity: undefined,
  featured: false,
  newsletterEnabled: true,
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body text.' }],
    },
  ],
  skim: undefined,
  hasAsides: false,
  seo: {
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the card.',
    ogTitle: 'Hello World',
    ogDescription: 'A sufficiently long excerpt for the card.',
    ogImageUrl: 'https://cdn.example.com/hero.jpg',
  },
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    slug: 'jane-doe',
    imageUrl: AUTHOR_IMAGE_URL,
    role: 'Writer',
    bio: [
      {
        _type: 'block',
        _key: 'bio1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'bio1s', text: 'A short bio.' }],
      },
    ],
    socialLinks: [],
  },
  topic: {
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: undefined,
  },
  tags: [],
  relatedPosts: [],
  readingTimeMinutes: 4,
};
