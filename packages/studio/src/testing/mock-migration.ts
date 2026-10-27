import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';
import type { SanityDocument } from 'sanity';
import type { Migration, MigrationContext } from 'sanity/migrate';

const MOCK_TIMESTAMP = '2026-01-01T00:00:00Z';

export const MOCK_SYSTEM_FIELDS = {
  _createdAt: MOCK_TIMESTAMP,
  _updatedAt: MOCK_TIMESTAMP,
  _rev: 'rev-1',
};

export const mockMigrationContext = (
  client: Partial<
    Record<keyof MigrationContext['client'], (...args: never[]) => unknown>
  >,
) => ({ client }) as unknown as MigrationContext;

type TMockMigrationDocumentInput = {
  _id?: string;
  _type: string;
} & Record<string, unknown>;

export const mockMigrationDocument = ({
  _id = faker.string.uuid(),
  ...fields
}: TMockMigrationDocumentInput): SanityDocument => ({
  _id,
  ...MOCK_SYSTEM_FIELDS,
  ...fields,
});

export const runDocumentMigration = async (
  migration: Migration,
  document: SanityDocument,
  context: MigrationContext = mockMigrationContext({
    fetch: mockGroqFetch([]),
  }),
) => {
  const { migrate } = migration;
  const handler = 'document' in migrate ? migrate.document : undefined;

  if (!handler) {
    throw new Error('Expected the migration to define a document() handler.');
  }

  return handler(document, context);
};
