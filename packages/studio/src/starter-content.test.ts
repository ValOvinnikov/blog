import { faker } from '@faker-js/faker';
import { validateDocument, type ValidationClient } from '@sanity/validation';
import { buildGrowthLayer, buildStarterDocuments } from '@shinefold/config';
import {
  LOCALE_ISO_CODES,
  SITE_TYPE,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import { MOCK_PLACEHOLDER_IMAGES } from '@shinefold/config/testing/placeholder-images';
import { siteSettingsSchema } from '@shinefold/studio/schema-types/documents/settings/site-settings/site-settings';
import { mockGroqFetch } from '@shinefold/studio/testing/mock-groq-fetch';
import { isNull } from '@shinefold/utils/primitives';
import {
  prepareConfig,
  type SanityDocument,
  type Schema,
  type SchemaType,
} from 'sanity';

import { buildStudioConfig } from './studio-config';

vi.mock('sanity/structure');
vi.mock('sanity-plugin-media');
vi.mock('@sanity/vision');

faker.seed(6017);

const MOCK_SITE_NAME = faker.company.name();
const MOCK_PUBLISHED_AT = '2026-01-01T00:00:00Z';
const MOCK_REVISION = faker.string.alphanumeric(12);
const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_DATASET = faker.lorem.word();
const MOCK_TITLE = faker.lorem.words(2);

const FREE_LAYER = 'Free';
const GROWTH_LAYER = 'Growth';

const STARTER_SITE_TYPES = [
  SITE_TYPE.BLOG,
  SITE_TYPE.PORTFOLIO,
  SITE_TYPE.PERSONAL,
  SITE_TYPE.DOCS,
  SITE_TYPE.BUSINESS,
  SITE_TYPE.PRODUCT,
  SITE_TYPE.BLANK,
] as const;

type TStarterDocument = ReturnType<typeof buildStarterDocuments>[number];

const createDatasetClient = (
  documents: TStarterDocument[],
): ValidationClient => {
  const client = {
    fetch: mockGroqFetch(documents),
    withConfig: () => client,
  };

  return client as unknown as ValidationClient;
};

const toSanityDocument = (document: TStarterDocument): SanityDocument => ({
  ...document,
  _createdAt: MOCK_PUBLISHED_AT,
  _updatedAt: MOCK_PUBLISHED_AT,
  _rev: MOCK_REVISION,
});

type TSeededValue = { _type?: string } & Record<string, unknown>;

const isSeededObject = (value: unknown): value is TSeededValue =>
  typeof value === 'object' && !isNull(value) && !Array.isArray(value);

const undeclaredArrayItems = (
  type: SchemaType,
  value: unknown,
  path: string,
): string[] => {
  if (type.jsonType === 'array' && Array.isArray(value)) {
    return value.flatMap((item: unknown, index) => {
      if (!isSeededObject(item)) return [];
      const itemPath = `${path}[${index}]`;
      const member = type.of.find(({ name }) => name === item._type);

      return member
        ? undeclaredArrayItems(member, item, itemPath)
        : [`${itemPath} ${item._type}`];
    });
  }

  if (type.jsonType === 'object' && isSeededObject(value)) {
    return type.fields.flatMap((field) =>
      undeclaredArrayItems(
        field.type,
        value[field.name],
        `${path}.${field.name}`,
      ),
    );
  }

  return [];
};

const buildDocuments = (
  siteType: (typeof STARTER_SITE_TYPES)[number],
  locale: TLocaleIsoCode,
) =>
  buildStarterDocuments({
    siteType,
    siteName: MOCK_SITE_NAME,
    locale,
    publishedAt: MOCK_PUBLISHED_AT,
  });

const withGrowthLayer = (
  siteType: (typeof STARTER_SITE_TYPES)[number],
  locale: TLocaleIsoCode,
) => {
  const layer = buildGrowthLayer({
    siteType,
    locale,
    placeholderImages: MOCK_PLACEHOLDER_IMAGES,
  });
  if (isNull(layer)) return [];

  const growthSlots = layer.homeSlots.map(({ slot }) => slot);
  const starterDocuments = buildDocuments(siteType, locale).map((document) =>
    document._type === 'template_home'
      ? { ...document, modules: [...(document.modules ?? []), ...growthSlots] }
      : document,
  );
  const dataset = [...starterDocuments, ...layer.documents];
  const homeTemplate = starterDocuments.find(
    ({ _type }) => _type === 'template_home',
  )!;

  return [homeTemplate, ...layer.documents].map((document) => ({
    siteType,
    layer: GROWTH_LAYER,
    _type: document._type,
    _id: document._id,
    document,
    dataset,
  }));
};

describe(buildStarterDocuments, () => {
  describe.each(Object.values(LOCALE_ISO_CODES))(
    'on a Studio whose default language is %s',
    (defaultLocale) => {
      let schema: Schema;

      beforeAll(() => {
        const config = buildStudioConfig({
          projectId: MOCK_PROJECT_ID,
          dataset: MOCK_DATASET,
          title: MOCK_TITLE,
          defaultLocale,
          liveLocales: [defaultLocale],
        });
        schema = prepareConfig(config).workspaces[0]!.schema;
      });

      const validateStarterDocument = async (
        document: TStarterDocument,
        dataset: TStarterDocument[],
      ) => {
        const { markers } = await validateDocument({
          document: toSanityDocument(document),
          schema,
          client: createDatasetClient(dataset),
          getDocumentExists: async ({ id }) =>
            dataset.some(({ _id }) => _id === id) ||
            Object.values(MOCK_PLACEHOLDER_IMAGES).includes(id),
        });

        return markers;
      };

      const starterCases = STARTER_SITE_TYPES.flatMap((siteType) => {
        const dataset = buildDocuments(siteType, defaultLocale);

        return dataset.map((document) => ({
          siteType,
          layer: FREE_LAYER,
          _type: document._type,
          _id: document._id,
          document,
          dataset,
        }));
      });
      const cases = [
        ...starterCases,
        ...STARTER_SITE_TYPES.flatMap((siteType) =>
          withGrowthLayer(siteType, defaultLocale),
        ),
      ];

      it.each(cases)(
        '$siteType $layer $_type $_id passes Studio validation',
        async ({ document, dataset }) => {
          expect(await validateStarterDocument(document, dataset)).toEqual([]);
        },
      );

      it.each(cases)(
        '$siteType $layer $_type $_id seeds every array item as a member its field declares',
        ({ document }) => {
          const documentType = schema.get(document._type)!;

          expect(
            undeclaredArrayItems(documentType, document, document._id),
          ).toEqual([]);
        },
      );

      describe('with a broken site settings document', () => {
        const blogDocuments = buildDocuments(SITE_TYPE.BLOG, defaultLocale);
        const siteSettings = blogDocuments.find(
          (document) => document._type === siteSettingsSchema.name,
        )!;

        it('reports an error when a required field is missing', async () => {
          const markers = await validateStarterDocument(
            { ...siteSettings, currency: undefined },
            blogDocuments,
          );

          expect(
            markers.map(({ level, path }) => ({ level, path })),
          ).toContainEqual({ level: 'error', path: ['currency'] });
        });
      });
    },
  );
});
