import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantById } from './get-tenant-by-id';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(getTenantById, () => {
  it('returns the row for an existing id', async () => {
    const [inserted] = await db
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
    if (!inserted) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantById(inserted.id);

    expect(result).toMatchObject({ id: inserted.id, name: 'Acme' });
  });

  it('returns undefined for an id with no row', async () => {
    const result = await getTenantById('00000000-0000-0000-0000-000000000000');

    expect(result).toBeUndefined();
  });

  it('excludes a deprovisioned tenant by default', async () => {
    const [inserted] = await db
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'abc123',
        sanityDataset: 'production',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: new Date(),
      })
      .returning();
    if (!inserted) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantById(inserted.id);

    expect(result).toBeUndefined();
  });

  it('returns a deprovisioned tenant when includeArchived is true', async () => {
    const [inserted] = await db
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'abc123',
        sanityDataset: 'production',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: new Date(),
      })
      .returning();
    if (!inserted) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantById(inserted.id, { includeArchived: true });

    expect(result).toMatchObject({ id: inserted.id, name: 'Acme' });
  });
});
