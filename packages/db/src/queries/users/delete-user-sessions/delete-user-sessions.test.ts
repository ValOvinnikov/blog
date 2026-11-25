import * as schema from '@shinefold/db/schema';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestSession } from '@shinefold/db/testing/sessions/fixtures';

import { deleteUserSessions } from './delete-user-sessions';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.sessions);
  await db().delete(schema.users);
});

describe(deleteUserSessions, () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
    ({ id: otherUserId } = await insertTestUser(db()));
  });

  it("deletes every session of the user and keeps other users' sessions", async () => {
    await insertTestSession(db(), userId);
    await insertTestSession(db(), userId);
    const { sessionToken } = await insertTestSession(db(), otherUserId);

    await expect(deleteUserSessions(userId)).resolves.toBe(2);

    const rows = await db()
      .select({ sessionToken: schema.sessions.sessionToken })
      .from(schema.sessions);
    expect(rows).toEqual([{ sessionToken }]);
  });

  it('deletes nothing for a user with no sessions', async () => {
    await insertTestSession(db(), otherUserId);

    await expect(deleteUserSessions(userId)).resolves.toBe(0);

    const rows = await db().select().from(schema.sessions);
    expect(rows).toHaveLength(1);
  });
});
