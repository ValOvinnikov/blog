import { ERROR_CODE } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
  type TMembershipRole,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { NOT_AN_ADDRESS } from '@blog/db/testing/blocked-signup-identities/fixtures';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  SELF_SERVE_OTHER_EMAIL,
  SELF_SERVE_OWNER_EMAIL as OWNER_EMAIL,
  SELF_SERVE_OWNER_SHOUTED_EMAIL,
  SELF_SERVE_OWNER_TAGGED_EMAIL,
} from '@blog/db/testing/tenants/self-serve-fixtures';

import { ownsFreeTenant } from './owns-free-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const OWNS_ONE = { ok: true, data: true };
const OWNS_NONE = { ok: true, data: false };

async function seedMember(
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
  role: TMembershipRole = MEMBERSHIP_ROLE.OWNER,
  email = OWNER_EMAIL,
): Promise<void> {
  const user = await insertTestUser(db(), {
    email,
    emailIndex: testPersonalEmailIndex(email),
  });
  const tenant = await insertTestTenant(db(), overrides);
  await db()
    .insert(schema.memberships)
    .values({ userId: user.id, tenantId: tenant.id, role });
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(ownsFreeTenant, () => {
  it('is false for a person with no tenant', async () => {
    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_NONE);
  });

  it.each([
    ['the owner address itself', OWNER_EMAIL],
    ['a +tag variant of it', SELF_SERVE_OWNER_TAGGED_EMAIL],
    ['a differently cased variant', SELF_SERVE_OWNER_SHOUTED_EMAIL],
  ])('is true for %s once that person owns a Free tenant', async (_, email) => {
    await seedMember();

    expect(await ownsFreeTenant(email)).toEqual(OWNS_ONE);
  });

  it('is true when the tenant sits in an account stored under a +tag address', async () => {
    await seedMember({}, MEMBERSHIP_ROLE.OWNER, SELF_SERVE_OWNER_TAGGED_EMAIL);

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_ONE);
  });

  it('is true for a suspended Free tenant', async () => {
    await seedMember({ status: TENANT_STATUS.SUSPENDED });

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_ONE);
  });

  it('is false once the Free tenant is archived', async () => {
    await seedMember({ status: TENANT_STATUS.ARCHIVED });

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_NONE);
  });

  it('is false for an owner of a paid tenant only', async () => {
    await seedMember({ plan: TENANT_PLAN.GROWTH });

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_NONE);
  });

  it('is false for an editor of a Free tenant', async () => {
    await seedMember({}, MEMBERSHIP_ROLE.EDITOR);

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_NONE);
  });

  it('is false for a person whose OWNER invite on a Free tenant is still unaccepted', async () => {
    const tenant = await insertTestTenant(db());
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId: tenant.id,
        email: OWNER_EMAIL,
        emailIndex: testPersonalEmailIndex(OWNER_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    expect(await ownsFreeTenant(OWNER_EMAIL)).toEqual(OWNS_NONE);
  });

  it('is false for a different person than the owner', async () => {
    await seedMember();

    expect(await ownsFreeTenant(SELF_SERVE_OTHER_EMAIL)).toEqual(OWNS_NONE);
  });

  it('fails with DB_INVALID_EMAIL for a value that is not an address', async () => {
    expect(await ownsFreeTenant(NOT_AN_ADDRESS)).toEqual({
      ok: false,
      error: ERROR_CODE.DB_INVALID_EMAIL,
    });
  });
});
