import { LOCALE_ISO_CODES, REDIRECT_STATUS } from '@blog/config/constants';
import { applyLandingRedirects } from '@blog/studio/document-actions/apply-landing-redirects/apply-landing-redirects';
import { REDIRECT_TYPE } from '@blog/studio/schema-types/documents/redirect/redirect-type';
import {
  mockLandingPage,
  mockRedirect,
} from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import type { SanityClient, SanityDocument } from 'sanity';

const { EN, NL } = LOCALE_ISO_CODES;

const FAQ_DRAFT_ID = 'drafts.faq';
const QUESTIONS_PATH = '/questions';

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
      operations.push('commit');
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
    faq = mockLandingPage({ _id: 'faq', slug: 'faq', language: EN });
    help = mockLandingPage({ _id: 'help', slug: 'help', language: EN });
    faqDraft = mockLandingPage({
      _id: FAQ_DRAFT_ID,
      slug: 'faq',
      language: EN,
    });
  });

  describe('with a single faq page', () => {
    let client: ReturnType<typeof createClient>['client'];
    let operations: ReturnType<typeof createClient>['operations'];

    beforeEach(() => {
      ({ client, operations } = createClient([faq]));
    });

    it('redirects a renamed page from its old path with an automatic, permanent redirect', async () => {
      await applyLandingRedirects(
        client,
        mockLandingPage({ _id: FAQ_DRAFT_ID, slug: 'questions', language: EN }),
      );

      expect(operations).toEqual([
        {
          create: {
            _type: REDIRECT_TYPE,
            language: EN,
            source: '/faq',
            destination: QUESTIONS_PATH,
            isPrefix: false,
            status: REDIRECT_STATUS.PERMANENT,
            isAutomatic: true,
          },
        },
        'commit',
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
        _id: FAQ_DRAFT_ID,
        slug: 'faq',
        parent: 'help',
        language: EN,
      }),
    );

    expect(operations).toContainEqual({
      create: expect.objectContaining({
        source: '/faq',
        destination: '/help/faq',
        isPrefix: false,
      }),
    });
  });

  it('makes a prefix redirect when a renamed parent has sub-pages', async () => {
    const { client, operations } = createClient([
      mockLandingPage({ _id: 'modules', slug: 'modules', language: EN }),
      mockLandingPage({
        _id: 'faq',
        slug: 'faq',
        parent: 'modules',
        language: EN,
      }),
      mockLandingPage({
        _id: 'pricing',
        slug: 'pricing',
        parent: 'modules',
        language: EN,
      }),
    ]);

    await applyLandingRedirects(
      client,
      mockLandingPage({ _id: 'drafts.modules', slug: 'catalog', language: EN }),
    );

    expect(operations).toEqual([
      {
        create: expect.objectContaining({
          source: '/modules',
          destination: '/catalog',
          isPrefix: true,
        }),
      },
      'commit',
    ]);
  });

  it('collapses and clears existing redirects in the same language only', async () => {
    const { client, operations } = createClient([
      mockLandingPage({
        _id: 'faq',
        slug: 'faq',
        parent: 'help',
        language: EN,
      }),
      help,
      mockRedirect({
        _id: 'r1',
        source: QUESTIONS_PATH,
        destination: '/help/faq',
      }),
      mockRedirect({ _id: 'r2', source: '/faq', destination: '/help/faq' }),
      mockRedirect({
        _id: 'r3',
        source: QUESTIONS_PATH,
        destination: '/help/faq',
        language: NL,
      }),
    ]);

    await applyLandingRedirects(client, faqDraft);

    expect(operations).toEqual([
      { delete: 'r2' },
      { patch: 'r1', set: { destination: '/faq' } },
      {
        create: expect.objectContaining({
          source: '/help/faq',
          destination: '/faq',
        }),
      },
      'commit',
    ]);
  });

  it('writes nothing on a first publish', async () => {
    const { client, operations } = createClient([]);

    await applyLandingRedirects(client, faqDraft);

    expect(operations).toEqual([]);
  });
});
