import { ADMIN_ROLE, GRANTED_VIA } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { createAdmin } from './create-admin';

vi.mock('@blog/db/client');

faker.seed(602205);

const MOCK_MISSING_USER_ID = faker.string.uuid();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(createAdmin, () => {
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestUser(db()));
  });

  it('inserts a new admin row', async () => {
    const { userId: adminUserId, role } = await createAdmin(
      userId,
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(adminUserId).toBe(userId);
    expect(role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('is idempotent when the user already has an admin row', async () => {
    const first = await createAdmin(
      userId,
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    const second = await createAdmin(
      userId,
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    const rows = await db().select().from(schema.admins);
    expect(second).toEqual(first);
    expect(rows).toHaveLength(1);
  });

  it('keeps the stored role when re-run with a different role', async () => {
    const first = await createAdmin(
      userId,
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    const second = await createAdmin(
      userId,
      ADMIN_ROLE.MODERATOR,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(second).toEqual(first);
    expect(second.role).toBe(ADMIN_ROLE.SUPERADMIN);
  });

  it('rejects an admin grant for a user that does not exist', async () => {
    await expect(
      createAdmin(
        MOCK_MISSING_USER_ID,
        ADMIN_ROLE.SUPERADMIN,
        GRANTED_VIA.BREAK_GLASS,
      ),
    ).rejects.toThrow();
  });

  it('leaves grantedBy NULL and still sets grantedAt for a break-glass grant', async () => {
    const { grantedVia, grantedBy, grantedAt } = await createAdmin(
      userId,
      ADMIN_ROLE.SUPERADMIN,
      GRANTED_VIA.BREAK_GLASS,
    );

    expect(grantedVia).toBe(GRANTED_VIA.BREAK_GLASS);
    expect(grantedBy).toBeNull();
    expect(grantedAt).toBeInstanceOf(Date);
  });

  it('removes the admin row when its owning user is deleted', async () => {
    await createAdmin(userId, ADMIN_ROLE.SUPERADMIN, GRANTED_VIA.BREAK_GLASS);

    await db().delete(schema.users).where(eq(schema.users.id, userId));

    const rows = await db().select().from(schema.admins);
    expect(rows).toHaveLength(0);
  });

  describe('with a granting user', () => {
    let granterId: string;

    beforeEach(async () => {
      ({ id: granterId } = await insertTestUser(db()));
    });

    it('records the granter, grantedVia and grantedAt for an in-app promotion', async () => {
      const { grantedVia, grantedBy, grantedAt } = await createAdmin(
        userId,
        ADMIN_ROLE.SUPERADMIN,
        GRANTED_VIA.PROMOTION,
        granterId,
      );

      expect(grantedVia).toBe(GRANTED_VIA.PROMOTION);
      expect(grantedBy).toBe(granterId);
      expect(grantedAt).toBeInstanceOf(Date);
    });

    it('keeps grantedVia as PROMOTION after the granting user is deleted', async () => {
      const admin = await createAdmin(
        userId,
        ADMIN_ROLE.SUPERADMIN,
        GRANTED_VIA.PROMOTION,
        granterId,
      );

      await db().delete(schema.users).where(eq(schema.users.id, granterId));

      const [row] = await db()
        .select()
        .from(schema.admins)
        .where(eq(schema.admins.id, admin.id));
      expect(row?.grantedBy).toBeNull();
      expect(row?.grantedVia).toBe(GRANTED_VIA.PROMOTION);
    });
  });
});
