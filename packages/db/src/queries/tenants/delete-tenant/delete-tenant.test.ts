import { PRESET_ID } from '@blog/config/constants';
import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { deleteTenant } from './delete-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(
  options: { archived?: boolean; slug?: string } = {},
): Promise<string> {
  const { archived = true, slug = 'acme' } = options;

  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: archived ? TENANT_STATUS.ARCHIVED : TENANT_STATUS.ACTIVE,
      deprovisionedAt: archived ? new Date() : undefined,
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
  await db.delete(schema.siteConfig);
  await db.delete(schema.tenantDomains);
  await db.delete(schema.memberships);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
});

describe(deleteTenant, () => {
  it('deletes an archived tenant row', async () => {
    const tenantId = await insertTenant({ archived: true });

    const result = await deleteTenant(tenantId);

    expect(result).toEqual({ outcome: 'deleted' });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toEqual([]);
  });

  it('refuses to delete a tenant that is not archived, and the row survives', async () => {
    const tenantId = await insertTenant({ archived: false });

    const result = await deleteTenant(tenantId);

    expect(result).toEqual({ outcome: 'not-archived' });

    const remaining = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(remaining).toHaveLength(1);
  });

  it('returns not-found for a tenant id that does not exist', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    const result = await deleteTenant(missingId);

    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('cascades to dependent membership and tenant_domains rows for that tenant', async () => {
    const tenantId = await insertTenant({ archived: true });
    await db.insert(schema.users).values({ id: 'user-1' });
    await db.insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
    await db.insert(schema.tenantDomains).values({
      tenantId,
      domain: 'acme.example.com',
    });

    await deleteTenant(tenantId);

    const remainingMemberships = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenantId));
    expect(remainingMemberships).toEqual([]);

    const remainingDomains = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, tenantId));
    expect(remainingDomains).toEqual([]);
  });

  it('cascades to a dependent site_config row for that tenant', async () => {
    const tenantId = await insertTenant({ archived: true });
    await db.insert(schema.siteConfig).values({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
    });

    await deleteTenant(tenantId);

    const remainingSiteConfig = await db
      .select()
      .from(schema.siteConfig)
      .where(eq(schema.siteConfig.tenantId, tenantId));
    expect(remainingSiteConfig).toEqual([]);
  });

  it('frees the slug for a new tenant after a successful delete', async () => {
    const tenantId = await insertTenant({ archived: true, slug: 'acme' });

    await deleteTenant(tenantId);

    const [newTenant] = await db
      .insert(schema.tenants)
      .values({
        slug: 'acme',
        name: 'Acme Reborn',
        primaryDomain: 'acme-reborn.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    expect(newTenant?.slug).toBe('acme');
  });
});
