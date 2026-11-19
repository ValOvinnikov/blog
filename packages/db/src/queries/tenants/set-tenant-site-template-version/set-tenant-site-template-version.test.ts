import { faker } from '@faker-js/faker';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  readTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';

import { setTenantSiteTemplateVersion } from './set-tenant-site-template-version';

vi.mock('@shinefold/db/client');

faker.seed(6020);

const MOCK_TEMPLATE_VERSION = faker.number.int({ min: 1, max: 99 });

const db = useQueryTestDb();
useFrozenClock();
const tenant = useTestTenant(db);

describe(setTenantSiteTemplateVersion, () => {
  it('records the site template version, leaving every other column untouched', async () => {
    await setTenantSiteTemplateVersion(tenant().id, MOCK_TEMPLATE_VERSION);

    const row = await readTestTenant(db(), tenant().id);
    expect(row).toEqual({
      ...tenant(),
      siteTemplateVersion: MOCK_TEMPLATE_VERSION,
      updatedAt: MOCK_NOW,
    });
  });
});
