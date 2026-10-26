import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
} from '@blog/config/constants';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_BLOCK_REASON,
  MOCK_NOT_AN_ADDRESS,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestAccount,
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
  getTestReaderId,
  insertTestPersonalDataRows,
  MOCK_PERSONAL_DATA_LEAD_MESSAGE,
  MOCK_PERSONAL_DATA_LEAD_NAME,
  taggedMixedCaseAddress,
} from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { errorResult, okResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import { findPersonalData } from './find-personal-data';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

const NOBODY_EMAIL = 'nobody@example.org';
const BOOKMARKED_POST_ID = 'post-1';
const GITHUB_PROVIDER = 'github';
const DAY_MS = 86_400_000;

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

  describe("with the account's sign-ins and bookmarks", () => {
    let userId: string;

    beforeEach(async () => {
      userId = await getTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL);
      await insertTestAccount(db(), userId, GITHUB_PROVIDER);
      await db()
        .insert(schema.bookmarks)
        .values({ tenantId, userId, postId: BOOKMARKED_POST_ID });
      await db()
        .insert(schema.sessions)
        .values([
          {
            sessionToken: 'active',
            userId,
            expires: new Date(Date.now() + DAY_MS),
          },
          {
            sessionToken: 'expired',
            userId,
            expires: new Date(Date.now() - DAY_MS),
          },
        ]);
    });

    afterEach(async () => {
      await db().delete(schema.sessions);
      await db().delete(schema.bookmarks);
      await db().delete(schema.accounts);
    });

    it('finds the reader account with its providers, bookmarks and active sessions', async () => {
      const result = await findPersonalData(MOCK_SUBSCRIBER_EMAIL);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const { readerAccount } = result.data;
      expect(readerAccount).toMatchObject({
        id: userId,
        email: MOCK_SUBSCRIBER_EMAIL,
        linkedProviders: { github: true, google: false, emailLink: false },
        activeSessionCount: 1,
      });
      expect(
        readerAccount?.bookmarks.map(({ tenantName, postId }) => ({
          tenantName,
          postId,
        })),
      ).toEqual([{ tenantName, postId: BOOKMARKED_POST_ID }]);
    });
  });

  it('finds the reader account of an address with no email index', async () => {
    await db()
      .update(schema.users)
      .set({ emailIndex: null })
      .where(eq(schema.users.email, MOCK_SUBSCRIBER_EMAIL));

    const result = await findPersonalData(MOCK_SUBSCRIBER_EMAIL);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.readerAccount?.email).toBe(MOCK_SUBSCRIBER_EMAIL);
    expect(result.data.auditEvents).toHaveLength(1);
  });

  it('finds no audit events for a +tag variant of the account address', async () => {
    const result = await findPersonalData(
      taggedMixedCaseAddress(MOCK_SUBSCRIBER_EMAIL),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.auditEvents).toEqual([]);
    expect(result.data.readerAccount).toBeUndefined();
  });

  it('finds nothing for a mailbox with no rows', async () => {
    const result = await findPersonalData(NOBODY_EMAIL);

    expect(result).toEqual(
      okResult({
        emailIndex: testPersonalEmailIndex(NOBODY_EMAIL),
        subscribers: [],
        leads: [],
        membershipInvites: [],
        readerAccount: undefined,
        blockedSignupIdentities: [],
        auditEvents: [],
      }),
    );
  });

  it('refuses a value that is not an email address', async () => {
    await expect(findPersonalData(MOCK_NOT_AN_ADDRESS)).resolves.toEqual(
      errorResult(ERROR_CODE.DB_INVALID_EMAIL),
    );
  });
});
