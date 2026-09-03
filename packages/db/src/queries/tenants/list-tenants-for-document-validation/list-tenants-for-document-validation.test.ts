import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantsForDocumentValidation } from './list-tenants-for-document-validation';

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

const baseTenant = {
  name: 'Acme',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'p1',
  sanityDataset: 'production',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
};

describe(listTenantsForDocumentValidation, () => {
  it('includes an ACTIVE, non-deprovisioned tenant', async () => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      status: TENANT_STATUS.ACTIVE,
    });

    const result = await listTenantsForDocumentValidation();

    expect(result.map((tenant) => tenant.name)).toEqual(['Acme']);
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'excludes a tenant with status %s',
    async (status) => {
      await db.insert(schema.tenants).values({ ...baseTenant, status });

      const result = await listTenantsForDocumentValidation();

      expect(result).toEqual([]);
    },
  );

  it('excludes a deprovisioned tenant even if status still reads ACTIVE', async () => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: new Date(),
    });

    const result = await listTenantsForDocumentValidation();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsForDocumentValidation();

    expect(result).toEqual([]);
  });
});
