import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { tenants } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantSiteTemplateVersion } from './set-tenant-site-template-version';

vi.mock('@shinefold/db/client');

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
