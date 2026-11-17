import { faker } from '@faker-js/faker';
import { TENANT_PLAN } from '@shinefold/config/constants';
import {
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_REMOVAL_OUTCOME,
  MEMBERSHIP_ROLE,
} from '@shinefold/db/constants';
import { consumeMembershipInvite } from '@shinefold/db/queries/membership-invites/consume-membership-invite';
import { createMembershipInvite } from '@shinefold/db/queries/membership-invites/create-membership-invite';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import type { TMembership } from '@shinefold/db/schema/memberships';
import {
  insertTestTenant,
  MOCK_INVITE_EMAIL,
  MOCK_OWNER_EMAIL,
  insertTestUser,
} from '@shinefold/db/testing/fixtures';
import {
  deleteSeatRows,
  inviteOf,
} from '@shinefold/db/testing/membership-invites/fixtures';
import { insertTestMember } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { removeMembership } from './remove-membership';

vi.mock('@shinefold/db/client');

faker.seed(7170);

const db = useQueryTestDb();

const MOCK_SECOND_OWNER_EMAIL = faker.internet.email().toLowerCase();

let tenantId: string;

beforeEach(async () => {
  ({ id: tenantId } = await insertTestTenant(db(), {
    plan: TENANT_PLAN.GROWTH,
  }));
});

afterEach(async () => {
  await deleteSeatRows(db());
});

describe(removeMembership, () => {
  let owner: TMembership;

  beforeEach(async () => {
    owner = await insertTestMember(db(), tenantId, MOCK_OWNER_EMAIL);
  });

  it('removes an editor and frees their address for a new invite', async () => {
    const invite = inviteOf(
      await createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.EDITOR,
      ),
    );
    const { id: editorUserId } = await insertTestUser(db(), {
      id: faker.string.uuid(),
      ...userPersonalColumns({ email: MOCK_INVITE_EMAIL }),
    });
    const editor = await consumeMembershipInvite(invite.id, editorUserId);

    await expect(
      removeMembership(tenantId, editor?.id ?? '', owner.userId),
    ).resolves.toBe(MEMBERSHIP_REMOVAL_OUTCOME.REMOVED);

    await expect(
      createMembershipInvite(
        tenantId,
        MOCK_INVITE_EMAIL,
        MEMBERSHIP_ROLE.EDITOR,
      ),
    ).resolves.toMatchObject({ outcome: MEMBERSHIP_INVITE_OUTCOME.CREATED });
    await expect(db().select().from(schema.memberships)).resolves.toEqual([
      owner,
    ]);
  });

  it('refuses to remove the only owner and changes nothing', async () => {
    await expect(
      removeMembership(tenantId, owner.id, faker.string.uuid()),
    ).resolves.toBe(MEMBERSHIP_REMOVAL_OUTCOME.LAST_OWNER);
    await expect(db().select().from(schema.memberships)).resolves.toEqual([
      owner,
    ]);
  });

  describe('with a second owner', () => {
    let secondOwner: TMembership;

    beforeEach(async () => {
      secondOwner = await insertTestMember(
        db(),
        tenantId,
        MOCK_SECOND_OWNER_EMAIL,
      );
    });

    it('removes that owner while the first stays', async () => {
      await expect(
        removeMembership(tenantId, secondOwner.id, owner.userId),
      ).resolves.toBe(MEMBERSHIP_REMOVAL_OUTCOME.REMOVED);
    });

    it('refuses to remove the acting member themselves', async () => {
      await expect(
        removeMembership(tenantId, secondOwner.id, secondOwner.userId),
      ).resolves.toBe(MEMBERSHIP_REMOVAL_OUTCOME.SELF);
      await expect(
        db().select().from(schema.memberships),
      ).resolves.toHaveLength(2);
    });
  });

  it('never removes another tenant’s member', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const outsider = await insertTestMember(
      db(),
      otherTenantId,
      MOCK_SECOND_OWNER_EMAIL,
      {
        role: MEMBERSHIP_ROLE.EDITOR,
      },
    );

    await expect(
      removeMembership(tenantId, outsider.id, owner.userId),
    ).resolves.toBe(MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND);
  });
});
