import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
} from '@blog/config/constants';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import {
  MOCK_BLOCK_REASON,
  MOCK_NOT_AN_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
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
  insertTestPersonalDataRows,
  MOCK_PERSONAL_DATA_LEAD_MESSAGE,
  MOCK_PERSONAL_DATA_LEAD_NAME,
  taggedMixedCaseAddress,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findPersonalData } from './find-personal-data';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const NOBODY_EMAIL = 'nobody@example.org';

afterEach(async () => {
  await deleteTestPersonalDataRows(db());
});

describe(findPersonalData, () => {
  let tenantId: string;
  let tenantName: string;

  beforeEach(async () => {
    ({ id: tenantId, name: tenantName } = await insertTestTenant(db()));
    await insertTestPersonalDataRows(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
    await insertTestPersonalDataRows(db(), tenantId, MOCK_INVITE_EMAIL);
  });

  it('finds every row held for the mailbox, decrypted and named by site', async () => {
    const result = await findPersonalData(
      taggedMixedCaseAddress(MOCK_SUBSCRIBER_EMAIL),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const {
      emailIndex,
      subscribers,
      leads,
      membershipInvites,
      blockedSignupIdentities,
    } = result.data;
    expect(emailIndex).toBe(testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL));
    expect(
      subscribers.map(({ tenantId, tenantName, email, confirmedAt }) => ({
        tenantId,
        tenantName,
        email,
        confirmedAt,
      })),
    ).toEqual([
      {
        tenantId,
        tenantName,
        email: MOCK_SUBSCRIBER_EMAIL,
        confirmedAt: undefined,
      },
    ]);
    expect(
      leads.map(({ tenantName, name, email, message }) => ({
        tenantName,
        name,
        email,
        message,
      })),
    ).toEqual([
      {
        tenantName,
        name: MOCK_PERSONAL_DATA_LEAD_NAME,
        email: MOCK_SUBSCRIBER_EMAIL,
        message: MOCK_PERSONAL_DATA_LEAD_MESSAGE,
      },
    ]);
    expect(
      membershipInvites.map(({ tenantName, email, role }) => ({
        tenantName,
        email,
        role,
      })),
    ).toEqual([
      {
        tenantName,
        email: MOCK_SUBSCRIBER_EMAIL,
        role: MEMBERSHIP_ROLE.EDITOR,
      },
    ]);
    expect(blockedSignupIdentities.map(({ reason }) => reason)).toEqual([
      MOCK_BLOCK_REASON,
    ]);
  });

  it('finds the audit events of the account with exactly that address', async () => {
    const result = await findPersonalData(MOCK_SUBSCRIBER_EMAIL);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(
      result.data.auditEvents.map(({ action, targetType, targetId }) => ({
        action,
        targetType,
        targetId,
      })),
    ).toEqual([
      {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: tenantId,
      },
    ]);
  });

  it('finds no audit events for a +tag variant of the account address', async () => {
    const result = await findPersonalData(
      taggedMixedCaseAddress(MOCK_SUBSCRIBER_EMAIL),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.auditEvents).toEqual([]);
  });

  it('finds nothing for a mailbox with no rows', async () => {
    const result = await findPersonalData(NOBODY_EMAIL);

    expect(result).toEqual({
      ok: true,
      data: {
        emailIndex: testPersonalEmailIndex(NOBODY_EMAIL),
        subscribers: [],
        leads: [],
        membershipInvites: [],
        blockedSignupIdentities: [],
        auditEvents: [],
      },
    });
  });

  it('refuses a value that is not an email address', async () => {
    await expect(findPersonalData(MOCK_NOT_AN_ADDRESS)).resolves.toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
