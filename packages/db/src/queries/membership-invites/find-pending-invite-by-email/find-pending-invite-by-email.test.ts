import * as schema from '@blog/db/schema';
import type { TMembershipInvite } from '@blog/db/schema/membership-invites';
import { insertTestTenant, MOCK_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import { taggedMixedCaseAddress } from '@blog/db/testing/personal-data-rows';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { findPendingInviteByEmail } from './find-pending-invite-by-email';

vi.mock('@blog/db/client');

faker.seed(5765);

const db = useQueryTestDb();

const MOCK_TAGGED_INVITE_EMAIL = taggedMixedCaseAddress(MOCK_INVITE_EMAIL);
const MOCK_UNINVITED_EMAIL = faker.internet.email();

async function insertInvite(
  overrides: Parameters<typeof mockMembershipInvite>[2] = {},
): Promise<string> {
  const { id: tenantId } = await insertTestTenant(db());
  await mockMembershipInvite(db(), tenantId, {
    email: MOCK_INVITE_EMAIL,
    ...overrides,
  });
  return tenantId;
}

function tenantIdsOf(invites: TMembershipInvite[]): string[] {
  return invites.map(({ tenantId }) => tenantId);
}

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

describe(findPendingInviteByEmail, () => {
  it('returns every pending invite across tenants, skipping consumed ones', async () => {
    const pendingTenantId = await insertInvite();
    const secondPendingTenantId = await insertInvite();
    await insertInvite({ consumedAt: MOCK_INVITE_CONSUMED_AT });

    const invites = await findPendingInviteByEmail(
      MOCK_INVITE_EMAIL.toUpperCase(),
    );

    expect(tenantIdsOf(invites).sort()).toEqual(
      [pendingTenantId, secondPendingTenantId].sort(),
    );
  });

  it('matches an address padded with whitespace', async () => {
    const tenantId = await insertInvite();

    const invites = await findPendingInviteByEmail(`  ${MOCK_INVITE_EMAIL}  `);

    expect(tenantIdsOf(invites)).toEqual([tenantId]);
  });

  it('finds an invite sent to a +tag address by that exact address', async () => {
    const tenantId = await insertInvite({ email: MOCK_TAGGED_INVITE_EMAIL });

    const invites = await findPendingInviteByEmail(MOCK_TAGGED_INVITE_EMAIL);

    expect(tenantIdsOf(invites)).toEqual([tenantId]);
  });

  it.each([
    [
      'a +tag variant of an invited address',
      MOCK_INVITE_EMAIL,
      MOCK_TAGGED_INVITE_EMAIL,
    ],
    [
      'the plain address of an invited +tag variant',
      MOCK_TAGGED_INVITE_EMAIL,
      MOCK_INVITE_EMAIL,
    ],
  ])('finds nothing for %s', async (_label, sentTo, requested) => {
    await insertInvite({ email: sentTo });

    const invites = await findPendingInviteByEmail(requested);

    expect(invites).toEqual([]);
  });

  it('returns nothing for an address with no invite', async () => {
    await insertInvite();

    const invites = await findPendingInviteByEmail(MOCK_UNINVITED_EMAIL);

    expect(invites).toEqual([]);
  });
});
