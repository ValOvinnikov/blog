import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_OWNER_EMAIL,
  insertTestTenant,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';

import { getTenantOwnerEmail } from './get-tenant-owner-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getTenantOwnerEmail, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the OWNER membership user email for the tenant', async () => {
    await insertTestUser(db(), { id: 'user-1', email: MOCK_OWNER_EMAIL });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it('returns a still-pending OWNER invite email when no membership exists yet', async () => {
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: MOCK_OWNER_EMAIL,
        emailEncrypted: encryptPersonalValue(MOCK_OWNER_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });
});
