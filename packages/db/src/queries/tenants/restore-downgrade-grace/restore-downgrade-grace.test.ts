import { TENANT_PLAN } from '@shinefold/config/constants';
import { endDowngradeGrace } from '@shinefold/db/queries/tenants/end-downgrade-grace';
import { listTenantsDueForGraceEnd } from '@shinefold/db/queries/tenants/list-tenants-due-for-grace-end';
import { tenants } from '@shinefold/db/schema/tenants';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { daysBeforeNow } from '@shinefold/db/testing/tenants/grace';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';
import { eq } from 'drizzle-orm';

import { restoreDowngradeGrace } from './restore-downgrade-grace';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_GRACE_START = daysBeforeNow(14);
const MOCK_GIVEN_BACK = {
  graceStartedAt: MOCK_GRACE_START,
  downgradedFromPlan: TENANT_PLAN.GROWTH,
};
const tenant = useTestTenant(db, {
  downgradeGraceStartedAt: MOCK_GRACE_START,
  downgradedFromPlan: TENANT_PLAN.GROWTH,
});

describe(restoreDowngradeGrace, () => {
  beforeEach(async () => {
    await endDowngradeGrace(tenant().id, MOCK_GRACE_START);
  });

  it('gives an ended grace back, so the next day’s sweep finds it due again', async () => {
    await expect(
      restoreDowngradeGrace(tenant().id, MOCK_GIVEN_BACK),
    ).resolves.toBe(true);

    const due = await listTenantsDueForGraceEnd(daysAfter(MOCK_NOW, 1));
    expect(due.map(({ id }) => id)).toEqual([tenant().id]);
    expect(due[0]?.downgradedFromPlan).toBe(TENANT_PLAN.GROWTH);
  });

  it('leaves a site that paid in between untouched', async () => {
    await db()
      .update(tenants)
      .set({ plan: TENANT_PLAN.GROWTH })
      .where(eq(tenants.id, tenant().id));

    await expect(
      restoreDowngradeGrace(tenant().id, MOCK_GIVEN_BACK),
    ).resolves.toBe(false);
    await expect(
      listTenantsDueForGraceEnd(daysAfter(MOCK_NOW, 1)),
    ).resolves.toEqual([]);
  });
});
