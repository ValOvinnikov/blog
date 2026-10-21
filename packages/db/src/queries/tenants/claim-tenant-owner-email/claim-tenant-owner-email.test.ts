import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { claimTenantOwnerEmail } from './claim-tenant-owner-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.tenants);
});

async function readTenant(id: string): Promise<schema.TTenant> {
  const [row] = await db()
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, id));
  if (!row) throw new Error('tenant row missing');
  return row;
}

describe(claimTenantOwnerEmail, () => {
  it('claims an email that has never been sent and records when', async () => {
    const { id } = await insertTestTenant(db());

    const claimedAt = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_NUDGE,
    );

    expect(claimedAt).toBeInstanceOf(Date);
    expect((await readTenant(id)).ownerInviteNudgeSentAt).toEqual(claimedAt);
  });

  it('refuses a second claim and keeps the first send time', async () => {
    const { id } = await insertTestTenant(db());
    const first = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.SITE_READY,
    );

    await expect(
      claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.SITE_READY),
    ).resolves.toBeNull();
    expect((await readTenant(id)).ownerSiteReadySentAt).toEqual(first);
  });

  it('claims each email independently of the others', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerInviteHeadsUpSentAt: new Date(),
    });

    await expect(
      claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.INVITE_NUDGE),
    ).resolves.toBeInstanceOf(Date);
  });

  it('lets exactly one of two concurrent claims through', async () => {
    const { id } = await insertTestTenant(db());

    const results = await Promise.all([
      claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
    ]);

    expect(results.filter((result) => result !== null)).toHaveLength(1);
  });

  it('claims nothing for a tenant id that does not exist', async () => {
    await expect(
      claimTenantOwnerEmail(crypto.randomUUID(), TENANT_OWNER_EMAIL.SITE_READY),
    ).resolves.toBeNull();
  });
});
