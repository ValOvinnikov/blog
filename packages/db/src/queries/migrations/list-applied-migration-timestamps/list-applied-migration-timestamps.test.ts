import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

import { listAppliedMigrationTimestamps } from './list-applied-migration-timestamps';

vi.mock('@blog/db/client');

faker.seed(6022);

const MOCK_EARLIER_TIMESTAMP = faker.number.int({
  min: 1_000_000_000_000,
  max: 1_500_000_000_000,
});
const MOCK_LATER_TIMESTAMP = faker.number.int({
  min: 1_600_000_000_000,
  max: 2_000_000_000_000,
});

const db = useQueryTestDb();

beforeAll(async () => {
  await db().execute(sql`create schema if not exists drizzle`);
  await db().execute(
    sql`create table if not exists drizzle.__drizzle_migrations (id serial primary key, hash text not null, created_at bigint)`,
  );
});

afterEach(async () => {
  await db().execute(sql`delete from drizzle.__drizzle_migrations`);
});

describe(listAppliedMigrationTimestamps, () => {
  it('returns the journal timestamp of every applied migration', async () => {
    for (const createdAt of [MOCK_EARLIER_TIMESTAMP, MOCK_LATER_TIMESTAMP]) {
      await db().execute(
        sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${faker.git.commitSha()}, ${createdAt})`,
      );
    }

    const result = await listAppliedMigrationTimestamps();

    expect([...result].sort((a, b) => a - b)).toEqual([
      MOCK_EARLIER_TIMESTAMP,
      MOCK_LATER_TIMESTAMP,
    ]);
  });

  it('returns an empty list when no migration has been applied', async () => {
    const result = await listAppliedMigrationTimestamps();

    expect(result).toEqual([]);
  });
});
