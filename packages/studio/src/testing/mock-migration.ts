import type { MigrationContext } from 'sanity/migrate';

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
