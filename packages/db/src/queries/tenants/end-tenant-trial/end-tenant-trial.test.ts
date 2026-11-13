import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { listTenantsWithEndedTrial } from '@blog/db/queries/tenants/list-tenants-with-ended-trial';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mockStripeIds } from '@blog/db/testing/tenants/billing';
import { daysBeforeNow } from '@blog/db/testing/tenants/grace';
import { MOCK_SELF_SERVE_OWNER_EMAIL_INDEX } from '@blog/db/testing/tenants/self-serve-fixtures';

import { endTenantTrial } from './end-tenant-trial';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_TRIAL_ENDED_AT = daysBeforeNow(1);

function insertTrial(
  overrides: Partial<typeof schema.tenants.$inferInsert> = {},
) {
  return insertTestTenant(db(), {
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt: MOCK_TRIAL_ENDED_AT,
    selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
    ...overrides,
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(endTenantTrial, () => {
  describe('an unpaid trial past its end', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTrial());
    });

    it('moves to Free and starts its grace', async () => {
      const ended = await endTenantTrial(tenantId, MOCK_NOW);

      expect(ended).toMatchObject({
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        downgradeGraceStartedAt: MOCK_NOW,
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      });
    });

    it('ends once, however many sweeps ask', async () => {
      await endTenantTrial(tenantId, MOCK_NOW);

      await expect(endTenantTrial(tenantId, MOCK_NOW)).resolves.toBeNull();
    });
  });

  it.each([
    ['still running', { trialEndsAt: new Date(MOCK_NOW.getTime() + 1) }],
    ['with a subscription', mockStripeIds()],
    ['already archived', { deprovisionedAt: MOCK_TRIAL_ENDED_AT }],
    ['suspended', { status: TENANT_STATUS.SUSPENDED }],
  ])('leaves a trial %s alone', async (_, overrides) => {
    const tenant = await insertTrial(overrides);

    await expect(endTenantTrial(tenant.id, MOCK_NOW)).resolves.toBeNull();
    await expect(listTenantsWithEndedTrial(MOCK_NOW)).resolves.toEqual([]);
  });
});

describe(listTenantsWithEndedTrial, () => {
  it('lists every unpaid trial past its end', async () => {
    const tenant = await insertTrial();

    const due = await listTenantsWithEndedTrial(MOCK_NOW);

    expect(due.map(({ id }) => id)).toEqual([tenant.id]);
  });
});
