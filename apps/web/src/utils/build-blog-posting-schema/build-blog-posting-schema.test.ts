import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

import { buildBlogPostingSchema } from './build-blog-posting-schema';

faker.seed(101);

const MOCK_POST_TITLE = faker.lorem.sentence();
const MOCK_POST_EXCERPT = faker.lorem.sentences(2);
const MOCK_PUBLISHED_AT = faker.date
  .past({ refDate: '2026-06-01T00:00:00Z' })
  .toISOString();
const MOCK_POST_SLUG = faker.lorem.slug();
const MOCK_NL_POST_SLUG = faker.lorem.slug();
const MOCK_AUTHOR_NAME = faker.person.fullName();
const MOCK_BASE_URL = faker.internet.url({ appendSlash: false });
const MOCK_CUSTOM_DOMAIN_URL = faker.internet.url({ appendSlash: false });
const [MOCK_FIRST_TAG_TITLE, MOCK_SECOND_TAG_TITLE] = faker.helpers.uniqueArray(
  faker.lorem.word,
  2,
);

const MOCK_PROJECT: TSanityProjectRef = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.lorem.word(),
};

const { EN, NL } = LOCALE_ISO_CODES;
const DEFAULT_LANGUAGE = { locale: EN, defaultLocale: EN };

const MOCK_HERO_IMAGE = mockSanityImage();

const MOCK_POST: TPostDetail = {
  id: faker.string.uuid(),
  title: MOCK_POST_TITLE,
  slug: MOCK_POST_SLUG,
  excerpt: MOCK_POST_EXCERPT,
  publishedAt: MOCK_PUBLISHED_AT,
  heroImage: MOCK_HERO_IMAGE,
  featured: false,
  body: [],
  postTakeaways: undefined,
  hasAsides: false,
  modules: [],
  seo: mockSeo({
    title: MOCK_POST_TITLE,
    description: MOCK_POST_EXCERPT,
    ogTitle: MOCK_POST_TITLE,
    ogDescription: MOCK_POST_EXCERPT,
    ogImage: MOCK_HERO_IMAGE,
  }),
  author: {
    id: faker.string.uuid(),
    name: MOCK_AUTHOR_NAME,
    profileUrl: `/${faker.lorem.slug()}`,
    image: undefined,
    role: undefined,
    bio: undefined,
    socialLinks: [],
  },
  topic: {
    id: faker.string.uuid(),
    title: faker.lorem.word(),
    slug: faker.lorem.slug(),
    description: undefined,
  },
  tags: [],
  readingTimeMinutes: 4,
  translations: [],
};

const buildInDefaultLanguage = (overrides: Partial<TPostDetail> = {}) =>
  buildBlogPostingSchema(
    { ...MOCK_POST, ...overrides },
    new URL(MOCK_BASE_URL),
    MOCK_PROJECT,
    DEFAULT_LANGUAGE,
  );

describe(buildBlogPostingSchema, () => {
  it('maps a post detail to a BlogPosting schema', () => {
    const schema = buildInDefaultLanguage();

    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: MOCK_POST_TITLE,
      description: MOCK_POST_EXCERPT,
      image: urlForSanityImage(MOCK_HERO_IMAGE, MOCK_PROJECT),
      datePublished: MOCK_PUBLISHED_AT,
      dateModified: MOCK_PUBLISHED_AT,
      author: { '@type': 'Person', name: MOCK_AUTHOR_NAME },
      url: `${MOCK_BASE_URL}${routes.post(MOCK_POST_SLUG)}`,
      keywords: undefined,
      inLanguage: LOCALE_BCP47_TAGS.EN,
    });
  });

  it('omits image when the post has no hero image', () => {
    const schema = buildInDefaultLanguage({ heroImage: undefined });

    expect(schema?.image).toBeUndefined();
  });

  it('omits description when the post has no excerpt', () => {
    const schema = buildInDefaultLanguage({ excerpt: undefined });

    expect(schema?.description).toBeUndefined();
  });

  it('builds comma-separated keywords from the post tags', () => {
    const schema = buildInDefaultLanguage({
      tags: [
        {
          id: faker.string.uuid(),
          title: MOCK_FIRST_TAG_TITLE!,
          slug: faker.lorem.slug(),
        },
        {
          id: faker.string.uuid(),
          title: MOCK_SECOND_TAG_TITLE!,
          slug: faker.lorem.slug(),
        },
      ],
    });

    expect(schema?.keywords).toBe(
      `${MOCK_FIRST_TAG_TITLE}, ${MOCK_SECOND_TAG_TITLE}`,
    );
  });

  it('returns undefined when there is no base URL', () => {
    const schema = buildBlogPostingSchema(
      MOCK_POST,
      undefined,
      MOCK_PROJECT,
      DEFAULT_LANGUAGE,
    );

    expect(schema).toBeUndefined();
  });

  describe('for a post in a non-default language', () => {
    let schema: ReturnType<typeof buildBlogPostingSchema>;

    beforeEach(() => {
      schema = buildBlogPostingSchema(
        { ...MOCK_POST, slug: MOCK_NL_POST_SLUG },
        new URL(MOCK_CUSTOM_DOMAIN_URL),
        MOCK_PROJECT,
        { locale: NL, defaultLocale: EN },
      );
    });

    it('prefixes the url with the post language', () => {
      expect(schema?.url).toBe(
        `${MOCK_CUSTOM_DOMAIN_URL}/${LOCALE_BCP47_TAGS.NL}${routes.post(MOCK_NL_POST_SLUG)}`,
      );
    });

    it('sets inLanguage to the post language', () => {
      expect(schema?.inLanguage).toBe(LOCALE_BCP47_TAGS.NL);
    });
  });
});
