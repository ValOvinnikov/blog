import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';
import { faker } from '@faker-js/faker';

import { deleteExpiredSessions } from './delete-expired-sessions';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

faker.seed(6022);

afterEach(async () => {
  await db().delete(schema.sessions);
  await db().delete(schema.users);
});

describe(deleteExpiredSessions, () => {
  let userId: string;

  async function insertSession(expires: Date): Promise<string> {
    const sessionToken = faker.string.uuid();
    await db()
      .insert(schema.sessions)
      .values({ sessionToken, userId, expires });
    return sessionToken;
  }

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
  });

  it('deletes expired sessions and keeps live ones', async () => {
    await insertSession(justPast(MOCK_RETENTION_NOW));
    const liveToken = await insertSession(justWithin(MOCK_RETENTION_NOW));

    await expect(
      deleteExpiredSessions(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(1);

    const rows = await db()
      .select({ sessionToken: schema.sessions.sessionToken })
      .from(schema.sessions);
    expect(rows).toEqual([{ sessionToken: liveToken }]);
  });

  it('deletes at most the given number of sessions per call', async () => {
    await insertSession(justPast(MOCK_RETENTION_NOW));
    await insertSession(justPast(MOCK_RETENTION_NOW));

    await expect(deleteExpiredSessions(MOCK_RETENTION_NOW, 1)).resolves.toBe(1);

    const rows = await db()
      .select({ sessionToken: schema.sessions.sessionToken })
      .from(schema.sessions);
    expect(rows).toHaveLength(1);
  });

  it('deletes nothing when run a second time', async () => {
    await insertSession(justPast(MOCK_RETENTION_NOW));
    await deleteExpiredSessions(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT);

    await expect(
      deleteExpiredSessions(MOCK_RETENTION_NOW, MOCK_RETENTION_LIMIT),
    ).resolves.toBe(0);
  });
});
