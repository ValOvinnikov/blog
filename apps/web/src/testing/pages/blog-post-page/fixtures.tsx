import type { TPostDetail } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

export const POST_DETAIL_AUTHOR_IMAGE = makeSanityImage({
  assetId: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7de-400x400-jpg',
  alt: 'Jane Doe',
});

export const mockPostDetail: TPostDetail = {
  id: 'post-1',
  title: 'Hello World',
  slug: 'hello-world',
  excerpt: 'A sufficiently long excerpt for the card.',
  publishedAt: '2026-01-15T00:00:00Z',
  heroImage: makeSanityImage({ alt: 'A hero image' }),
  featured: false,
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
  modules: [{ id: 'related-1', type: 'module_postRelated' }],
  seo: {
    title: 'Hello World',
    description: 'A sufficiently long excerpt for the card.',
    ogTitle: 'Hello World',
    ogDescription: 'A sufficiently long excerpt for the card.',
    ogImage: makeSanityImage({ alt: 'A hero image' }),
  },
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profilePageSlug: 'jane-doe',
    image: POST_DETAIL_AUTHOR_IMAGE,
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
  readingTimeMinutes: 4,
};
