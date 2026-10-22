import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
} from '@blog/config/constants';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import {
  BLOCK_REASON,
  NOT_AN_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
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
  PERSONAL_DATA_LEAD_MESSAGE,
  PERSONAL_DATA_LEAD_NAME,
  taggedMixedCaseAddress,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findPersonalData } from './find-personal-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const [LOCAL_PART, DOMAIN] = TEST_SUBSCRIBER_EMAIL.split('@');
const TAGGED_EMAIL = `${LOCAL_PART}+news@${DOMAIN}`.toUpperCase();

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(findPersonalData, () => {
  let tenantId: string;
  let tenantName: string;

  beforeEach(async () => {
    ({ id: tenantId, name: tenantName } = await insertTestTenant(db()));
    await insertTestPersonalDataRows(db(), tenantId, TEST_SUBSCRIBER_EMAIL);
    await insertTestPersonalDataRows(db(), tenantId, TEST_INVITE_EMAIL);
  });

  it('finds every row held for the mailbox, decrypted and named by site', async () => {
    const result = await findPersonalData(TAGGED_EMAIL);

    expect(result).toEqual({
      ok: true,
      data: {
        emailIndex: testPersonalEmailIndex(TEST_SUBSCRIBER_EMAIL),
        subscribers: [
          expect.objectContaining({
            tenantId,
            tenantName,
            email: TEST_SUBSCRIBER_EMAIL,
            confirmedAt: undefined,
          }),
        ],
        leads: [
          expect.objectContaining({
            tenantName,
            name: PERSONAL_DATA_LEAD_NAME,
            email: TEST_SUBSCRIBER_EMAIL,
            message: PERSONAL_DATA_LEAD_MESSAGE,
          }),
        ],
        membershipInvites: [
          expect.objectContaining({
            tenantName,
            email: TEST_SUBSCRIBER_EMAIL,
            role: MEMBERSHIP_ROLE.EDITOR,
          }),
        ],
        blockedSignupIdentities: [
          expect.objectContaining({ reason: BLOCK_REASON }),
        ],
        auditEvents: [
          expect.objectContaining({
            email: taggedMixedCaseAddress(TEST_SUBSCRIBER_EMAIL),
            action: AUDIT_ACTION.SETTINGS_UPDATED,
            targetType: AUDIT_TARGET_TYPE.TENANT,
            targetId: tenantId,
          }),
        ],
      },
    });
  });

  it('finds nothing for a mailbox with no rows', async () => {
    const result = await findPersonalData(`nobody@${DOMAIN}`);

    expect(result).toMatchObject({
      ok: true,
      data: {
        subscribers: [],
        leads: [],
        membershipInvites: [],
        blockedSignupIdentities: [],
        auditEvents: [],
      },
    });
  });

  it('refuses a value that is not an email address', async () => {
    await expect(findPersonalData(NOT_AN_ADDRESS)).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
