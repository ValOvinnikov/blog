import { faker } from '@faker-js/faker';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  ERROR_CODE,
} from '@shinefold/config/constants';
import { DAY_MS, MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { setUnsentStudioReinvite } from '@shinefold/db/queries/tenants/unsent-studio-reinvite';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { GITHUB_PROVIDER } from '@shinefold/db/testing/account/fixtures';
import {
  MOCK_BLOCK_REASON,
  MOCK_NOT_AN_ADDRESS,
} from '@shinefold/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestAccount,
  insertTestTenant,
  MOCK_INVITE_EMAIL,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { testPersonalEmailIndex } from '@shinefold/db/testing/personal-data';
import {
  deleteTestPersonalDataRows,
  getTestReaderId,
  insertTestPersonalDataRows,
  MOCK_PERSONAL_DATA_LEAD_MESSAGE,
  MOCK_PERSONAL_DATA_LEAD_NAME,
  taggedMixedCaseAddress,
} from '@shinefold/db/testing/personal-data-rows';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestSession } from '@shinefold/db/testing/sessions/fixtures';
import { unwrapOk } from '@shinefold/db/testing/tenants/fixtures';
import { errorResult, okResult } from '@shinefold/utils';

import {
  findPersonalData,
  type TPersonalDataMatches,
} from './find-personal-data';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

faker.seed(6022);

const MOCK_NOW = faker.date.recent({ refDate: '2026-03-15T10:00:00.000Z' });
const MOCK_NOBODY_EMAIL = faker.internet.email().toLowerCase();
const MOCK_BOOKMARKED_POST_ID = faker.string.uuid();
const MOCK_ACTIVE_SESSION_TOKEN = faker.string.uuid();
const MOCK_EXPIRED_SESSION_TOKEN = faker.string.uuid();

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

  describe('searching a +tag variant of the mailbox', () => {
    let data: TPersonalDataMatches;
    let ownedSite: TTenant;

    beforeEach(async () => {
      ownedSite = await insertTestTenant(db(), {
        selfServeOwnerEmailIndex: testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
      });
      data = unwrapOk(
        await findPersonalData(taggedMixedCaseAddress(MOCK_SUBSCRIBER_EMAIL)),
      );
    });

    it('finds the self-serve site the mailbox owns', () => {
      const { id, name, createdAt } = ownedSite;

      expect(data.selfServeOwnerSites).toEqual([
        { tenantId: id, tenantName: name, createdAt },
      ]);
    });

    it('finds every row held for the mailbox, decrypted and named by site', () => {
      const {
        emailIndex,
        subscribers,
        leads,
        membershipInvites,
        blockedSignupIdentities,
      } = data;
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

    it('finds no audit events for a +tag variant of the account address', () => {
      expect(data.auditEvents).toEqual([]);
      expect(data.readerAccount).toBeUndefined();
    });
  });

  it('finds the audit events of the account with exactly that address', async () => {
    const { auditEvents } = unwrapOk(
      await findPersonalData(MOCK_SUBSCRIBER_EMAIL),
    );

    expect(
      auditEvents.map(({ action, targetType, targetId }) => ({
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
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(MOCK_NOW);
      userId = await getTestReaderId(db(), MOCK_SUBSCRIBER_EMAIL);
      await insertTestAccount(db(), userId, GITHUB_PROVIDER);
      await db()
        .insert(schema.bookmarks)
        .values({ tenantId, userId, postId: MOCK_BOOKMARKED_POST_ID });
      await insertTestSession(db(), userId, {
        sessionToken: MOCK_ACTIVE_SESSION_TOKEN,
        expires: new Date(MOCK_NOW.getTime() + DAY_MS),
      });
      await insertTestSession(db(), userId, {
        sessionToken: MOCK_EXPIRED_SESSION_TOKEN,
        expires: new Date(MOCK_NOW.getTime() - DAY_MS),
      });
    });

    afterEach(async () => {
      vi.useRealTimers();
      await db().delete(schema.sessions);
      await db().delete(schema.bookmarks);
      await db().delete(schema.accounts);
    });

    it('finds the reader account with providers, bookmarks and active sessions', async () => {
      const { readerAccount } = unwrapOk(
        await findPersonalData(MOCK_SUBSCRIBER_EMAIL),
      );

      if (!readerAccount) throw new Error('Expected a reader account.');
      const { id, email, linkedProviders, activeSessionCount } = readerAccount;
      const bookmarks = readerAccount.bookmarks.map(
        ({ tenantName, postId }) => ({ tenantName, postId }),
      );
      expect(id).toBe(userId);
      expect(email).toBe(MOCK_SUBSCRIBER_EMAIL);
      expect(linkedProviders).toEqual({
        github: true,
        google: false,
        emailLink: false,
      });
      expect(activeSessionCount).toBe(1);
      expect(bookmarks).toEqual([
        { tenantName, postId: MOCK_BOOKMARKED_POST_ID },
      ]);
    });
  });

  it('finds an unsent Studio re-invite held for a +tag variant of the mailbox', async () => {
    await setUnsentStudioReinvite(tenantId, MOCK_SUBSCRIBER_EMAIL);

    const { unsentStudioReinvites } = unwrapOk(
      await findPersonalData(taggedMixedCaseAddress(MOCK_SUBSCRIBER_EMAIL)),
    );

    expect(unsentStudioReinvites).toEqual([
      { tenantId, tenantName, email: MOCK_SUBSCRIBER_EMAIL },
    ]);
  });

  it('finds nothing for a mailbox with no rows', async () => {
    const result = await findPersonalData(MOCK_NOBODY_EMAIL);

    expect(result).toEqual(
      okResult({
        emailIndex: testPersonalEmailIndex(MOCK_NOBODY_EMAIL),
        subscribers: [],
        leads: [],
        membershipInvites: [],
        unsentStudioReinvites: [],
        selfServeOwnerSites: [],
        readerAccount: undefined,
        blockedSignupIdentities: [],
        auditEvents: [],
      }),
    );
  });

  it('refuses a value that is not an email address', async () => {
    const result = await findPersonalData(MOCK_NOT_AN_ADDRESS);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_INVALID_EMAIL));
  });
});
