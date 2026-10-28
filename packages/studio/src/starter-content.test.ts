import { buildStarterDocuments } from '@blog/config';
import {
  LOCALE_ISO_CODES,
  SITE_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { siteSettingsSchema } from '@blog/studio/schema-types/documents/settings/site-settings/site-settings';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';
import { validateDocument, type ValidationClient } from '@sanity/validation';
import { prepareConfig, type SanityDocument, type Schema } from 'sanity';

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

const STARTER_SITE_TYPES = [
  SITE_TYPE.BLOG,
  SITE_TYPE.PORTFOLIO,
  SITE_TYPE.PERSONAL,
  SITE_TYPE.DOCS,
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
            dataset.some(({ _id }) => _id === id),
        });

        return markers;
      };

      const starterCases = STARTER_SITE_TYPES.flatMap((siteType) => {
        const dataset = buildDocuments(siteType, defaultLocale);

        return dataset.map((document) => ({
          siteType,
          _type: document._type,
          _id: document._id,
          document,
          dataset,
        }));
      });

      it.each(starterCases)(
        '$siteType $_type $_id passes Studio validation',
        async ({ document, dataset }) => {
          expect(await validateStarterDocument(document, dataset)).toEqual([]);
        },
      );

      describe('with a broken site settings document', () => {
        const blogDocuments = buildDocuments(SITE_TYPE.BLOG, defaultLocale);
        const siteSettings = blogDocuments.find(
          (document) => document._type === siteSettingsSchema.name,
        )!;

        it.each([
          {
            missing: 'a required top-level field',
            document: { ...siteSettings, currency: undefined },
            path: ['currency'],
          },
          {
            missing: 'a required field inside a present object',
            document: { ...siteSettings, brand: { _type: 'brand' as const } },
            path: ['brand', 'name'],
          },
        ])(
          'reports an error when $missing is missing',
          async ({ document, path }) => {
            const markers = await validateStarterDocument(
              document,
              blogDocuments,
            );

            expect(
              markers.map(({ level, path: markerPath }) => ({
                level,
                path: markerPath,
              })),
            ).toContainEqual({ level: 'error', path });
          },
        );
      });
    },
  );
});
