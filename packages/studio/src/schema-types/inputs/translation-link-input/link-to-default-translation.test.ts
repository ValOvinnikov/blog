import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { linkToDefaultTranslation } from '@blog/studio/schema-types/inputs/translation-link-input/link-to-default-translation';
import {
  mockHomePage,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';
import type { Mutation } from '@sanity/client';
import { getDraftId } from 'sanity';

faker.seed(4116);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_ENGLISH_HOME_ID = faker.string.uuid();
const MOCK_DUTCH_HOME_ID = faker.string.uuid();
const MOCK_OTHER_DUTCH_HOME_ID = faker.string.uuid();
const MOCK_METADATA_ID = faker.string.uuid();
const MOCK_GENERATED_UUIDS = [
  faker.string.uuid(),
  faker.string.uuid(),
  faker.string.uuid(),
] as const;
const [MOCK_FIRST_UUID, MOCK_SECOND_UUID, MOCK_THIRD_UUID] =
  MOCK_GENERATED_UUIDS;

const MOCK_ENGLISH_HOME = mockHomePage({
  _id: MOCK_ENGLISH_HOME_ID,
  language: EN,
});
const MOCK_DUTCH_HOME_DRAFT = mockHomePage({
  _id: getDraftId(MOCK_DUTCH_HOME_ID),
  language: NL,
});

const mockClient = (dataset: Record<string, unknown>[]) => {
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

const linkDutchHome = (client: ReturnType<typeof mockClient>['client']) =>
  linkToDefaultTranslation(client, {
    documentId: getDraftId(MOCK_DUTCH_HOME_ID),
    schemaType: PAGE_HOME_TYPE,
    language: NL,
    defaultLanguage: EN,
  });

const mockWeakReference = (
  key: string,
  language: TLocaleIsoCode,
  ref: string,
) => ({
  _key: key,
  _type: 'internationalizedArrayReferenceValue',
  language,
  value: {
    _type: 'reference',
    _ref: ref,
    _weak: true,
    _strengthenOnPublish: { type: PAGE_HOME_TYPE },
  },
});

const mockHomeMetadata = (members: [id: string, language: string][]) =>
  mockTranslationMetadata(members, {
    _id: MOCK_METADATA_ID,
    schemaTypes: [PAGE_HOME_TYPE],
  });

describe(linkToDefaultTranslation, () => {
  beforeEach(() => {
    const uuids = [...MOCK_GENERATED_UUIDS];
    vi.spyOn(crypto, 'randomUUID').mockImplementation(
      () => uuids.shift() as ReturnType<typeof crypto.randomUUID>,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds the new Home to the default-language Home's translations", async () => {
    const { client, mutations } = mockClient([
      MOCK_ENGLISH_HOME,
      MOCK_DUTCH_HOME_DRAFT,
      mockHomeMetadata([[MOCK_ENGLISH_HOME_ID, EN]]),
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([
      [
        {
          patch: {
            id: MOCK_METADATA_ID,
            setIfMissing: { translations: [] },
            insert: {
              after: 'translations[-1]',
              items: [
                mockWeakReference(MOCK_FIRST_UUID, NL, MOCK_DUTCH_HOME_ID),
              ],
            },
          },
        },
      ],
    ]);
  });

  it('links both Homes in new translations when the default Home has none', async () => {
    const { client, mutations } = mockClient([
      mockHomePage({ _id: getDraftId(MOCK_ENGLISH_HOME_ID) }),
      MOCK_DUTCH_HOME_DRAFT,
    ]);

    await linkDutchHome(client);

    expect(mutations).toEqual([
      [
        {
          create: {
            _id: MOCK_SECOND_UUID,
            _type: 'translation.metadata',
            schemaTypes: [PAGE_HOME_TYPE],
            translations: [
              mockWeakReference(MOCK_THIRD_UUID, EN, MOCK_ENGLISH_HOME_ID),
              mockWeakReference(MOCK_FIRST_UUID, NL, MOCK_DUTCH_HOME_ID),
            ],
          },
        },
      ],
    ]);
  });

  it.each([
    {
      behaviour: 'leaves a Home that is already linked alone',
      dataset: [
        MOCK_ENGLISH_HOME,
        MOCK_DUTCH_HOME_DRAFT,
        mockHomeMetadata([
          [MOCK_ENGLISH_HOME_ID, EN],
          [MOCK_DUTCH_HOME_ID, NL],
        ]),
      ],
    },
    {
      behaviour:
        'leaves the translations alone when another Home holds the language',
      dataset: [
        MOCK_ENGLISH_HOME,
        MOCK_DUTCH_HOME_DRAFT,
        mockHomeMetadata([
          [MOCK_ENGLISH_HOME_ID, EN],
          [MOCK_OTHER_DUTCH_HOME_ID, NL],
        ]),
      ],
    },
    {
      behaviour: 'creates no link when there is no default-language Home',
      dataset: [MOCK_DUTCH_HOME_DRAFT],
    },
  ])('$behaviour', async ({ dataset }) => {
    const { client, mutations } = mockClient(dataset);

    await linkDutchHome(client);

    expect(mutations).toEqual([]);
  });

  it('never links the default-language Home to itself', async () => {
    const { client, mutations } = mockClient([MOCK_ENGLISH_HOME]);

    await linkToDefaultTranslation(client, {
      documentId: MOCK_ENGLISH_HOME_ID,
      schemaType: PAGE_HOME_TYPE,
      language: EN,
      defaultLanguage: EN,
    });

    expect(mutations).toEqual([]);
  });
});
