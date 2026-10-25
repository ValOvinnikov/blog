import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantWebhookCreatedAt } from './set-tenant-webhook-created-at';

vi.mock('@blog/db/client');

const MOCK_WEBHOOK_CREATED_AT_ISO = '2026-08-15T12:00:00.000Z';

const db = useQueryTestDb();

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantWebhookCreatedAt, () => {
  let tenantId: string;

  beforeEach(async () => {
    tenantId = await insertDraftTenant();
  });

  it('sets the webhook-created-at timestamp', async () => {
    const webhookCreatedAt = new Date(MOCK_WEBHOOK_CREATED_AT_ISO);

    await setTenantWebhookCreatedAt(tenantId, webhookCreatedAt);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row?.webhookCreatedAt).toEqual(webhookCreatedAt);
  });

  it('leaves every other column untouched', async () => {
    await setTenantWebhookCreatedAt(
      tenantId,
      new Date(MOCK_WEBHOOK_CREATED_AT_ISO),
    );

    const [row] = await db()
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
