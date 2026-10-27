import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES, routes } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';
import { faker } from '@faker-js/faker';
import { MOCK_POST_DETAIL } from '@web/testing/pages/blog-post-page/fixtures';

import { buildBlogPostingSchema } from './build-blog-posting-schema';

faker.seed(101);

const MOCK_NL_POST_SLUG = faker.lorem.slug();
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

const { title, excerpt, publishedAt, slug, author } = MOCK_POST_DETAIL;

const buildInDefaultLanguage = (overrides: Partial<TPostDetail> = {}) =>
  buildBlogPostingSchema(
    { ...MOCK_POST_DETAIL, ...overrides },
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
      headline: title,
      description: excerpt,
      image: urlForSanityImage(MOCK_POST_DETAIL.heroImage!, MOCK_PROJECT),
      datePublished: publishedAt,
      dateModified: publishedAt,
      author: { '@type': 'Person', name: author.name },
      url: `${MOCK_BASE_URL}${routes.post(slug)}`,
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
      MOCK_POST_DETAIL,
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
        { ...MOCK_POST_DETAIL, slug: MOCK_NL_POST_SLUG },
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
