import { CAPABILITY, TENANT_PLAN } from '@shinefold/config/constants';
import { useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertClosedTestEntitlementGrants,
  insertTestEntitlementGrant,
  useEntitlementGrantAdmin,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getTenantEntitlements } from './get-tenant-entitlements';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db, { plan: TENANT_PLAN.FREE });
const admin = useEntitlementGrantAdmin(db);
useFrozenClock();

describe(getTenantEntitlements, () => {
  it("adds an open grant's capability to the plan's", async () => {
    await insertTestEntitlementGrant(db(), tenant().id, {
      key: CAPABILITY.NEWSLETTER,
      grantedBy: admin(),
    });

    const { capabilities } = await getTenantEntitlements(tenant());

    expect(capabilities).toContain(CAPABILITY.NEWSLETTER);
  });

  it('leaves out revoked and expired grants', async () => {
    await insertClosedTestEntitlementGrants(db(), tenant().id);

    const { capabilities } = await getTenantEntitlements(tenant());

    expect(capabilities).not.toContain(CAPABILITY.CONTACT_FORM);
    expect(capabilities).not.toContain(CAPABILITY.ANALYTICS);
  });
});
