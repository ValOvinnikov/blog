import { GRACE_EMAIL, type TGraceEmail } from '@blog/db/constants';
import { listTenantsDueForGraceEmail } from '@blog/db/queries/tenants/list-tenants-due-for-grace-email';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { daysBeforeNow } from '@blog/db/testing/tenants/grace';

import { claimGraceEmail } from './claim-grace-email';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

const MOCK_LATE_ON_START_DAY = new Date('2026-10-08T09:00:02.000Z');

function insertInGrace(days: number) {
  return insertTestTenant(db(), {
    downgradeGraceStartedAt: daysBeforeNow(days),
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(claimGraceEmail, () => {
  it.each([
    [GRACE_EMAIL.STARTED, 0, 'graceStartedEmailSentAt'],
    [GRACE_EMAIL.HALFWAY, 7, 'graceHalfwayEmailSentAt'],
    [GRACE_EMAIL.ENDING, 13, 'graceEndingEmailSentAt'],
  ] as const)('stamps the %s email on day %i', async (email, days, stamp) => {
    const tenant = await insertInGrace(days);

    const claimed = await claimGraceEmail(tenant.id, email, MOCK_NOW);

    expect(claimed?.[stamp]).toEqual(MOCK_NOW);
  });

  it('claims each email once, however many sweeps ask', async () => {
    const tenant = await insertInGrace(7);

    await claimGraceEmail(tenant.id, GRACE_EMAIL.HALFWAY, MOCK_NOW);

    await expect(
      claimGraceEmail(tenant.id, GRACE_EMAIL.HALFWAY, MOCK_NOW),
    ).resolves.toBeNull();
  });

  it.each([
    [GRACE_EMAIL.HALFWAY, 6],
    [GRACE_EMAIL.HALFWAY, 13],
    [GRACE_EMAIL.STARTED, 7],
    [GRACE_EMAIL.ENDING, 14],
  ] as [TGraceEmail, number][])(
    'never claims the %s email on day %i',
    async (email, days) => {
      const tenant = await insertInGrace(days);

      await expect(
        claimGraceEmail(tenant.id, email, MOCK_NOW),
      ).resolves.toBeNull();
    },
  );

  it('sends the day-13 email to a sweep that runs earlier in the day than the grace started', async () => {
    const tenant = await insertTestTenant(db(), {
      downgradeGraceStartedAt: MOCK_LATE_ON_START_DAY,
    });

    const claimed = await claimGraceEmail(
      tenant.id,
      GRACE_EMAIL.ENDING,
      MOCK_NOW,
    );

    expect(claimed?.graceEndingEmailSentAt).toEqual(MOCK_NOW);
  });

  it('claims nothing for a tenant with no grace', async () => {
    const tenant = await insertTestTenant(db());

    await expect(
      claimGraceEmail(tenant.id, GRACE_EMAIL.STARTED, MOCK_NOW),
    ).resolves.toBeNull();
  });
});

describe(listTenantsDueForGraceEmail, () => {
  it('lists only the tenants whose email is due and unsent', async () => {
    const due = await insertInGrace(7);
    const sent = await insertInGrace(8);
    await claimGraceEmail(sent.id, GRACE_EMAIL.HALFWAY, MOCK_NOW);
    await insertInGrace(3);

    const listed = await listTenantsDueForGraceEmail(
      GRACE_EMAIL.HALFWAY,
      MOCK_NOW,
    );

    expect(listed.map(({ id }) => id)).toEqual([due.id]);
  });
});
