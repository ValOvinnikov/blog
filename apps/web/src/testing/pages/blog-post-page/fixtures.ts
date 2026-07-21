import type { TPostDetail } from '@blog/service';

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
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body text.' }],
    },
  ],
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
    imageUrl: 'https://cdn.example.com/jane.jpg',
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
  categories: [
    {
      id: 'cat-1',
      title: 'Engineering',
      slug: 'engineering',
      description: undefined,
    },
  ],
};
