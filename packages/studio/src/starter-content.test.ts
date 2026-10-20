import { buildStarterDocuments } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { validateDocument, type ValidationClient } from '@sanity/validation';
import { evaluate, parse } from 'groq-js';
import { prepareConfig, type SanityDocument, type Schema } from 'sanity';

import { buildStudioConfig } from './studio-config';

vi.mock('sanity/structure');
vi.mock('sanity-plugin-media');
vi.mock('@sanity/vision');

const documents = buildStarterDocuments('Acme Corporation');
const seededIds = new Set(documents.map(({ _id }) => _id));

const createDatasetClient = (): ValidationClient => {
  const client = {
    fetch: async (query: string, params: Record<string, unknown>) =>
      (await evaluate(parse(query), { dataset: documents, params })).get(),
    withConfig: () => client,
  };

  return client as unknown as ValidationClient;
};

const toSanityDocument = (
  document: (typeof documents)[number],
): SanityDocument => ({
  ...document,
  _createdAt: '2026-01-01T00:00:00Z',
  _updatedAt: '2026-01-01T00:00:00Z',
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

    it.each(documents)('$_type passes Studio validation', async (document) => {
      const { markers } = await validateDocument({
        document: toSanityDocument(document),
        schema,
        client: createDatasetClient(),
        getDocumentExists: async ({ id }) => seededIds.has(id),
      });

      expect(markers).toEqual([]);
    });
  },
);
