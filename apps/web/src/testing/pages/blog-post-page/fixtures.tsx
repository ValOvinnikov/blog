import type { TPostDetail } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

faker.seed(61037);

const MOCK_POST_TITLE = faker.lorem.sentence();
const MOCK_POST_EXCERPT = faker.lorem.sentence();
const MOCK_HERO_IMAGE_ALT = faker.lorem.words(3);
const MOCK_AUTHOR_NAME = faker.person.fullName();
const MOCK_TOPIC_TITLE = faker.lorem.word();

export const MOCK_POST_DETAIL_BODY_TEXT = faker.lorem.sentence();

export const MOCK_POST_DETAIL_AUTHOR_IMAGE = mockSanityImage({
  assetId: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7de-400x400-jpg',
  alt: MOCK_AUTHOR_NAME,
});

export const MOCK_POST_DETAIL: TPostDetail = {
  id: faker.string.uuid(),
  title: MOCK_POST_TITLE,
  slug: faker.lorem.slug(2),
  excerpt: MOCK_POST_EXCERPT,
  publishedAt: '2026-01-15T00:00:00Z',
  heroImage: mockSanityImage({ alt: MOCK_HERO_IMAGE_ALT }),
  featured: false,
  body: [mockPortableTextBlock(MOCK_POST_DETAIL_BODY_TEXT)],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [{ id: faker.string.uuid(), type: 'module_postRelated' }],
  seo: mockSeo({
    title: MOCK_POST_TITLE,
    description: MOCK_POST_EXCERPT,
    ogTitle: MOCK_POST_TITLE,
    ogDescription: MOCK_POST_EXCERPT,
    ogImage: mockSanityImage({ alt: MOCK_HERO_IMAGE_ALT }),
  }),
  author: {
    id: faker.string.uuid(),
    name: MOCK_AUTHOR_NAME,
    profileUrl: `/${faker.lorem.slug(2)}`,
    image: MOCK_POST_DETAIL_AUTHOR_IMAGE,
    role: faker.person.jobTitle(),
    bio: [mockPortableTextBlock(faker.lorem.sentence())],
    socialLinks: [],
  },
  topic: {
    id: faker.string.uuid(),
    title: MOCK_TOPIC_TITLE,
    slug: faker.lorem.slug(1),
    description: undefined,
  },
  tags: [],
  readingTimeMinutes: faker.number.int({ min: 2, max: 20 }),
  translations: [],
};
