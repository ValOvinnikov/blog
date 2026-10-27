import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { isNull } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { claimTenantOwnerEmail } from './claim-tenant-owner-email';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_HEADS_UP_SENT_AT = faker.date.past({ refDate: MOCK_NOW });
const MOCK_LATER = faker.date.soon({ refDate: MOCK_NOW });

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
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('claims an email that has never been sent and records when', async () => {
    const claimedAt = await claimTenantOwnerEmail(
      tenantId,
      TENANT_OWNER_EMAIL.INVITE_NUDGE,
    );

    const { ownerInviteNudgeSentAt } = await readTenant(tenantId);
    expect(claimedAt).toEqual(MOCK_NOW);
    expect(ownerInviteNudgeSentAt).toEqual(MOCK_NOW);
  });

  it('refuses a second claim and keeps the first send time', async () => {
    await claimTenantOwnerEmail(tenantId, TENANT_OWNER_EMAIL.SITE_READY);
    vi.setSystemTime(MOCK_LATER);

    const secondClaim = await claimTenantOwnerEmail(
      tenantId,
      TENANT_OWNER_EMAIL.SITE_READY,
    );

    const { ownerSiteReadySentAt } = await readTenant(tenantId);
    expect(secondClaim).toBeNull();
    expect(ownerSiteReadySentAt).toEqual(MOCK_NOW);
  });

  it('claims each email independently of the others', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerInviteHeadsUpSentAt: MOCK_HEADS_UP_SENT_AT,
    });

    const claimedAt = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_NUDGE,
    );

    expect(claimedAt).toEqual(MOCK_NOW);
  });

  it('lets exactly one of two concurrent claims through', async () => {
    const results = await Promise.all([
      claimTenantOwnerEmail(tenantId, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
      claimTenantOwnerEmail(tenantId, TENANT_OWNER_EMAIL.INVITE_HEADS_UP),
    ]);

    expect(results.filter((result) => !isNull(result))).toEqual([MOCK_NOW]);
  });

  it('claims nothing for a tenant id that does not exist', async () => {
    const claimedAt = await claimTenantOwnerEmail(
      MOCK_MISSING_TENANT_ID,
      TENANT_OWNER_EMAIL.SITE_READY,
    );

    expect(claimedAt).toBeNull();
  });
});
