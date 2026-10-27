import { TENANT_OWNER_EMAIL } from '@blog/db/constants';
import { claimTenantOwnerEmail } from '@blog/db/queries/tenants/claim-tenant-owner-email';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { releaseTenantOwnerEmail } from './release-tenant-owner-email';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_SENT_AT = faker.date.past({ refDate: MOCK_NOW });

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
    await claimTenantOwnerEmail(id, TENANT_OWNER_EMAIL.INVITE_HEADS_UP);

    await releaseTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      MOCK_NOW,
    );

    const sentAt = await readHeadsUpSentAt(id);
    const reclaimedAt = await claimTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
    );
    expect(sentAt).toBeNull();
    expect(reclaimedAt).toEqual(MOCK_NOW);
  });

  it('leaves a claim made at another time in place', async () => {
    const { id } = await insertTestTenant(db(), {
      ownerInviteHeadsUpSentAt: MOCK_SENT_AT,
    });

    await releaseTenantOwnerEmail(
      id,
      TENANT_OWNER_EMAIL.INVITE_HEADS_UP,
      MOCK_NOW,
    );

    const sentAt = await readHeadsUpSentAt(id);
    expect(sentAt).toEqual(MOCK_SENT_AT);
  });
});
