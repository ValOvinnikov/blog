import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config/constants';
import { applyLandingRedirects } from '@blog/studio/document-actions/apply-landing-redirects/apply-landing-redirects';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import {
  mockLandingPage,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { mockUniqueSlugs } from '@blog/studio/testing/mock-unique-slugs';
import { faker } from '@faker-js/faker';
import { getDraftId, type SanityClient, type SanityDocument } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;
const COMMIT = 'commit';

faker.seed(6017);

const {
  FAQ: MOCK_FAQ_SLUG,
  HELP: MOCK_HELP_SLUG,
  QUESTIONS: MOCK_QUESTIONS_SLUG,
  MODULES: MOCK_MODULES_SLUG,
  CATALOG: MOCK_CATALOG_SLUG,
  PRICING: MOCK_PRICING_SLUG,
} = mockUniqueSlugs([
  'FAQ',
  'HELP',
  'QUESTIONS',
  'MODULES',
  'CATALOG',
  'PRICING',
]);
const MOCK_FAQ_ID = faker.string.uuid();
const MOCK_HELP_ID = faker.string.uuid();
const MOCK_MODULES_ID = faker.string.uuid();
const MOCK_PRICING_ID = faker.string.uuid();
const MOCK_FAQ_DRAFT_ID = getDraftId(MOCK_FAQ_ID);
const MOCK_REDIRECT_ID = faker.string.uuid();
const MOCK_OLD_PATH_REDIRECT_ID = faker.string.uuid();
const MOCK_OTHER_LANGUAGE_REDIRECT_ID = faker.string.uuid();

const MOCK_FAQ_PATH = `/${MOCK_FAQ_SLUG}`;
const MOCK_HELP_FAQ_PATH = `/${MOCK_HELP_SLUG}/${MOCK_FAQ_SLUG}`;
const MOCK_QUESTIONS_PATH = `/${MOCK_QUESTIONS_SLUG}`;

const mockAutomaticRedirect = (
  source: string,
  destination: string,
  isPrefix = false,
) => ({
  _type: REDIRECT_TYPE,
  language: EN,
  source,
  destination,
  isPrefix,
  status: REDIRECT_STATUS.PERMANENT,
  isAutomatic: true,
});

const createClient = (dataset: unknown[]) => {
  const operations: unknown[] = [];
  const transaction = {
    delete: (id: string) => {
      operations.push({ delete: id });
      return transaction;
    },
    patch: (
      id: string,
      build: (patch: { set: (value: unknown) => unknown }) => unknown,
    ) => {
      build({ set: (value) => operations.push({ patch: id, set: value }) });
      return transaction;
    },
    create: (document: unknown) => {
      operations.push({ create: document });
      return transaction;
    },
    commit: async () => {
      operations.push(COMMIT);
    },
  };
  const client = {
    fetch: mockGroqFetch(dataset),
    transaction: () => transaction,
  } as unknown as Pick<SanityClient, 'fetch' | 'transaction'>;

  return { client, operations };
};

describe(applyLandingRedirects, () => {
  let faq: SanityDocument;
  let help: SanityDocument;
  let faqDraft: SanityDocument;

  beforeEach(() => {
    faq = mockLandingPage({
      _id: MOCK_FAQ_ID,
      slug: MOCK_FAQ_SLUG,
      language: EN,
    });
    help = mockLandingPage({
      _id: MOCK_HELP_ID,
      slug: MOCK_HELP_SLUG,
      language: EN,
    });
    faqDraft = mockLandingPage({
      _id: MOCK_FAQ_DRAFT_ID,
      slug: MOCK_FAQ_SLUG,
      language: EN,
    });
  });

  describe('with a single faq page', () => {
    let client: ReturnType<typeof createClient>['client'];
    let operations: ReturnType<typeof createClient>['operations'];

    beforeEach(() => {
      ({ client, operations } = createClient([faq]));
    });

    it('redirects a renamed page from its old path, automatic and permanent', async () => {
      await applyLandingRedirects(
        client,
        mockLandingPage({
          _id: MOCK_FAQ_DRAFT_ID,
          slug: MOCK_QUESTIONS_SLUG,
          language: EN,
        }),
      );

      expect(operations).toEqual([
        { create: mockAutomaticRedirect(MOCK_FAQ_PATH, MOCK_QUESTIONS_PATH) },
        COMMIT,
      ]);
    });

    it('writes nothing when the path is unchanged', async () => {
      await applyLandingRedirects(client, faqDraft);

      expect(operations).toEqual([]);
    });
  });

  it('redirects a re-parented page to its path under the new parent', async () => {
    const { client, operations } = createClient([help, faq]);

    await applyLandingRedirects(
      client,
      mockLandingPage({
        _id: MOCK_FAQ_DRAFT_ID,
        slug: MOCK_FAQ_SLUG,
        parent: MOCK_HELP_ID,
        language: EN,
      }),
    );

    expect(operations).toEqual([
      { create: mockAutomaticRedirect(MOCK_FAQ_PATH, MOCK_HELP_FAQ_PATH) },
      COMMIT,
    ]);
  });

  it('makes a prefix redirect when a renamed parent has sub-pages', async () => {
    const { client, operations } = createClient([
      mockLandingPage({
        _id: MOCK_MODULES_ID,
        slug: MOCK_MODULES_SLUG,
        language: EN,
      }),
      mockLandingPage({
        _id: MOCK_FAQ_ID,
        slug: MOCK_FAQ_SLUG,
        parent: MOCK_MODULES_ID,
        language: EN,
      }),
      mockLandingPage({
        _id: MOCK_PRICING_ID,
        slug: MOCK_PRICING_SLUG,
        parent: MOCK_MODULES_ID,
        language: EN,
      }),
    ]);

    await applyLandingRedirects(
      client,
      mockLandingPage({
        _id: getDraftId(MOCK_MODULES_ID),
        slug: MOCK_CATALOG_SLUG,
        language: EN,
      }),
    );

    expect(operations).toEqual([
      {
        create: mockAutomaticRedirect(
          `/${MOCK_MODULES_SLUG}`,
          `/${MOCK_CATALOG_SLUG}`,
          true,
        ),
      },
      COMMIT,
    ]);
  });

  it('collapses and clears existing redirects in the same language only', async () => {
    const { client, operations } = createClient([
      mockLandingPage({
        _id: MOCK_FAQ_ID,
        slug: MOCK_FAQ_SLUG,
        parent: MOCK_HELP_ID,
        language: EN,
      }),
      help,
      mockRedirect({
        _id: MOCK_REDIRECT_ID,
        source: MOCK_QUESTIONS_PATH,
        destination: MOCK_HELP_FAQ_PATH,
      }),
      mockRedirect({
        _id: MOCK_OLD_PATH_REDIRECT_ID,
        source: MOCK_FAQ_PATH,
        destination: MOCK_HELP_FAQ_PATH,
      }),
      mockRedirect({
        _id: MOCK_OTHER_LANGUAGE_REDIRECT_ID,
        source: MOCK_QUESTIONS_PATH,
        destination: MOCK_HELP_FAQ_PATH,
        language: NL,
      }),
    ]);

    await applyLandingRedirects(client, faqDraft);

    expect(operations).toEqual([
      { delete: MOCK_OLD_PATH_REDIRECT_ID },
      { patch: MOCK_REDIRECT_ID, set: { destination: MOCK_FAQ_PATH } },
      { create: mockAutomaticRedirect(MOCK_HELP_FAQ_PATH, MOCK_FAQ_PATH) },
      COMMIT,
    ]);
  });

  it('writes nothing on a first publish', async () => {
    const { client, operations } = createClient([]);

    await applyLandingRedirects(client, faqDraft);

    expect(operations).toEqual([]);
  });
});
