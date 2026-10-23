import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { linkToDefaultTranslation } from '@blog/studio/schema-types/inputs/translation-link-input/link-to-default-translation';
import {
  mockHomePage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import type { Mutation } from '@sanity/client';

const { EN, NL } = LOCALE_ISO_CODES;

const DUTCH_HOME_DRAFT_ID = 'drafts.home-nl';

const createClient = (dataset: Record<string, unknown>[]) => {
  const mutations: Mutation[][] = [];
  const client = {
    fetch: async <TResult>(query: string, params: Record<string, unknown>) =>
      (await mockGroqFetch(dataset)(query, params)) as TResult,
    mutate: async (batch: Mutation[]) => {
      mutations.push(batch);
    },
  };

  return { client, mutations };
};

const linkDutchHome = (client: ReturnType<typeof createClient>['client']) =>
  linkToDefaultTranslation(client, {
    documentId: DUTCH_HOME_DRAFT_ID,
    schemaType: PAGE_HOME_TYPE,
    language: NL,
    defaultLanguage: EN,
  });

const weakReference = (language: string, ref: string) => ({
  _key: expect.any(String),
  _type: 'internationalizedArrayReferenceValue',
  language,
  value: {
    _type: 'reference',
    _ref: ref,
    _weak: true,
    _strengthenOnPublish: { type: PAGE_HOME_TYPE },
  },
});

describe(linkToDefaultTranslation, () => {
  it("adds the new Home to the default-language Home's translations", async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: 'page_home', language: EN }),
      mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
      mockTranslationMetadata([['page_home', EN]], {
        _id: 'meta-1',
        schemaTypes: [PAGE_HOME_TYPE],
      }),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([
      [
        {
          patch: {
            id: 'meta-1',
            setIfMissing: { translations: [] },
            insert: {
              after: 'translations[-1]',
              items: [weakReference(NL, 'home-nl')],
            },
          },
        },
      ],
    ]);
  });

  it('links both Homes in new translations when the default-language Home has none', async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: 'drafts.page_home' }),
      mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([
      [
        {
          create: {
            _id: expect.any(String),
            _type: 'translation.metadata',
            schemaTypes: [PAGE_HOME_TYPE],
            translations: [
              weakReference(EN, 'page_home'),
              weakReference(NL, 'home-nl'),
            ],
          },
        },
      ],
    ]);
  });

  it('leaves a Home that is already linked alone', async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: 'page_home', language: EN }),
      mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
      mockTranslationMetadata(
        [
          ['page_home', EN],
          ['home-nl', NL],
        ],
        { _id: 'meta-1', schemaTypes: [PAGE_HOME_TYPE] },
      ),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('leaves the translations alone when another Home already holds the language', async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: 'page_home', language: EN }),
      mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
      mockTranslationMetadata(
        [
          ['page_home', EN],
          ['home-nl-first', NL],
        ],
        { _id: 'meta-1', schemaTypes: [PAGE_HOME_TYPE] },
      ),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('creates no link when there is no default-language Home', async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: DUTCH_HOME_DRAFT_ID, language: NL }),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('never links the default-language Home to itself', async () => {
    const { client, mutations } = createClient([
      mockHomePage({ _id: 'page_home', language: EN }),
    ]);

    await linkToDefaultTranslation(client, {
      documentId: 'page_home',
      schemaType: PAGE_HOME_TYPE,
      language: EN,
      defaultLanguage: EN,
    });

    expect(mutations).toEqual([]);
  });
});
