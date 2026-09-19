import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listTenants } from './list-tenants';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenants, () => {
  it('returns every tenant ordered by name', async () => {
    await db()
      .insert(schema.tenants)
      .values([
        {
          name: 'Zeta',
          primaryDomain: 'zeta.example.com',
          sanityProjectId: 'p1',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ACTIVE,
        },
        {
          name: 'Acme',
          primaryDomain: 'acme.example.com',
          sanityProjectId: 'p2',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.GROWTH,
          status: TENANT_STATUS.ACTIVE,
        },
      ]);

    const result = await listTenants();

    expect(result.map((tenant) => tenant.name)).toEqual(['Acme', 'Zeta']);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenants();

    expect(result).toEqual([]);
  });

  it('excludes deprovisioned tenants by default', async () => {
    await db()
      .insert(schema.tenants)
      .values([
        {
          name: 'Acme',
          primaryDomain: 'acme.example.com',
          sanityProjectId: 'p1',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ACTIVE,
        },
        {
          name: 'Zeta',
          primaryDomain: 'zeta.example.com',
          sanityProjectId: 'p2',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ARCHIVED,
          deprovisionedAt: new Date(),
        },
      ]);

    const result = await listTenants();

    expect(result.map((tenant) => tenant.name)).toEqual(['Acme']);
  });

  it('includes deprovisioned tenants when includeArchived is true', async () => {
    await db()
      .insert(schema.tenants)
      .values([
        {
          name: 'Acme',
          primaryDomain: 'acme.example.com',
          sanityProjectId: 'p1',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ACTIVE,
        },
        {
          name: 'Zeta',
          primaryDomain: 'zeta.example.com',
          sanityProjectId: 'p2',
          sanityDataset: 'production',
          locale: 'en',
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ARCHIVED,
          deprovisionedAt: new Date(),
        },
      ]);

    const result = await listTenants({ includeArchived: true });

    expect(result.map((tenant) => tenant.name)).toEqual(['Acme', 'Zeta']);
  });
});
