import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

import { listAppliedMigrationTimestamps } from './list-applied-migration-timestamps';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));
vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
    const timestamps = [
      faker.date.past().getTime(),
      faker.date.recent().getTime(),
    ];
    for (const createdAt of timestamps) {
      await db().execute(
        sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${faker.git.commitSha()}, ${createdAt})`,
      );
    }

    expect(await listAppliedMigrationTimestamps()).toEqual(
      expect.arrayContaining(timestamps),
    );
  });

  it('returns an empty list when no migration has been applied', async () => {
    expect(await listAppliedMigrationTimestamps()).toEqual([]);
  });
});
