import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { linkToDefaultTranslation } from '@blog/studio/schema-types/inputs/translation-link-input/link-to-default-translation';
import type { Mutation } from '@sanity/client';
import { evaluate, parse } from 'groq-js';

const { EN, NL } = LOCALE_ISO_CODES;

const home = (_id: string, language?: string) => ({
  _id,
  _type: PAGE_HOME_TYPE,
  ...(language ? { language } : {}),
});

const reference = (language: string, ref: string) => ({
  _key: language,
  _type: 'internationalizedArrayReferenceValue',
  language,
  value: { _type: 'reference', _ref: ref },
});

const metadata = (
  _id: string,
  translations: ReturnType<typeof reference>[],
) => ({
  _id,
  _type: 'translation.metadata',
  schemaTypes: [PAGE_HOME_TYPE],
  translations,
});

const createClient = (dataset: Record<string, unknown>[]) => {
  const mutations: Mutation[][] = [];
  const client = {
    fetch: async <TResult>(query: string, params: Record<string, unknown>) =>
      (await (
        await evaluate(parse(query), { dataset, params })
      ).get()) as TResult,
    mutate: async (batch: Mutation[]) => {
      mutations.push(batch);
    },
  };

  return { client, mutations };
};

const linkDutchHome = (client: ReturnType<typeof createClient>['client']) =>
  linkToDefaultTranslation(client, {
    documentId: 'drafts.home-nl',
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
      home('page_home', EN),
      home('drafts.home-nl', NL),
      metadata('meta-1', [reference(EN, 'page_home')]),
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
      home('drafts.page_home'),
      home('drafts.home-nl', NL),
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
      home('page_home', EN),
      home('drafts.home-nl', NL),
      metadata('meta-1', [
        reference(EN, 'page_home'),
        reference(NL, 'home-nl'),
      ]),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('leaves the translations alone when another Home already holds the language', async () => {
    const { client, mutations } = createClient([
      home('page_home', EN),
      home('drafts.home-nl', NL),
      metadata('meta-1', [
        reference(EN, 'page_home'),
        reference(NL, 'home-nl-first'),
      ]),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('creates no link when there is no default-language Home', async () => {
    const { client, mutations } = createClient([home('drafts.home-nl', NL)]);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('never links the default-language Home to itself', async () => {
    const { client, mutations } = createClient([home('page_home', EN)]);

    await linkToDefaultTranslation(client, {
      documentId: 'page_home',
      schemaType: PAGE_HOME_TYPE,
      language: EN,
      defaultLanguage: EN,
    });

    expect(mutations).toEqual([]);
  });
});
