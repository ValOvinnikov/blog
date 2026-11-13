import { TENANT_PLAN } from '@blog/config/constants';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@blog/db/constants';
import { countMembershipsOverSeats } from '@blog/db/queries/memberships/count-memberships-over-seats';
import { getMembership } from '@blog/db/queries/memberships/get-membership';
import { listMembershipsWithTenantsForUser } from '@blog/db/queries/memberships/list-memberships-with-tenants-for-user';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { MOCK_NOW } from '@blog/db/testing/frozen-clock';
import { deleteSeatRows } from '@blog/db/testing/membership-invites/fixtures';
import { mockMembership } from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { lockMembershipsOverSeats } from './lock-memberships-over-seats';

vi.mock('@blog/db/client');

faker.seed(6875);

const db = useQueryTestDb();

let tenantId: string;

async function addMember(role: TMembershipRole, createdAt: Date) {
  const { id: userId } = await insertTestUser(db(), {
    id: faker.string.uuid(),
  });
  return mockMembership(db(), { userId, tenantId, role, createdAt });
}

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(lockMembershipsOverSeats, () => {
  describe('a Growth site with four members', () => {
    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.GROWTH,
      }));
    });

    it('locks the member who joined last and keeps the owner seated', async () => {
      const joinedFirst = faker.date.past({ refDate: MOCK_NOW });
      const joinedSecond = faker.date.soon({ refDate: joinedFirst });
      const joinedLast = faker.date.soon({ refDate: joinedSecond });
      const kept = await addMember(MEMBERSHIP_ROLE.EDITOR, joinedFirst);
      await addMember(MEMBERSHIP_ROLE.EDITOR, joinedSecond);
      const locked = await addMember(MEMBERSHIP_ROLE.EDITOR, joinedLast);
      const owner = await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);

      await expect(
        lockMembershipsOverSeats(tenantId, TENANT_PLAN.GROWTH, MOCK_NOW),
      ).resolves.toBe(1);

      await expect(
        getMembership(locked.userId, tenantId),
      ).resolves.toBeUndefined();
      await expect(
        listMembershipsWithTenantsForUser(locked.userId),
      ).resolves.toEqual([]);
      await expect(getMembership(kept.userId, tenantId)).resolves.toEqual(kept);
      await expect(getMembership(owner.userId, tenantId)).resolves.toEqual(
        owner,
      );
    });
  });

  describe('an owner and one editor on Free', () => {
    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db()));
      await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);
      await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);
    });

    describe('once locked', () => {
      beforeEach(async () => {
        await lockMembershipsOverSeats(tenantId, TENANT_PLAN.FREE, MOCK_NOW);
      });

      it('keeps the locked membership row', async () => {
        const rows = await db().select().from(schema.memberships);
        expect(rows.map(({ lockedAt }) => lockedAt)).toContainEqual(MOCK_NOW);
        expect(rows).toHaveLength(2);
      });

      it('locks nothing a second time', async () => {
        await expect(
          lockMembershipsOverSeats(tenantId, TENANT_PLAN.FREE, MOCK_NOW),
        ).resolves.toBe(0);
      });
    });

    it('locks nothing once the site has moved to a paid plan', async () => {
      await db().update(schema.tenants).set({ plan: TENANT_PLAN.GROWTH });

      await expect(
        lockMembershipsOverSeats(tenantId, TENANT_PLAN.FREE, MOCK_NOW),
      ).resolves.toBe(0);
    });
  });
});

describe(countMembershipsOverSeats, () => {
  it('counts the unlocked members past the seats', async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);
    await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);
    await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);

    await expect(countMembershipsOverSeats(tenantId, 1)).resolves.toBe(2);
    await lockMembershipsOverSeats(tenantId, TENANT_PLAN.FREE, MOCK_NOW);
    await expect(countMembershipsOverSeats(tenantId, 1)).resolves.toBe(0);
  });
});
