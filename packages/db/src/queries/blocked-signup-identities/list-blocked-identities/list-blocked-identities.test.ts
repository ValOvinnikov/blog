import { faker } from '@faker-js/faker';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import { insertTestAdmin } from '@shinefold/db/testing/admins/fixtures';
import {
  insertTestBlockedIdentity,
  MOCK_BLOCKED_ADDRESS_DOMAIN,
} from '@shinefold/db/testing/blocked-signup-identities/fixtures';
import {
  insertTestTenant,
  MOCK_OPERATOR_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@shinefold/db/testing/tenant-suspensions/fixtures';

import {
  listBlockedIdentities,
  type TBlockedIdentityListing,
} from './list-blocked-identities';

vi.mock('@shinefold/db/client');

faker.seed(602108);

const MOCK_OLDER_REASON = faker.lorem.sentence();
const MOCK_NEWER_REASON = faker.lorem.sentence();
const MOCK_OLDER_AT = faker.date.past({ refDate: new Date(2026, 0, 1) });
const MOCK_NEWER_AT = new Date(MOCK_OLDER_AT.getTime() + 1);
const MOCK_ADMIN_NAME = faker.person.fullName();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
  await db().delete(schema.blockedSignupIdentities);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

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
    await insertTestBlockedIdentity(db(), {
      value: MOCK_BLOCKED_ADDRESS_DOMAIN,
      reason: MOCK_OLDER_REASON,
      createdByAdminId,
      createdAt: MOCK_OLDER_AT,
    });
    await insertTestBlockedIdentity(db(), {
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
      const { id: createdByAdminId } = await insertTestAdmin(db(), {
        name: MOCK_ADMIN_NAME,
        ...userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
      });
      await insertTestBlockedIdentity(db(), { createdByAdminId });

      const [entry] = await listEntries();

      expect(entry?.addedByEmail).toBe(MOCK_OPERATOR_EMAIL);
      expect(JSON.stringify(entry)).not.toContain(MOCK_ADMIN_NAME);
    });

    it('is null once the admin is gone', async () => {
      const { id: createdByAdminId } = await insertTestAdmin(
        db(),
        userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
      );
      await insertTestBlockedIdentity(db(), { createdByAdminId });
      await db().delete(schema.admins);

      const entries = await listEntries();

      expect(entries.map(({ addedByEmail }) => addedByEmail)).toEqual([null]);
    });
  });

  describe('the suspension that added it', () => {
    it('names its reference and tenant', async () => {
      const { id: ownerBlockId } = await insertTestBlockedIdentity(db());
      const tenant = await insertTestTenant(db());
      const { reference } = await insertTestTenantSuspension(db(), tenant.id, {
        ownerBlockId,
      });

      const [entry] = await listEntries();

      expect(entry?.suspension).toEqual({
        reference,
        tenantId: tenant.id,
        tenantName: tenant.name,
      });
    });

    it('is null for an entry no suspension added', async () => {
      await insertTestBlockedIdentity(db());

      const entries = await listEntries();

      expect(entries.map(({ suspension }) => suspension)).toEqual([null]);
    });
  });
});
