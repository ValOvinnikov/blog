import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_INVITE_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
  insertTestLead,
  insertTestTenant,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { countPersonalDataGaps } from './lib/count-personal-data-gaps';
import { loadPersonalDataKeys } from './lib/personal-data-keys';
import {
  countStaleTaggedUserIndexes,
  reindexTaggedUserEmails,
} from './lib/reindex-tagged-user-emails';
import { backfillPersonalData } from './run';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const MOCK_EXISTING_CIPHERTEXT = 'v1:existing-ciphertext';
const MOCK_USER_COUNT_OVER_ONE_BATCH = 501;
const MOCK_BATCH_USER_EMAIL_PREFIX = 'batch-user-';

const MOCK_NO_GAPS = {
  users: 0,
  subscribers: 0,
  membership_invites: 0,
  leads: 0,
};

async function seedPlainRows(): Promise<void> {
  const { id: tenantId } = await insertTestTenant(db());
  await insertTestUser(db(), { name: MOCK_USER_NAME, email: MOCK_USER_EMAIL });
  await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL });
  await db().insert(schema.membershipInvites).values({
    tenantId,
    email: MOCK_INVITE_EMAIL,
    role: MEMBERSHIP_ROLE.EDITOR,
  });
  await insertTestLead(db(), tenantId);
}

async function readAllRows(): Promise<unknown[]> {
  return [
    await db().select().from(schema.users),
    await db().select().from(schema.subscribers),
    await db().select().from(schema.membershipInvites),
    await db().select().from(schema.leads),
  ];
}

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.subscribers);
  await db().delete(schema.users);
  await db().delete(schema.tenants);
});

describe(backfillPersonalData, () => {
  it('leaves a missing value without an encrypted form', async () => {
    const { id } = await insertTestUser(db(), { name: null, email: null });

    await backfillPersonalData(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(user).toMatchObject({
      id,
      nameEncrypted: null,
      emailEncrypted: null,
      emailIndex: null,
    });
  });

  it('keeps an existing encrypted form and adds only the missing index', async () => {
    await insertTestUser(db(), {
      email: MOCK_USER_EMAIL,
      emailEncrypted: MOCK_EXISTING_CIPHERTEXT,
    });

    await backfillPersonalData(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(user?.emailEncrypted).toBe(MOCK_EXISTING_CIPHERTEXT);
    expect(user?.emailIndex).toBe(mockAccountEmailIndex(MOCK_USER_EMAIL));
  });

  it('backfills every row when there are more than fit in one batch', async () => {
    await db()
      .insert(schema.users)
      .values(
        Array.from({ length: MOCK_USER_COUNT_OVER_ONE_BATCH }, (_, index) => ({
          email: `${MOCK_BATCH_USER_EMAIL_PREFIX}${index}@example.test`,
        })),
      );

    const { users } = await backfillPersonalData(loadPersonalDataKeys());

    expect(users).toBe(MOCK_USER_COUNT_OVER_ONE_BATCH);
    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });

  describe('with plain rows seeded', () => {
    beforeEach(async () => {
      await seedPlainRows();
    });

    it('encrypts every non-empty plain value and indexes every email', async () => {
      await backfillPersonalData(loadPersonalDataKeys());

      const [user] = await db().select().from(schema.users);
      expect(decryptTestPersonalValue(user?.nameEncrypted ?? null)).toBe(
        MOCK_USER_NAME,
      );
      expect(decryptTestPersonalValue(user?.emailEncrypted ?? null)).toBe(
        MOCK_USER_EMAIL,
      );
      expect(user?.emailIndex).toBe(mockAccountEmailIndex(MOCK_USER_EMAIL));

      const [subscriber] = await db().select().from(schema.subscribers);
      expect(decryptTestPersonalValue(subscriber?.emailEncrypted ?? null)).toBe(
        MOCK_SUBSCRIBER_EMAIL,
      );
      expect(subscriber?.emailIndex).toBe(
        testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
      );

      const [invite] = await db().select().from(schema.membershipInvites);
      expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
        MOCK_INVITE_EMAIL,
      );
      expect(invite?.emailIndex).toBe(
        testPersonalEmailIndex(MOCK_INVITE_EMAIL),
      );

      const [lead] = await db().select().from(schema.leads);
      expect(decryptTestPersonalValue(lead?.nameEncrypted ?? null)).toBe(
        lead?.name,
      );
      expect(decryptTestPersonalValue(lead?.emailEncrypted ?? null)).toBe(
        lead?.email,
      );
      expect(lead?.emailIndex).toBe(testPersonalEmailIndex(lead?.email ?? ''));
      expect(decryptTestPersonalValue(lead?.messageEncrypted ?? null)).toBe(
        lead?.message,
      );
    });

    it('reports how many rows of each table it backfilled', async () => {
      await insertTestUser(db(), { email: faker.internet.email() });

      const backfilled = await backfillPersonalData(loadPersonalDataKeys());

      expect(backfilled).toEqual({
        users: 2,
        subscribers: 1,
        membership_invites: 1,
        leads: 1,
      });
    });

    it('changes nothing on a second run', async () => {
      await backfillPersonalData(loadPersonalDataKeys());
      const afterFirstRun = await readAllRows();

      const backfilled = await backfillPersonalData(loadPersonalDataKeys());

      expect(backfilled).toEqual(MOCK_NO_GAPS);
      expect(await readAllRows()).toEqual(afterFirstRun);
    });
  });
});

describe(countPersonalDataGaps, () => {
  beforeEach(async () => {
    await seedPlainRows();
  });

  it('counts the rows with a plain value but no encrypted form or index', async () => {
    expect(await countPersonalDataGaps()).toEqual({
      users: 1,
      subscribers: 1,
      membership_invites: 1,
      leads: 1,
    });
  });

  it('finds no gaps once the backfill has run', async () => {
    await backfillPersonalData(loadPersonalDataKeys());

    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });
});

describe(reindexTaggedUserEmails, () => {
  const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL).trim();

  async function insertStaleTaggedUser(): Promise<string> {
    const { id } = await insertTestUser(db(), {
      email: MOCK_TAGGED_USER_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_TAGGED_USER_EMAIL),
    });
    return id;
  }

  it('recomputes a +tag user index written before the exact-address index', async () => {
    await insertStaleTaggedUser();

    const reindexed = await reindexTaggedUserEmails(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(reindexed).toBe(1);
    expect(user?.emailIndex).toBe(
      mockAccountEmailIndex(MOCK_TAGGED_USER_EMAIL),
    );
  });

  it('counts the stale rows without writing them', async () => {
    await insertStaleTaggedUser();

    expect(await countStaleTaggedUserIndexes(loadPersonalDataKeys())).toBe(1);

    const [user] = await db().select().from(schema.users);
    expect(user?.emailIndex).toBe(
      testPersonalEmailIndex(MOCK_TAGGED_USER_EMAIL),
    );
  });

  it('leaves untagged and already-correct rows alone, so a re-run does nothing', async () => {
    await insertTestUser(db(), {
      email: MOCK_USER_EMAIL,
      emailIndex: mockAccountEmailIndex(MOCK_USER_EMAIL),
    });
    await insertStaleTaggedUser();
    await reindexTaggedUserEmails(loadPersonalDataKeys());

    expect(await reindexTaggedUserEmails(loadPersonalDataKeys())).toBe(0);
  });

  it('keeps the gap count at zero after a backfill and a re-index', async () => {
    await insertStaleTaggedUser();

    await backfillPersonalData(loadPersonalDataKeys());
    await reindexTaggedUserEmails(loadPersonalDataKeys());

    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });
});
