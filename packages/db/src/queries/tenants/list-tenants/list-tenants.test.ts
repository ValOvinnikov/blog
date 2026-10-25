import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listTenants } from './list-tenants';

vi.mock('@blog/db/client');

const MOCK_ACME_DOMAIN = 'acme.example.com';
const MOCK_ZETA_DOMAIN = 'zeta.example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenants, () => {
  describe('with an active and a deprovisioned tenant', () => {
    beforeEach(async () => {
      await db()
        .insert(schema.tenants)
        .values([
          {
            name: 'Acme',
            primaryDomain: MOCK_ACME_DOMAIN,
            sanityProjectId: 'p1',
            sanityDataset: 'production',
            locale: LOCALE_ISO_CODES.EN,
            plan: TENANT_PLAN.FREE,
            status: TENANT_STATUS.ACTIVE,
          },
          {
            name: 'Zeta',
            primaryDomain: MOCK_ZETA_DOMAIN,
            sanityProjectId: 'p2',
            sanityDataset: 'production',
            locale: LOCALE_ISO_CODES.EN,
            plan: TENANT_PLAN.FREE,
            status: TENANT_STATUS.ARCHIVED,
            deprovisionedAt: new Date(),
          },
        ]);
    });

    it('excludes deprovisioned tenants by default', async () => {
      const result = await listTenants();

      expect(result.map((tenant) => tenant.name)).toEqual(['Acme']);
    });

    it('includes deprovisioned tenants when includeArchived is true', async () => {
      const result = await listTenants({ includeArchived: true });

      expect(result.map((tenant) => tenant.name)).toEqual(['Acme', 'Zeta']);
    });
  });

  it('returns every tenant ordered by name', async () => {
    await db()
      .insert(schema.tenants)
      .values([
        {
          name: 'Zeta',
          primaryDomain: MOCK_ZETA_DOMAIN,
          sanityProjectId: 'p1',
          sanityDataset: 'production',
          locale: LOCALE_ISO_CODES.EN,
          plan: TENANT_PLAN.FREE,
          status: TENANT_STATUS.ACTIVE,
        },
        {
          name: 'Acme',
          primaryDomain: MOCK_ACME_DOMAIN,
          sanityProjectId: 'p2',
          sanityDataset: 'production',
          locale: LOCALE_ISO_CODES.EN,
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
});
