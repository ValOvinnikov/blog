import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import {
  AUTOMATIC_REDIRECT_EDITED_WARNING,
  REDIRECT_DESTINATION_UNPUBLISHED_ERROR,
  REDIRECT_SOURCE_SHADOWED_WARNING,
  validateAutomaticRedirectUnchanged,
  validateRedirectDestinationPage,
  validateRedirectSourcePage,
} from '@blog/studio/schema-types/validation/validate-redirect-page/validate-redirect-page';
import {
  MOCK_REDIRECT_SOURCE,
  mockPage,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';
import { getDraftId } from 'sanity';

faker.seed(6017);

const { EN, NL } = LOCALE_ISO_CODES;

const BLOG_ROUTE = '/blog';
const TOPICS_ROUTE = '/topics';

const MOCK_SERVICES_ID = faker.string.uuid();
const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_SERVICES_SLUG = faker.lorem.slug(2);
const MOCK_DESIGN_SLUG = faker.lorem.slug(2);
const MOCK_POST_SLUG = faker.lorem.slug(2);
const MOCK_TOPIC_SLUG = faker.lorem.slug(2);
const MOCK_DUTCH_ONLY_SLUG = faker.lorem.slug(2);
const MOCK_MISSING_SLUG = faker.lorem.slug(2);
const MOCK_EDITED_PATH = `/${faker.lorem.slug(2)}`;

const MOCK_DESIGN_PATH = `/${MOCK_SERVICES_SLUG}/${MOCK_DESIGN_SLUG}`;

const MOCK_PAGES = [
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: MOCK_SERVICES_ID,
    slug: MOCK_SERVICES_SLUG,
    language: EN,
  }),
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: faker.string.uuid(),
    slug: MOCK_DESIGN_SLUG,
    language: EN,
    parent: MOCK_SERVICES_ID,
  }),
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: faker.string.uuid(),
    slug: MOCK_DESIGN_SLUG,
    language: NL,
  }),
  mockPage({
    _type: PAGE_LANDING_TYPE,
    _id: faker.string.uuid(),
    slug: MOCK_DUTCH_ONLY_SLUG,
    language: NL,
  }),
  mockPage({
    _type: PAGE_POST_TYPE,
    _id: faker.string.uuid(),
    slug: MOCK_POST_SLUG,
    language: EN,
  }),
  mockPage({
    _type: PAGE_TOPIC_TYPE,
    _id: faker.string.uuid(),
    slug: MOCK_TOPIC_SLUG,
    language: EN,
  }),
];

const draftRedirect = mockRedirect({ _id: getDraftId(MOCK_REDIRECT_ID) });
const redirectContext = mockGroqValidationContext(MOCK_PAGES, {
  document: draftRedirect,
});
const failingRedirectContext = mockGroqValidationContext(MOCK_PAGES, {
  document: draftRedirect,
  fetchError: MOCK_FETCH_ERROR,
});

describe(validateRedirectDestinationPage, () => {
  it.each([
    `/${MOCK_SERVICES_SLUG}`,
    MOCK_DESIGN_PATH,
    `${BLOG_ROUTE}/${MOCK_POST_SLUG}`,
    `${TOPICS_ROUTE}/${MOCK_TOPIC_SLUG}`,
    `${TOPICS_ROUTE}/${MOCK_TOPIC_SLUG}/page/2`,
    '/',
    BLOG_ROUTE,
    `${BLOG_ROUTE}/page/3`,
    '/account',
  ])('passes %s, where a page is live', async (path) => {
    await expect(
      validateRedirectDestinationPage(path, redirectContext),
    ).resolves.toBe(true);
  });

  it.each([
    `/${MOCK_MISSING_SLUG}`,
    `/${MOCK_DESIGN_SLUG}`,
    `/${MOCK_SERVICES_SLUG}/${MOCK_MISSING_SLUG}`,
    `${BLOG_ROUTE}/${MOCK_MISSING_SLUG}`,
    `${BLOG_ROUTE}/${MOCK_POST_SLUG}/extra`,
    `/tags/${MOCK_TOPIC_SLUG}`,
  ])('blocks %s, where no page is published', async (path) => {
    await expect(
      validateRedirectDestinationPage(path, redirectContext),
    ).resolves.toBe(REDIRECT_DESTINATION_UNPUBLISHED_ERROR);
  });

  it('blocks a page that is only published in another language', async () => {
    await expect(
      validateRedirectDestinationPage(
        `/${MOCK_DUTCH_ONLY_SLUG}`,
        redirectContext,
      ),
    ).resolves.toBe(REDIRECT_DESTINATION_UNPUBLISHED_ERROR);
  });

  it('passes a destination when the page lookup fails', async () => {
    await expect(
      validateRedirectDestinationPage(
        `/${MOCK_MISSING_SLUG}`,
        failingRedirectContext,
      ),
    ).resolves.toBe(true);
  });
});

describe(validateRedirectSourcePage, () => {
  it('warns when a page is published at the source', async () => {
    await expect(
      validateRedirectSourcePage(MOCK_DESIGN_PATH, redirectContext),
    ).resolves.toBe(REDIRECT_SOURCE_SHADOWED_WARNING);
  });

  it('passes a source with no published page', async () => {
    await expect(
      validateRedirectSourcePage(`/${MOCK_MISSING_SLUG}`, redirectContext),
    ).resolves.toBe(true);
  });

  it('passes a source when the page lookup fails', async () => {
    await expect(
      validateRedirectSourcePage(MOCK_DESIGN_PATH, failingRedirectContext),
    ).resolves.toBe(true);
  });
});

describe(validateAutomaticRedirectUnchanged, () => {
  const publishedAutomatic = mockRedirect({
    _id: MOCK_REDIRECT_ID,
    isAutomatic: true,
  });

  it.each(['source', 'destination'] as const)(
    'warns when the %s of an automatic redirect is changed',
    async (field) => {
      const draft = mockRedirect({
        _id: getDraftId(MOCK_REDIRECT_ID),
        isAutomatic: true,
        [field]: MOCK_EDITED_PATH,
      });

      await expect(
        validateAutomaticRedirectUnchanged(field)(
          MOCK_EDITED_PATH,
          mockGroqValidationContext([publishedAutomatic], { document: draft }),
        ),
      ).resolves.toBe(AUTOMATIC_REDIRECT_EDITED_WARNING);
    },
  );

  it('passes an automatic redirect left as it was created', async () => {
    const draft = mockRedirect({
      _id: getDraftId(MOCK_REDIRECT_ID),
      isAutomatic: true,
    });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        MOCK_REDIRECT_SOURCE,
        mockGroqValidationContext([publishedAutomatic], { document: draft }),
      ),
    ).resolves.toBe(true);
  });

  it('passes a changed manual redirect', async () => {
    const draft = mockRedirect({
      _id: getDraftId(MOCK_REDIRECT_ID),
      source: MOCK_EDITED_PATH,
    });

    await expect(
      validateAutomaticRedirectUnchanged('source')(
        MOCK_EDITED_PATH,
        mockGroqValidationContext([mockRedirect({ _id: MOCK_REDIRECT_ID })], {
          document: draft,
        }),
      ),
    ).resolves.toBe(true);
  });
});
