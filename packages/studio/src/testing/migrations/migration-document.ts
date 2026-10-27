import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';
import type { SanityDocument } from 'sanity';
import type { Migration, MigrationContext } from 'sanity/migrate';

const MOCK_DOCUMENT_TIMESTAMP = '2026-01-01T00:00:00Z';

type TMockMigrationDocumentInput = {
  _id?: string;
  _type: string;
} & Record<string, unknown>;

export const mockMigrationDocument = ({
  _id = faker.string.uuid(),
  ...fields
}: TMockMigrationDocumentInput): SanityDocument => ({
  _id,
  _createdAt: MOCK_DOCUMENT_TIMESTAMP,
  _updatedAt: MOCK_DOCUMENT_TIMESTAMP,
  _rev: faker.string.alphanumeric(22),
  ...fields,
});

export const mockMigrationContext = (dataset: unknown[] = []) =>
  ({
    client: { fetch: mockGroqFetch(dataset) },
  }) as unknown as MigrationContext;

export const runDocumentMigration = async (
  migration: Migration,
  document: SanityDocument,
  context: MigrationContext = mockMigrationContext(),
) => {
  const { migrate } = migration;
  const handler = 'document' in migrate ? migrate.document : undefined;

  if (!handler) {
    throw new Error('Expected the migration to define a document() handler.');
  }

  return handler(document, context);
};
