import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestLead,
  insertTestTenant,
  insertTestUser,
  TEST_INVITE_EMAIL,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  decryptTestPersonalValue,
  testAccountEmailIndex,
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { countPersonalDataGaps } from './lib/count-personal-data-gaps';
import { loadPersonalDataKeys } from './lib/personal-data-keys';
import { backfillPersonalData } from './run';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const USER_NAME = faker.person.fullName();
const USER_EMAIL = faker.internet.email().toLowerCase();
const NO_GAPS = {
  users: 0,
  subscribers: 0,
  membership_invites: 0,
  leads: 0,
};

async function seedPlainRows(): Promise<string> {
  const { id: tenantId } = await insertTestTenant(db());
  await insertTestUser(db(), { name: USER_NAME, email: USER_EMAIL });
  await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: TEST_SUBSCRIBER_EMAIL });
  await db().insert(schema.membershipInvites).values({
    tenantId,
    email: TEST_INVITE_EMAIL,
    role: MEMBERSHIP_ROLE.EDITOR,
  });
  await insertTestLead(db(), tenantId);
  return tenantId;
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
  it('encrypts every non-empty plain value and indexes every email', async () => {
    await seedPlainRows();

    await backfillPersonalData(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(decryptTestPersonalValue(user?.nameEncrypted ?? null)).toBe(
      USER_NAME,
    );
    expect(decryptTestPersonalValue(user?.emailEncrypted ?? null)).toBe(
      USER_EMAIL,
    );
    expect(user?.emailIndex).toBe(testAccountEmailIndex(USER_EMAIL));

    const [subscriber] = await db().select().from(schema.subscribers);
    expect(decryptTestPersonalValue(subscriber?.emailEncrypted ?? null)).toBe(
      TEST_SUBSCRIBER_EMAIL,
    );
    expect(subscriber?.emailIndex).toBe(
      testPersonalEmailIndex(TEST_SUBSCRIBER_EMAIL),
    );

    const [invite] = await db().select().from(schema.membershipInvites);
    expect(decryptTestPersonalValue(invite?.emailEncrypted ?? null)).toBe(
      TEST_INVITE_EMAIL,
    );
    expect(invite?.emailIndex).toBe(testPersonalEmailIndex(TEST_INVITE_EMAIL));

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
    await seedPlainRows();
    await insertTestUser(db(), { email: faker.internet.email() });

    const backfilled = await backfillPersonalData(loadPersonalDataKeys());

    expect(backfilled).toEqual({
      users: 2,
      subscribers: 1,
      membership_invites: 1,
      leads: 1,
    });
  });

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
    const existing = 'v1:existing-ciphertext';
    await insertTestUser(db(), { email: USER_EMAIL, emailEncrypted: existing });

    await backfillPersonalData(loadPersonalDataKeys());

    const [user] = await db().select().from(schema.users);
    expect(user?.emailEncrypted).toBe(existing);
    expect(user?.emailIndex).toBe(testAccountEmailIndex(USER_EMAIL));
  });

  it('backfills every row when there are more than fit in one batch', async () => {
    await db()
      .insert(schema.users)
      .values(
        Array.from({ length: 501 }, () => ({ email: faker.internet.email() })),
      );

    const { users } = await backfillPersonalData(loadPersonalDataKeys());

    expect(users).toBe(501);
    expect(await countPersonalDataGaps()).toEqual(NO_GAPS);
  });

  it('changes nothing on a second run', async () => {
    await seedPlainRows();
    await backfillPersonalData(loadPersonalDataKeys());
    const afterFirstRun = await readAllRows();

    const backfilled = await backfillPersonalData(loadPersonalDataKeys());

    expect(backfilled).toEqual(NO_GAPS);
    expect(await readAllRows()).toEqual(afterFirstRun);
  });
});

describe(countPersonalDataGaps, () => {
  it('counts the rows with a plain value but no encrypted form or index', async () => {
    await seedPlainRows();

    expect(await countPersonalDataGaps()).toEqual({
      users: 1,
      subscribers: 1,
      membership_invites: 1,
      leads: 1,
    });
  });
});
