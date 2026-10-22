import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantSiteTemplateVersion } from './set-tenant-site-template-version';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const TEMPLATE_VERSION = 3;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSiteTemplateVersion, () => {
  it('records the site template version, leaving every other column untouched', async () => {
    const tenant = await insertTestTenant(db());

    await setTenantSiteTemplateVersion(tenant.id, TEMPLATE_VERSION);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row).toEqual({
      ...tenant,
      siteTemplateVersion: TEMPLATE_VERSION,
      updatedAt: row?.updatedAt,
    });
  });
});
