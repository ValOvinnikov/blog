import { GRACE_EMAIL } from '@blog/db/constants';
import { claimGraceEmail } from '@blog/db/queries/tenants/claim-grace-email';
import { getTenantById } from '@blog/db/queries/tenants/get-tenant-by-id';
import { listTenantsDueForGraceEnd } from '@blog/db/queries/tenants/list-tenants-due-for-grace-end';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { graceStartedDaysAgo } from '@blog/db/testing/tenants/grace';

import { endDowngradeGrace } from './end-downgrade-grace';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_GRACE_ENDED_START = graceStartedDaysAgo(14);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsDueForGraceEnd, () => {
  it('lists the tenants whose grace has run 14 days', async () => {
    const due = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_GRACE_ENDED_START,
    });
    await insertTestTenant(db(), {
      downgradeGraceStartedAt: graceStartedDaysAgo(13),
    });
    await insertTestTenant(db());

    const listed = await listTenantsDueForGraceEnd(MOCK_NOW);

    expect(listed.map(({ id }) => id)).toEqual([due.id]);
  });
});

describe(endDowngradeGrace, () => {
  it('clears the grace and its email stamps', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: graceStartedDaysAgo(13),
    });
    await claimGraceEmail(tenant.id, GRACE_EMAIL.ENDING, MOCK_NOW);

    await expect(
      endDowngradeGrace(tenant.id, graceStartedDaysAgo(13)),
    ).resolves.toBe(true);

    const ended = await getTenantById(tenant.id);
    expect(ended?.downgradeGraceStartedAt).toBeNull();
    expect(ended?.graceEndingEmailSentAt).toBeNull();
  });

  it('leaves a grace that restarted since it was read', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_NOW,
    });

    await expect(
      endDowngradeGrace(tenant.id, MOCK_GRACE_ENDED_START),
    ).resolves.toBe(false);
  });
});
