import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createTenant } from '@blog/db/queries/tenants/create-tenant';
import * as schema from '@blog/db/schema';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantRow } from './get-tenant-row';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantRow, () => {
  it('returns the row for an existing tenant id', async () => {
    const created = await createTenant({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
      locale: LOCALE_ISO_CODES.EN,
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    });
    if (!created.ok) throw new Error('setup: createTenant failed.');

    const result = await getTenantRow(created.data.id);

    expect(result).toMatchObject({ id: created.data.id, name: 'Acme' });
  });

  it('throws for an unknown tenant id', async () => {
    const missingId = '00000000-0000-0000-0000-000000000000';

    await expect(getTenantRow(missingId)).rejects.toThrow(
      `deprovision-tenant: no "tenants" row for id "${missingId}".`,
    );
  });
});
