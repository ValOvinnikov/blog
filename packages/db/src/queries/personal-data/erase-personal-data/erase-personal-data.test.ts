import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { NOT_AN_ADDRESS } from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestTenant,
  TEST_INVITE_EMAIL,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import {
  deleteTestPersonalDataRows,
  insertTestPersonalDataRows,
  PERSONAL_DATA_ACTOR_ID,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { isNull } from 'drizzle-orm';

import { erasePersonalData } from './erase-personal-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const ONE_OF_EACH = {
  subscribers: 1,
  leads: 1,
  membershipInvites: 1,
  blockedSignupIdentities: 1,
  auditEvents: 1,
};

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(erasePersonalData, () => {
  beforeEach(async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await insertTestPersonalDataRows(db(), tenantId, TEST_SUBSCRIBER_EMAIL);
    await insertTestPersonalDataRows(db(), tenantId, TEST_INVITE_EMAIL);
  });

  it("erases the mailbox's rows and reports how many of each", async () => {
    const result = await erasePersonalData(TEST_SUBSCRIBER_EMAIL);

    expect(result).toEqual({
      ok: true,
      data: {
        emailIndex: testPersonalEmailIndex(TEST_SUBSCRIBER_EMAIL),
        erased: ONE_OF_EACH,
      },
    });
  });

  it("keeps everyone else's rows", async () => {
    await erasePersonalData(TEST_SUBSCRIBER_EMAIL);

    const result = await erasePersonalData(TEST_INVITE_EMAIL);

    expect(result).toMatchObject({ ok: true, data: { erased: ONE_OF_EACH } });
  });

  it('keeps an audit event but clears its email', async () => {
    await erasePersonalData(TEST_SUBSCRIBER_EMAIL);

    const anonymised = await db()
      .select({ actorId: schema.auditEvents.actorId })
      .from(schema.auditEvents)
      .where(isNull(schema.auditEvents.actorEmail));

    expect(anonymised).toEqual([{ actorId: PERSONAL_DATA_ACTOR_ID }]);
  });

  it('finds nothing left to erase on a second run', async () => {
    await erasePersonalData(TEST_SUBSCRIBER_EMAIL);

    const result = await erasePersonalData(TEST_SUBSCRIBER_EMAIL);

    expect(result).toMatchObject({
      ok: true,
      data: {
        erased: {
          subscribers: 0,
          leads: 0,
          membershipInvites: 0,
          blockedSignupIdentities: 0,
          auditEvents: 0,
        },
      },
    });
  });

  it('refuses a value that is not an email address', async () => {
    await expect(erasePersonalData(NOT_AN_ADDRESS)).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
