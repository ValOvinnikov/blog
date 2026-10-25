import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import { claimTenantOwnerEmail } from '@blog/db/queries/tenants/claim-tenant-owner-email';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { releaseTenantOwnerEmail } from './release-tenant-owner-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

async function readHeadsUpSentAt(id: string) {
  const [row] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, id));
  return row?.ownerInviteHeadsUpSentAt;
}

describe(releaseTenantOwnerEmail, () => {
  it('clears its own claim so the email can be claimed again', async () => {
    const { id } = await insertTestTenant(db());
    const claimedAt = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
    );
    if (!claimedAt) throw new Error('claim failed');

    await releaseTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      claimedAt,
    );

    await expect(readHeadsUpSentAt(id)).resolves.toBeNull();
    await expect(
      claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
    ).resolves.toBeInstanceOf(Date);
  });

  it('leaves a claim made at another time in place', async () => {
    const sentAt = new Date(Date.now() - 60_000);
    const { id } = await insertTestTenant(db(), {
      ownerInviteHeadsUpSentAt: sentAt,
    });

    await releaseTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      new Date(),
    );

    await expect(readHeadsUpSentAt(id)).resolves.toEqual(sentAt);
  });
});
