import { ERROR_CODE } from '@blog/config/constants';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { isSignupBlocked } from '@blog/db/queries/blocked-signup-identities/is-signup-blocked';
import * as schema from '@blog/db/schema';
import { MOCK_NOT_AN_ADDRESS } from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestTenant,
  MOCK_INVITE_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import {
  deleteTestPersonalDataRows,
  findTestReaderId,
  getTestReaderId,
  insertTestPersonalDataRows,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { errorResult, okResult } from '@blog/utils';

import {
  erasePersonalData,
  type TPersonalDataCounts,
} from './erase-personal-data';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const WITH_READER_ACCOUNT = { includesReaderAccount: true };
const WITHOUT_READER_ACCOUNT = { includesReaderAccount: false };
const SITE_RECORDS = { subscribers: 1, leads: 1, membershipInvites: 1 };
const ONE_OF_EACH = { ...SITE_RECORDS, readerAccounts: 1 };
const NONE = {
  subscribers: 0,
  leads: 0,
  membershipInvites: 0,
  readerAccounts: 0,
};

function erasure(
  email: string,
  erased: TPersonalDataCounts,
  isReaderAccountRefused = false,
) {
  return okResult({
    emailIndex: testPersonalEmailIndex(email),
    erased,
    isReaderAccountRefused,
  });
}

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(erasePersonalData, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await insertTestPersonalDataRows(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
    await insertTestPersonalDataRows(db(), tenantId, MOCK_INVITE_EMAIL);
  });

  it("erases the mailbox's rows and reader account and reports how many of each", async () => {
    const result = await erasePersonalData(
      MOCK_SUBSCRIBER_EMAIL,
      WITH_READER_ACCOUNT,
    );

    expect(result).toEqual(erasure(MOCK_SUBSCRIBER_EMAIL, ONE_OF_EACH));
    await expect(
      findTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL),
    ).resolves.toBeUndefined();
  });

  it('revokes every session of the erased reader account', async () => {
    const readerId = await getTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL);
    await db()
      .insert(schema.sessions)
      .values({ sessionToken: 'token', userId: readerId, expires: new Date() });

    await erasePersonalData(MOCK_SUBSCRIBER_EMAIL, WITH_READER_ACCOUNT);

    const sessions = await db().select().from(schema.sessions);
    expect(sessions).toEqual([]);
  });

  it('leaves the reader account alone when it is out of scope', async () => {
    const result = await erasePersonalData(
      MOCK_SUBSCRIBER_EMAIL,
      WITHOUT_READER_ACCOUNT,
    );

    expect(result).toEqual(
      erasure(MOCK_SUBSCRIBER_EMAIL, { ...SITE_RECORDS, readerAccounts: 0 }),
    );
    await expect(
      findTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL),
    ).resolves.toBeDefined();
  });

  it("refuses to delete a site owner's account but still erases the site records", async () => {
    const readerId = await getTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL);
    await db().insert(schema.memberships).values({
      tenantId,
      userId: readerId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await erasePersonalData(
      MOCK_SUBSCRIBER_EMAIL,
      WITH_READER_ACCOUNT,
    );

    expect(result).toEqual(
      erasure(
        MOCK_SUBSCRIBER_EMAIL,
        { ...SITE_RECORDS, readerAccounts: 0 },
        true,
      ),
    );
    await expect(
      findTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL),
    ).resolves.toBeDefined();
    await db().delete(schema.memberships);
  });

  describe('once the mailbox has been erased', () => {
    beforeEach(async () => {
      await erasePersonalData(MOCK_SUBSCRIBER_EMAIL, WITH_READER_ACCOUNT);
    });

    it("keeps everyone else's rows", async () => {
      const result = await erasePersonalData(
        MOCK_INVITE_EMAIL,
        WITH_READER_ACCOUNT,
      );

      expect(result).toEqual(erasure(MOCK_INVITE_EMAIL, ONE_OF_EACH));
    });

    it('keeps the address on the sign-up blocklist', async () => {
      await expect(isSignupBlocked(MOCK_SUBSCRIBER_EMAIL)).resolves.toEqual(
        okResult(true),
      );
    });

    it('keeps the audit history', async () => {
      const events = await db()
        .select({ id: schema.auditEvents.id })
        .from(schema.auditEvents);

      expect(events).toHaveLength(2);
    });

    it('finds nothing left to erase on a second run', async () => {
      const result = await erasePersonalData(
        MOCK_SUBSCRIBER_EMAIL,
        WITH_READER_ACCOUNT,
      );

      expect(result).toEqual(erasure(MOCK_SUBSCRIBER_EMAIL, NONE));
    });
  });

  it('refuses a value that is not an email address', async () => {
    await expect(
      erasePersonalData(MOCK_NOT_AN_ADDRESS, WITH_READER_ACCOUNT),
    ).resolves.toEqual(errorResult(ERROR_CODE.DB_INVALID_EMAIL));
  });
});
