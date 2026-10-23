import type { TMaybeNull } from '@blog/config/types';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import * as schema from '@blog/db/schema';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { findPendingInviteByEmailIndex } from './find-pending-invite-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const TAGGED_INVITE_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

async function insertInvite(
  consumedAt: TMaybeNull<Date>,
  email = MOCK_INVITE_EMAIL,
): Promise<string> {
  const { id: tenantId } = await insertTestTenant(db());
  await db()
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      ...inviteEmailColumns(email),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt,
    });
  return tenantId;
}

describe(findPendingInviteByEmailIndex, () => {
  let pendingTenantId: string;

  beforeEach(async () => {
    pendingTenantId = await insertInvite(null);
  });

  it('returns every pending invite for the address across tenants, skipping consumed ones', async () => {
    const secondPendingTenantId = await insertInvite(null);
    await insertInvite(new Date());

    const invites = await findPendingInviteByEmailIndex(
      MOCK_INVITE_EMAIL.toUpperCase(),
    );

    expect(invites.map(({ tenantId }) => tenantId).sort()).toEqual(
      [pendingTenantId, secondPendingTenantId].sort(),
    );
  });

  it.each([
    [
      'an address by a +tag variant of it',
      MOCK_INVITE_EMAIL,
      TAGGED_INVITE_EMAIL,
    ],
    ['a +tag variant by the address', TAGGED_INVITE_EMAIL, MOCK_INVITE_EMAIL],
  ])(
    'never matches an invite sent to %s',
    async (_label, sentTo, requested) => {
      const sentToTenantId = await insertInvite(null, sentTo);

      const invites = await findPendingInviteByEmailIndex(requested);

      expect(invites.map(({ tenantId }) => tenantId)).not.toContain(
        sentToTenantId,
      );
    },
  );

  it('matches an invite not yet backfilled by its plain email', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: MOCK_INVITE_EMAIL,
        emailIndex: testPersonalEmailIndex(MOCK_INVITE_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    const invites = await findPendingInviteByEmailIndex(MOCK_INVITE_EMAIL);

    expect(invites.map((invite) => invite.tenantId)).toContain(tenantId);
  });

  it('returns nothing for an address with no invite', async () => {
    await expect(
      findPendingInviteByEmailIndex(faker.internet.email()),
    ).resolves.toEqual([]);
  });
});
