import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { setTenantSiteTemplateVersion } from './set-tenant-site-template-version';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();
useFrozenClock();

const MOCK_TEMPLATE_VERSION = faker.number.int({ min: 1, max: 99 });

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSiteTemplateVersion, () => {
  it('records the site template version, leaving every other column untouched', async () => {
    const tenant = await insertTestTenant(db());

    await setTenantSiteTemplateVersion(tenant.id, MOCK_TEMPLATE_VERSION);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row).toEqual({
      ...tenant,
      siteTemplateVersion: MOCK_TEMPLATE_VERSION,
      updatedAt: MOCK_NOW,
    });
  });
});
