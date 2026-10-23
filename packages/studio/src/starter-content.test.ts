import { buildStarterDocuments } from '@blog/config';
import { LOCALE_ISO_CODES, SITE_TYPE } from '@blog/config/constants';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { validateDocument, type ValidationClient } from '@sanity/validation';
import { prepareConfig, type SanityDocument, type Schema } from 'sanity';

import { buildStudioConfig } from './studio-config';

vi.mock('sanity/structure');
vi.mock('sanity-plugin-media');
vi.mock('@sanity/vision');

const SITE_NAME = 'Acme Corporation';
const PUBLISHED_AT = '2026-01-01T00:00:00Z';

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
  _createdAt: PUBLISHED_AT,
  _updatedAt: PUBLISHED_AT,
  _rev: 'starter',
});

describe.each(Object.values(LOCALE_ISO_CODES))(
  'starter content on a Studio whose default language is %s',
  (defaultLocale) => {
    let schema: Schema;

    beforeAll(() => {
      const config = buildStudioConfig({
        projectId: 'starter',
        dataset: 'starter',
        title: 'Starter',
        defaultLocale,
        liveLocales: [defaultLocale],
      });
      schema = prepareConfig(config).workspaces[0]!.schema;
    });

    const documents = buildStarterDocuments({
      siteType: SITE_TYPE.BLOG,
      siteName: SITE_NAME,
      locale: defaultLocale,
      publishedAt: PUBLISHED_AT,
    });
    const portfolioDocuments = buildStarterDocuments({
      siteType: SITE_TYPE.PORTFOLIO,
      siteName: SITE_NAME,
      locale: defaultLocale,
      publishedAt: PUBLISHED_AT,
    });
    const siteSettings = documents.find(
      (document) => document._type === 'settings_site',
    )!;

    const validateStarterDocument = async (
      document: TStarterDocument,
      dataset = documents,
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

    it.each(documents)(
      'Blog $_type $_id passes Studio validation',
      async (document) => {
        expect(await validateStarterDocument(document)).toEqual([]);
      },
    );

    it.each(
      buildStarterDocuments({
        siteType: SITE_TYPE.PORTFOLIO,
        siteName: SITE_NAME,
        locale: defaultLocale,
        publishedAt: PUBLISHED_AT,
      }),
    )('Portfolio $_type $_id passes Studio validation', async (document) => {
      expect(
        await validateStarterDocument(document, portfolioDocuments),
      ).toEqual([]);
    });

    it.each(
      buildStarterDocuments({
        siteType: SITE_TYPE.BLANK,
        siteName: SITE_NAME,
        locale: defaultLocale,
        publishedAt: PUBLISHED_AT,
      }),
    )('Blank $_type $_id passes Studio validation', async (document) => {
      expect(await validateStarterDocument(document)).toEqual([]);
    });

    it('reports an error when a required top-level field is missing', async () => {
      const withoutCurrency = { ...siteSettings, currency: undefined };

      expect(await validateStarterDocument(withoutCurrency)).toContainEqual(
        expect.objectContaining({ level: 'error', path: ['currency'] }),
      );
    });

    it('reports an error when a required field inside a present object is missing', async () => {
      const withoutBrandName = {
        ...siteSettings,
        brand: { _type: 'brand' as const },
      };

      expect(await validateStarterDocument(withoutBrandName)).toContainEqual(
        expect.objectContaining({ level: 'error', path: ['brand', 'name'] }),
      );
    });
  },
);
