import type { TPostDetail } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

const POST_TITLE = 'Hello World';
const POST_EXCERPT = 'A sufficiently long excerpt for the card.';
const HERO_IMAGE_ALT = 'A hero image';

export const POST_DETAIL_AUTHOR_IMAGE = makeSanityImage({
  assetId: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7de-400x400-jpg',
  alt: 'Jane Doe',
});

export const mockPostDetail: TPostDetail = {
  id: 'post-1',
  title: POST_TITLE,
  slug: 'hello-world',
  excerpt: POST_EXCERPT,
  publishedAt: '2026-01-15T00:00:00Z',
  heroImage: makeSanityImage({ alt: HERO_IMAGE_ALT }),
  featured: false,
  body: [
    {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      children: [{ _type: 'span', _key: 's1', text: 'Body text.' }],
      markDefs: undefined,
    },
  ],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [{ id: 'related-1', type: 'module_postRelated' }],
  seo: mockSeo({
    title: POST_TITLE,
    description: POST_EXCERPT,
    ogTitle: POST_TITLE,
    ogDescription: POST_EXCERPT,
    ogImage: makeSanityImage({ alt: HERO_IMAGE_ALT }),
  }),
  author: {
    id: 'author-1',
    name: 'Jane Doe',
    profileUrl: '/jane-doe',
    image: POST_DETAIL_AUTHOR_IMAGE,
    role: 'Writer',
    bio: [
      {
        _type: 'block',
        _key: 'bio1',
        style: 'normal',
        children: [{ _type: 'span', _key: 'bio1s', text: 'A short bio.' }],
        markDefs: undefined,
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
  translations: [],
};
