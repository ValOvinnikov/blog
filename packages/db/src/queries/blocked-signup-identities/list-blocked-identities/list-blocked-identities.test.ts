import {
  ADMIN_ROLE,
  BLOCKED_IDENTITY_KIND,
  GRANTED_VIA,
} from '@blog/db/constants';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS_DOMAIN,
  MOCK_BLOCKED_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  MOCK_OPERATOR_EMAIL,
  insertTestAdmin,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import {
  listBlockedIdentities,
  type TBlockedIdentityListing,
} from './list-blocked-identities';

vi.mock('@blog/db/client');

faker.seed(602108);

const MOCK_OLDER_REASON = faker.lorem.sentence();
const MOCK_NEWER_REASON = faker.lorem.sentence();
const MOCK_OLDER_AT = faker.date.past({ refDate: new Date(2026, 0, 1) });
const MOCK_NEWER_AT = new Date(MOCK_OLDER_AT.getTime() + 1);
const MOCK_ADMIN_NAME = faker.person.fullName();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

async function insertBlockedDomain(
  overrides: Partial<typeof schema.blockedSignupIdentities.$inferInsert> = {},
): Promise<void> {
  await db()
    .insert(schema.blockedSignupIdentities)
    .values({
      kind: BLOCKED_IDENTITY_KIND.DOMAIN,
      value: MOCK_BLOCKED_DOMAIN,
      reason: MOCK_BLOCK_REASON,
      ...overrides,
    });
}

async function insertAdmin(
  user: Partial<typeof schema.users.$inferInsert>,
): Promise<string> {
  const { id: userId } = await insertTestUser(db(), user);
  const [admin] = await db()
    .insert(schema.admins)
    .values({
      userId,
      role: ADMIN_ROLE.ADMIN,
      grantedVia: GRANTED_VIA.PROMOTION,
    })
    .returning();
  if (!admin) throw new Error('failed to seed an admin row');
  return admin.id;
}

async function listEntries(): Promise<TBlockedIdentityListing[]> {
  const result = await listBlockedIdentities();
  if (!result.ok) throw new Error('failed to list blocked identities');
  return result.data;
}

describe(listBlockedIdentities, () => {
  it('returns an empty list when nothing is blocked', async () => {
    expect(await listBlockedIdentities()).toEqual({ ok: true, data: [] });
  });

  it('lists entries newest first', async () => {
    const { id: createdByAdminId } = await insertTestAdmin(db());
    await insertBlockedDomain({
      value: MOCK_BLOCKED_ADDRESS_DOMAIN,
      reason: MOCK_OLDER_REASON,
      createdByAdminId,
      createdAt: MOCK_OLDER_AT,
    });
    await insertBlockedDomain({
      reason: MOCK_NEWER_REASON,
      createdByAdminId,
      createdAt: MOCK_NEWER_AT,
    });

    const entries = await listEntries();

    expect(entries.map(({ reason }) => reason)).toEqual([
      MOCK_NEWER_REASON,
      MOCK_OLDER_REASON,
    ]);
  });

  describe('the adding admin email', () => {
    it('lists the decrypted email and nothing else from the user', async () => {
      const createdByAdminId = await insertAdmin({
        name: MOCK_ADMIN_NAME,
        ...userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
      });
      await insertBlockedDomain({ createdByAdminId });

      const [entry] = await listEntries();

      expect(entry?.addedByEmail).toBe(MOCK_OPERATOR_EMAIL);
      expect(JSON.stringify(entry)).not.toContain(MOCK_ADMIN_NAME);
    });

    it('is null once the admin is gone', async () => {
      const createdByAdminId = await insertAdmin(
        userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
      );
      await insertBlockedDomain({ createdByAdminId });
      await db().delete(schema.admins);

      const entries = await listEntries();

      expect(entries.map(({ addedByEmail }) => addedByEmail)).toEqual([null]);
    });
  });
});
