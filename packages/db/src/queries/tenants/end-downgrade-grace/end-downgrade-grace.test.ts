import { TENANT_PLAN } from '@shinefold/config/constants';
import { GRACE_EMAIL, TENANT_STATUS } from '@shinefold/db/constants';
import { claimGraceEmail } from '@shinefold/db/queries/tenants/claim-grace-email';
import { listTenantsDueForGraceEnd } from '@shinefold/db/queries/tenants/list-tenants-due-for-grace-end';
import { setTenantPlan } from '@shinefold/db/queries/tenants/set-tenant-plan';
import * as schema from '@shinefold/db/schema';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { daysBeforeNow } from '@shinefold/db/testing/tenants/grace';

import { endDowngradeGrace } from './end-downgrade-grace';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_GRACE_ENDED_START = daysBeforeNow(14);
const MOCK_LATE_ON_START_DAY = new Date('2026-10-07T23:59:59.000Z');

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsDueForGraceEnd, () => {
  it('lists the tenants whose grace has run 14 days', async () => {
    const due = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_GRACE_ENDED_START,
    });
    await insertTestTenant(db(), {
      downgradeGraceStartedAt: daysBeforeNow(13),
    });
    await insertTestTenant(db());

    const listed = await listTenantsDueForGraceEnd(MOCK_NOW);

    expect(listed.map(({ id }) => id)).toEqual([due.id]);
  });

  it('lists a site whose grace runs on a paid plan', async () => {
    const due = await insertTestTenant(db(), {
      plan: TENANT_PLAN.STARTER,
      downgradeGraceStartedAt: MOCK_GRACE_ENDED_START,
    });

    const listed = await listTenantsDueForGraceEnd(MOCK_NOW);

    expect(listed.map(({ id }) => id)).toEqual([due.id]);
  });

  it('counts sweep days, so a grace started late in the day ends on the fourteenth', async () => {
    const lateStart = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_LATE_ON_START_DAY,
    });

    const listed = await listTenantsDueForGraceEnd(MOCK_NOW);

    expect(listed.map(({ id }) => id)).toEqual([lateStart.id]);
  });
});

describe(endDowngradeGrace, () => {
  it('clears the grace and its email stamps', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: daysBeforeNow(13),
    });
    await claimGraceEmail(tenant.id, GRACE_EMAIL.ENDING, MOCK_NOW);

    const ended = await endDowngradeGrace(tenant.id, daysBeforeNow(13));

    expect(ended?.downgradeGraceStartedAt).toBeNull();
    expect(ended?.graceEndingEmailSentAt).toBeNull();
  });

  it('ends a grace running on a paid plan', async () => {
    const tenant = await insertTestTenant(db(), {
      plan: TENANT_PLAN.STARTER,
      downgradeGraceStartedAt: MOCK_GRACE_ENDED_START,
    });

    const ended = await endDowngradeGrace(tenant.id, MOCK_GRACE_ENDED_START);

    expect(ended?.plan).toBe(TENANT_PLAN.STARTER);
    expect(ended?.downgradeGraceStartedAt).toBeNull();
  });

  it('leaves a site whose move back up cleared the grace', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_GRACE_ENDED_START,
    });
    await setTenantPlan(tenant.id, {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
    });

    await expect(
      endDowngradeGrace(tenant.id, MOCK_GRACE_ENDED_START),
    ).resolves.toBeNull();
  });

  it('leaves a grace that restarted since it was read', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_NOW,
    });

    await expect(
      endDowngradeGrace(tenant.id, MOCK_GRACE_ENDED_START),
    ).resolves.toBeNull();
  });
});
