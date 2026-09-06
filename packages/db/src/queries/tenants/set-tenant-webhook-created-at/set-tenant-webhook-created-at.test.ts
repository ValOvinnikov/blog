import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantWebhookCreatedAt } from './set-tenant-webhook-created-at';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(setTenantWebhookCreatedAt, () => {
  it('sets the webhook-created-at timestamp', async () => {
    const tenantId = await insertDraftTenant();
    const webhookCreatedAt = new Date('2026-08-15T12:00:00.000Z');

    await setTenantWebhookCreatedAt(tenantId, webhookCreatedAt);

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row?.webhookCreatedAt).toEqual(webhookCreatedAt);
  });

  it('leaves every other column untouched', async () => {
    const tenantId = await insertDraftTenant();

    await setTenantWebhookCreatedAt(
      tenantId,
      new Date('2026-08-15T12:00:00.000Z'),
    );

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      name: 'Acme',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });
  });
});
