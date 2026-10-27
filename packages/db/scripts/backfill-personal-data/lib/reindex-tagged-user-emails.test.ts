import * as schema from '@blog/db/schema';
import { MOCK_USER_EMAIL, insertTestUser } from '@blog/db/testing/fixtures';
import {
  mockAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import {
  deleteTestPersonalDataRows,
  taggedMixedCaseAddress,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { loadPersonalDataKeys } from './personal-data-keys';
import {
  countStaleTaggedUserIndexes,
  reindexTaggedUserEmails,
} from './reindex-tagged-user-emails';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL).trim();

async function insertStaleTaggedUser(): Promise<void> {
  await insertTestUser(db(), {
    email: MOCK_TAGGED_USER_EMAIL,
    emailIndex: testPersonalEmailIndex(MOCK_TAGGED_USER_EMAIL),
  });
}

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(reindexTaggedUserEmails, () => {
  it('recomputes a +tag user index written before the exact-address index', async () => {
    await insertStaleTaggedUser();

    const reindexed = await reindexTaggedUserEmails(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(reindexed).toBe(1);
    expect(user?.emailIndex).toBe(
      mockAccountEmailIndex(MOCK_TAGGED_USER_EMAIL),
    );
  });

  it('leaves untagged and already-correct rows alone, so a re-run does nothing', async () => {
    await insertTestUser(db(), {
      email: MOCK_USER_EMAIL,
      emailIndex: mockAccountEmailIndex(MOCK_USER_EMAIL),
    });
    await insertStaleTaggedUser();
    await reindexTaggedUserEmails(loadPersonalDataKeys());

    const reindexedAgain = await reindexTaggedUserEmails(
      loadPersonalDataKeys(),
    );

    expect(reindexedAgain).toBe(0);
  });
});

describe(countStaleTaggedUserIndexes, () => {
  it('counts the stale rows without writing them', async () => {
    await insertStaleTaggedUser();

    const staleCount = await countStaleTaggedUserIndexes(
      loadPersonalDataKeys(),
    );

    const [user] = await db().select().from(schema.users);
    expect(staleCount).toBe(1);
    expect(user?.emailIndex).toBe(
      testPersonalEmailIndex(MOCK_TAGGED_USER_EMAIL),
    );
  });
});
