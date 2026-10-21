import type { TMaybeNull } from '@blog/config/types';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, TEST_INVITE_EMAIL } from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { findPendingInviteByEmailIndex } from './find-pending-invite-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
});

async function insertInvite(consumedAt: TMaybeNull<Date>): Promise<string> {
  const { id: tenantId } = await insertTestTenant(db());
  await db()
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      email: TEST_INVITE_EMAIL,
      emailIndex: testPersonalEmailIndex(TEST_INVITE_EMAIL),
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt,
    });
  return tenantId;
}

describe(findPendingInviteByEmailIndex, () => {
  it('returns every pending invite for the address across tenants, skipping consumed ones', async () => {
    const first = await insertInvite(null);
    const second = await insertInvite(null);
    await insertInvite(new Date());

    const invites = await findPendingInviteByEmailIndex(
      TEST_INVITE_EMAIL.toUpperCase(),
    );

    expect(invites.map(({ tenantId }) => tenantId).sort()).toEqual(
      [first, second].sort(),
    );
  });

  it('returns nothing for an address with no invite', async () => {
    await insertInvite(null);

    await expect(
      findPendingInviteByEmailIndex('someone-else@example.com'),
    ).resolves.toEqual([]);
  });
});
