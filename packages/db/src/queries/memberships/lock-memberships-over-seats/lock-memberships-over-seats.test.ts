import { faker } from '@faker-js/faker';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import { countMembershipsOverSeats } from '@shinefold/db/queries/memberships/count-memberships-over-seats';
import { getMembership } from '@shinefold/db/queries/memberships/get-membership';
import { listMembershipsWithTenantsForUser } from '@shinefold/db/queries/memberships/list-memberships-with-tenants-for-user';
import * as schema from '@shinefold/db/schema';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { deleteSeatRows } from '@shinefold/db/testing/membership-invites/fixtures';
import { mockMembership } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { lockMembershipsOverSeats } from './lock-memberships-over-seats';

vi.mock('@shinefold/db/client');

faker.seed(6875);

const db = useQueryTestDb();
const tenant = useTestTenant(db);

async function addMember(role: TMembershipRole, createdAt: Date) {
  const { id: userId } = await insertTestUser(db(), {
    id: faker.string.uuid(),
  });
  return mockMembership(db(), {
    userId,
    tenantId: tenant().id,
    role,
    createdAt,
  });
}

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(lockMembershipsOverSeats, () => {
  describe('a Growth site with four members', () => {
    beforeEach(async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.GROWTH });
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
        lockMembershipsOverSeats(tenant().id, TENANT_PLAN.GROWTH, MOCK_NOW),
      ).resolves.toBe(1);

      await expect(
        getMembership(locked.userId, tenant().id),
      ).resolves.toBeUndefined();
      await expect(
        listMembershipsWithTenantsForUser(locked.userId),
      ).resolves.toEqual([]);
      await expect(getMembership(kept.userId, tenant().id)).resolves.toEqual(
        kept,
      );
      await expect(getMembership(owner.userId, tenant().id)).resolves.toEqual(
        owner,
      );
    });
  });

  describe('an owner and one editor on Free', () => {
    beforeEach(async () => {
      await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);
      await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);
    });

    describe('once locked', () => {
      beforeEach(async () => {
        await lockMembershipsOverSeats(tenant().id, TENANT_PLAN.FREE, MOCK_NOW);
      });

      it('keeps the locked membership row', async () => {
        const rows = await db().select().from(schema.memberships);
        expect(rows.map(({ lockedAt }) => lockedAt)).toContainEqual(MOCK_NOW);
        expect(rows).toHaveLength(2);
      });

      it('locks nothing a second time', async () => {
        await expect(
          lockMembershipsOverSeats(tenant().id, TENANT_PLAN.FREE, MOCK_NOW),
        ).resolves.toBe(0);
      });
    });

    it('locks nothing once the site has moved to a paid plan', async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.GROWTH });

      await expect(
        lockMembershipsOverSeats(tenant().id, TENANT_PLAN.FREE, MOCK_NOW),
      ).resolves.toBe(0);
    });
  });

  describe('an owner and one editor on Starter', () => {
    beforeEach(async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.STARTER });
      await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);
      await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);
    });

    it('locks the editor over the seats', async () => {
      await expect(
        lockMembershipsOverSeats(tenant().id, TENANT_PLAN.STARTER, MOCK_NOW),
      ).resolves.toBe(1);
    });

    it('locks nothing once the site has moved back up', async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.GROWTH });

      await expect(
        lockMembershipsOverSeats(tenant().id, TENANT_PLAN.STARTER, MOCK_NOW),
      ).resolves.toBe(0);
    });
  });
});

describe(countMembershipsOverSeats, () => {
  it('counts the unlocked members past the seats', async () => {
    await addMember(MEMBERSHIP_ROLE.OWNER, MOCK_NOW);
    await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);
    await addMember(MEMBERSHIP_ROLE.EDITOR, MOCK_NOW);

    await expect(countMembershipsOverSeats(tenant().id, 1)).resolves.toBe(2);
    await lockMembershipsOverSeats(tenant().id, TENANT_PLAN.FREE, MOCK_NOW);
    await expect(countMembershipsOverSeats(tenant().id, 1)).resolves.toBe(0);
  });
});
