import * as schema from '@blog/db/schema';
import {
  MOCK_NO_GAPS,
  seedPlainPersonalDataRows,
} from '@blog/db/testing/backfill-personal-data/fixtures';
import {
  MOCK_INVITE_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_USER_EMAIL,
  MOCK_USER_NAME,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  mockAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import {
  deleteTestPersonalDataRows,
  taggedMixedCaseAddress,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { BATCH_SIZE } from './lib/batch-size';
import { countPersonalDataGaps } from './lib/count-personal-data-gaps';
import { loadPersonalDataKeys } from './lib/personal-data-keys';
import { reindexTaggedUserEmails } from './lib/reindex-tagged-user-emails';
import { backfillPersonalData } from './run';

vi.mock('@blog/db/client');

faker.seed(5808);

const db = useQueryTestDb();
usePersonalDataKeys();

const MOCK_EXISTING_CIPHERTEXT = faker.string.alphanumeric(24);
const MOCK_USER_COUNT_OVER_ONE_BATCH = BATCH_SIZE + 1;
const MOCK_TAGGED_USER_EMAIL = taggedMixedCaseAddress(MOCK_USER_EMAIL).trim();

async function readAllRows(): Promise<unknown[]> {
  return [
    await db().select().from(schema.users),
    await db().select().from(schema.subscribers),
    await db().select().from(schema.membershipInvites),
    await db().select().from(schema.leads),
  ];
}

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(backfillPersonalData, () => {
  it('leaves a missing value without an encrypted form', async () => {
    const { id } = await insertTestUser(db(), { name: null, email: null });

    await backfillPersonalData(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    const { nameEncrypted, emailEncrypted, emailIndex } = user ?? {};
    expect(user?.id).toBe(id);
    expect(nameEncrypted).toBeNull();
    expect(emailEncrypted).toBeNull();
    expect(emailIndex).toBeNull();
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
          email: `${index}-${faker.internet.email()}`,
        })),
      );

    const { users } = await backfillPersonalData(loadPersonalDataKeys());

    expect(users).toBe(MOCK_USER_COUNT_OVER_ONE_BATCH);
    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });

  describe('with plain rows seeded', () => {
    beforeEach(async () => {
      await seedPlainPersonalDataRows(db());
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

    describe('once backfilled', () => {
      beforeEach(async () => {
        await backfillPersonalData(loadPersonalDataKeys());
      });

      it('encrypts a user name and email and indexes the email', async () => {
        const [user] = await db().select().from(schema.users);

        const name = decryptTestPersonalValue(user?.nameEncrypted ?? null);
        const email = decryptTestPersonalValue(user?.emailEncrypted ?? null);

        expect(name).toBe(MOCK_USER_NAME);
        expect(email).toBe(MOCK_USER_EMAIL);
        expect(user?.emailIndex).toBe(mockAccountEmailIndex(MOCK_USER_EMAIL));
      });

      it('encrypts a subscriber email and indexes it', async () => {
        const [subscriber] = await db().select().from(schema.subscribers);

        const email = decryptTestPersonalValue(
          subscriber?.emailEncrypted ?? null,
        );

        expect(email).toBe(MOCK_SUBSCRIBER_EMAIL);
        expect(subscriber?.emailIndex).toBe(
          testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
        );
      });

      it('encrypts an invite email and indexes it', async () => {
        const [invite] = await db().select().from(schema.membershipInvites);

        const email = decryptTestPersonalValue(invite?.emailEncrypted ?? null);

        expect(email).toBe(MOCK_INVITE_EMAIL);
        expect(invite?.emailIndex).toBe(
          testPersonalEmailIndex(MOCK_INVITE_EMAIL),
        );
      });

      it('encrypts a lead name, email and message and indexes the email', async () => {
        const [lead] = await db().select().from(schema.leads);

        const name = decryptTestPersonalValue(lead?.nameEncrypted ?? null);
        const email = decryptTestPersonalValue(lead?.emailEncrypted ?? null);
        const message = decryptTestPersonalValue(
          lead?.messageEncrypted ?? null,
        );

        expect(name).toBe(lead?.name);
        expect(email).toBe(lead?.email);
        expect(message).toBe(lead?.message);
        expect(lead?.emailIndex).toBe(
          testPersonalEmailIndex(lead?.email ?? ''),
        );
      });
    });
  });

  it('leaves no gaps after a backfill followed by a tagged-email re-index', async () => {
    await insertTestUser(db(), {
      email: MOCK_TAGGED_USER_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_TAGGED_USER_EMAIL),
    });

    await backfillPersonalData(loadPersonalDataKeys());
    await reindexTaggedUserEmails(loadPersonalDataKeys());

    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });

  it('leaves no gaps once rows are backfilled', async () => {
    await seedPlainPersonalDataRows(db());

    await backfillPersonalData(loadPersonalDataKeys());

    expect(await countPersonalDataGaps()).toEqual(MOCK_NO_GAPS);
  });
});
